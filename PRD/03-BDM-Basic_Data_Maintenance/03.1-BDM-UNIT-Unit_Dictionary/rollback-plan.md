# BDM-UNIT 單位管理模組 - 回滾計畫

## 概述
本文檔定義了BDM-UNIT模組在遷移或更新失敗時的回滾策略和步驟。

## 回滾觸發條件

### 自動觸發
- API錯誤率 > 5%（連續5分鐘）
- 響應時間 > 5秒（連續3分鐘）
- 系統健康檢查連續3次失敗
- 數據庫連線失敗
- 關鍵功能測試失敗

### 手動觸發
- 用戶大量投訴
- 數據不一致問題
- 安全漏洞發現
- 業務邏輯錯誤

## 回滾策略

### 策略1：藍綠部署回滾（推薦）
適用於：生產環境
優點：零停機時間，風險最低

```bash
# 步驟 1: 切換流量到舊版本
kubectl set image deployment/bdm-unit bdm-unit=gcr.io/tsaitung/bdm-unit:v1.0.0

# 步驟 2: 驗證服務狀態
kubectl rollout status deployment/bdm-unit

# 步驟 3: 健康檢查
curl -X GET https://api.erp.com/v1/units/health
```

### 策略2：數據庫回滾
適用於：數據結構變更
注意：可能造成數據丟失

```sql
-- 步驟 1: 停止應用服務
-- kubectl scale deployment bdm-unit --replicas=0

-- 步驟 2: 恢復數據庫
DROP TABLE IF EXISTS units;
RENAME TABLE units_backup_20250820 TO units;

-- 步驟 3: 重建索引
ALTER TABLE units ADD INDEX idx_unit_name (unitName);
ALTER TABLE units ADD INDEX idx_unit_type (unitType);

-- 步驟 4: 驗證數據
SELECT COUNT(*) FROM units;
```

### 策略3：代碼回滾
適用於：緊急Bug修復

```bash
# 步驟 1: 回滾到上一個穩定版本
git revert HEAD
git push origin main

# 步驟 2: 觸發CI/CD
gh workflow run deploy.yml

# 步驟 3: 監控部署
gh run watch
```

## 詳細回滾步驟

### 階段1：準備（5分鐘）

#### 1.1 通知相關人員
```bash
# 發送通知
curl -X POST https://api.slack.com/notify \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "#ops-alert",
    "text": "開始執行BDM-UNIT模組回滾",
    "urgency": "high"
  }'
```

#### 1.2 備份當前狀態
```bash
# 備份當前數據
mysqldump -h prod-db -u admin -p erp_db units > units_rollback_backup.sql

# 備份應用配置
kubectl get configmap bdm-unit-config -o yaml > config_backup.yaml

# 備份日誌
kubectl logs deployment/bdm-unit --tail=10000 > logs_backup.txt
```

### 階段2：執行回滾（10分鐘）

#### 2.1 停止新版本流量
```bash
# 方案A: 使用特性開關
curl -X POST https://api.erp.com/admin/feature-flags \
  -d '{"bdm_unit_v2": false}'

# 方案B: 調整負載均衡
kubectl patch service bdm-unit-service \
  -p '{"spec":{"selector":{"version":"v1"}}}'
```

#### 2.2 回滾應用
```bash
# Kubernetes回滾
kubectl rollout undo deployment/bdm-unit

# 或指定版本
kubectl rollout undo deployment/bdm-unit --to-revision=3

# 監控回滾狀態
kubectl rollout status deployment/bdm-unit -w
```

#### 2.3 回滾數據（如需要）
```sql
-- 連接數據庫
mysql -h prod-db -u admin -p erp_db

-- 執行回滾腳本
SOURCE /path/to/rollback_script.sql;

-- 驗證數據完整性
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT unitName) as unique_units,
    MIN(created_at) as earliest,
    MAX(created_at) as latest
FROM units;
```

### 階段3：驗證（10分鐘）

#### 3.1 功能驗證
```bash
# API健康檢查
curl -X GET https://api.erp.com/v1/units/health

# 基本功能測試
curl -X GET https://api.erp.com/v1/units?limit=10

# 創建測試
curl -X POST https://api.erp.com/v1/units \
  -H "Content-Type: application/json" \
  -d '{"unitName":"回滾測試","unitType":"測試"}'
```

#### 3.2 性能驗證
```bash
# 響應時間測試
for i in {1..100}; do
  time curl -X GET https://api.erp.com/v1/units
done

# 負載測試
ab -n 1000 -c 10 https://api.erp.com/v1/units/
```

#### 3.3 數據一致性驗證
```sql
-- 檢查關鍵數據
SELECT 
    'units' as table_name,
    COUNT(*) as record_count,
    MAX(updated_at) as last_update
FROM units

UNION ALL

SELECT 
    'items' as table_name,
    COUNT(*) as record_count,
    MAX(updated_at) as last_update
FROM items
WHERE unit_id IN (SELECT id FROM units);
```

### 階段4：監控（持續）

#### 4.1 設置監控告警
```yaml
# prometheus-alert.yaml
groups:
  - name: bdm-unit-rollback
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{job="bdm-unit",status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "BDM-UNIT高錯誤率"
          
      - alert: SlowResponse
        expr: http_request_duration_seconds{job="bdm-unit",quantile="0.95"} > 2
        for: 3m
        annotations:
          summary: "BDM-UNIT響應緩慢"
```

#### 4.2 監控儀表板
```json
{
  "dashboard": "BDM-UNIT-Rollback-Monitor",
  "panels": [
    {
      "title": "API錯誤率",
      "query": "rate(http_requests_total{status=~'5..'}[5m])"
    },
    {
      "title": "響應時間",
      "query": "histogram_quantile(0.95, http_request_duration_seconds)"
    },
    {
      "title": "活躍用戶數",
      "query": "count(rate(http_requests_total[5m]) > 0)"
    }
  ]
}
```

## 回滾後處理

### 1. 根因分析
```markdown
## 事故報告模板

### 事故概述
- 發生時間：
- 影響範圍：
- 持續時間：
- 影響用戶數：

### 根本原因
- 直接原因：
- 根本原因：
- 貢獻因素：

### 時間線
- T+0: 問題發現
- T+5: 開始回滾
- T+15: 回滾完成
- T+25: 服務恢復

### 改進措施
1. 短期措施：
2. 長期改進：
3. 預防措施：
```

### 2. 數據修復
```sql
-- 識別受影響數據
SELECT * FROM units 
WHERE updated_at BETWEEN '2025-08-20 10:00:00' AND '2025-08-20 11:00:00';

-- 修復數據不一致
UPDATE units u1
INNER JOIN units_backup u2 ON u1.id = u2.id
SET u1.conversionToKG = u2.conversionToKG
WHERE u1.conversionToKG != u2.conversionToKG;
```

### 3. 溝通計畫
- 內部團隊：立即通知
- 受影響用戶：30分鐘內郵件通知
- 管理層：1小時內事故報告
- 公開聲明：如影響重大，2小時內發布

## 預防措施

### 1. 測試強化
- 增加整合測試覆蓋率到90%
- 實施金絲雀發布
- 強化壓力測試

### 2. 監控改進
- 降低告警閾值
- 增加業務指標監控
- 實施預測性告警

### 3. 流程優化
- 建立回滾演練機制
- 完善變更管理流程
- 強化代碼審查

## 回滾檢查清單

### 執行前
- [ ] 確認回滾原因和影響範圍
- [ ] 通知所有相關人員
- [ ] 準備回滾腳本和工具
- [ ] 備份當前狀態

### 執行中
- [ ] 停止新版本流量
- [ ] 執行回滾命令
- [ ] 監控回滾進度
- [ ] 記錄關鍵步驟

### 執行後
- [ ] 驗證服務狀態
- [ ] 檢查數據一致性
- [ ] 性能測試
- [ ] 用戶驗證

### 後續跟進
- [ ] 編寫事故報告
- [ ] 修復根本問題
- [ ] 更新文檔
- [ ] 安排複盤會議

## 聯絡資訊

### 緊急聯絡人
| 角色 | 姓名 | 電話 | Email |
|------|------|------|-------|
| 技術負責人 | [姓名] | [電話] | [email] |
| 運維負責人 | [姓名] | [電話] | [email] |
| 產品負責人 | [姓名] | [電話] | [email] |
| DBA | [姓名] | [電話] | [email] |

### 支援資源
- 監控儀表板：https://monitoring.erp.com/bdm-unit
- 日誌系統：https://logs.erp.com/bdm-unit
- Wiki：https://wiki.erp.com/bdm-unit-rollback
- Slack頻道：#bdm-unit-support

## 附錄

### A. 常見問題處理

#### 問題1：數據庫連線失敗
```bash
# 檢查連線
mysql -h prod-db -u admin -p -e "SELECT 1"

# 重啟連線池
kubectl delete pod -l app=bdm-unit
```

#### 問題2：快取不一致
```bash
# 清理Redis快取
redis-cli FLUSHDB

# 重建快取
curl -X POST https://api.erp.com/admin/cache/rebuild
```

#### 問題3：配置錯誤
```bash
# 恢復配置
kubectl apply -f config_backup.yaml

# 重啟服務
kubectl rollout restart deployment/bdm-unit
```

### B. 回滾腳本範例
```bash
#!/bin/bash
# rollback.sh - BDM-UNIT緊急回滾腳本

set -e

echo "開始BDM-UNIT回滾..."

# 1. 備份
echo "備份當前狀態..."
kubectl get all -n production > backup_$(date +%Y%m%d_%H%M%S).yaml

# 2. 回滾
echo "執行回滾..."
kubectl rollout undo deployment/bdm-unit -n production

# 3. 等待
echo "等待服務穩定..."
kubectl rollout status deployment/bdm-unit -n production

# 4. 驗證
echo "驗證服務..."
curl -f https://api.erp.com/v1/units/health || exit 1

echo "回滾完成！"
```

---

**文檔版本**: v1.0.0
**最後更新**: 2025-08-20
**下次審查**: 2025-09-20