# <模組/功能名稱> PRD

**FR-ID**：<DOMAIN>-<SUB>-<###>  
**狀態**：📄 草稿｜🚧 開發中｜✅ 完成  
**對應 Issue**：#____  
**最近更新**：YYYY-MM-DD by <owner>  

---

## 1. 背景與目標
- **痛點 / 用戶價值**：＿＿＿＿＿＿＿＿＿  
- **In-Scope**：＿＿＿＿＿＿＿＿＿  
- **Out-of-Scope**：＿＿＿＿＿＿＿＿＿  
- **技術 KPI**：  
  - Latency < ___ ms (P95)  
  - Error rate < ___ %  
  - Uptime ≥ ___ %  

---

## 2. 功能性需求（FR）
> 每個功能需求需標示 FR-ID，並明確定義條件與結果。  

- **FR-1（<FR-ID-1>）**  
  - **行為**：＿＿＿＿＿＿＿＿＿  
  - **條件 / 觸發**：＿＿＿＿＿＿＿＿＿  
  - **輸出 / 系統反應**：＿＿＿＿＿＿＿＿＿  
  - **優先級**：P0｜P1｜P2  

- **FR-2（<FR-ID-2>）**  
  - **行為**：＿＿＿＿＿＿＿＿＿  
  - **條件 / 觸發**：＿＿＿＿＿＿＿＿＿  
  - **輸出 / 系統反應**：＿＿＿＿＿＿＿＿＿  
  - **優先級**：P0｜P1｜P2  

---

## 3. 非功能性需求（NFR）
- **效能**：P95 latency < ___ ms；吞吐量 ≥ ___ req/sec  
- **安全**：支援 TLS 1.3；RBAC；防 SQL Injection / XSS  
- **可用性**：SLA ≥ ___%；Failover < ___ 秒  
- **擴展性**：支援水平擴展（至少 ___ 台節點）  
- **可維運性**：  
  - Log 格式：＿＿＿＿＿＿＿＿＿  
  - 監控指標：error_rate, TPS, memory_usage  

---

## 4. 用戶故事
- **正向故事**：  
  身為【＿＿＿】，我希望【＿＿＿】，因為【＿＿＿】。  

- **反向故事**：  
  當【＿＿＿】時，系統應【＿＿＿】。  

- **極端故事**：  
  當【一次處理 ___ 筆資料】時，系統仍應【＿＿＿】。  

---

## 5. 系統設計要素
- **資料模型 (Entity / Schema)**  
  ```plaintext
  User(
    id: UUID,
    email: string,
    password_hash: string,
    role: enum,
    created_at: timestamp
  )
  ```

- **流程圖 (Mermaid 範例)**  
  ```mermaid
  sequenceDiagram
    User ->> API: 提交登入請求
    API ->> Auth Service: 驗證帳號密碼
    Auth Service -->> API: 回傳 Token
    API -->> User: 登入成功
  ```

- **API 契約**  
  - **Endpoint**：`POST /api/v1/login`  
  - **Request**：`{ email: string, password: string }`  
  - **Response**：  
    - `200 OK { token: string, expires_in: int }`  
    - `401 Unauthorized { error: "Invalid credentials" }`  

---

## 6. 驗收標準（AC）
- [ ] 當 email 格式錯誤 → 回傳 400  
- [ ] 當密碼錯誤 ≥5 次 → 鎖定帳號 15 分鐘  
- [ ] 在 1000 TPS 下，P95 latency <200ms  
- [ ] SQL Injection 攻擊測試不得通過  

---

## 7. 風險與依賴
- **依賴服務**：Auth Service、DB、外部 OAuth Provider  
- **技術債風險**：密碼雜湊演算法需未來可替換  
- **相容性風險**：API 變更需向前相容  
- **資料品質風險**：外部 provider Token 過期策略需明確  

---

## 8. 追蹤
- **相關 PR**：#____  
- **Owner**：＿＿＿  
- **測試覆蓋率要求**：  
  - Unit Test ≥ ___ %  
  - Integration Test ≥ ___ %  
  - End-to-End Test ≥ ___ %  
- **驗證環境**：Staging / Sandbox  

---
