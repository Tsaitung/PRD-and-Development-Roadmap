# GitHub Repo → Workflow 全流程教學

## 1️⃣ 建立檔案結構
1. 在本地電腦或直接 GitHub 上，新增資料夾：
   ```
   docs/prd/
   docs/prd/modules/
   docs/scripts/
   ```
2. 把我幫你產生的 `tsaitung-prd-init.zip` 解壓縮到 repo 裡，會自動建立 11 個模組和所有子模組的 `.md` 檔案。

3. 確認有這些檔案：
   - `docs/prd/README.md`（TOC 總覽）
   - `docs/prd/modules/...`（各模組的 PRD 空白檔）
   - `docs/scripts/parse_prd_diff.py` 等三個腳本（目前是 placeholder）

---

## 2️⃣ 上傳到 GitHub
1. 在本地端打開 repo 資料夾，執行：
   ```bash
   git add .
   git commit -m "feat: 初始化 PRD 架構與 TOC"
   git push origin main
   ```
2. 或者，如果你直接在 GitHub 網頁操作，也可以把 ZIP 解壓後的檔案全部拖進去，GitHub 會自動 commit。

---

## 3️⃣ 建立 GitHub Actions Workflow
1. 在 repo 裡新增資料夾：  
   `.github/workflows/`
2. 新增檔案 **`prd-detect.yml`**：
   ```yaml
   name: PRD Detect & Issue Sync

   on:
     push:
       branches: [ main ]
       paths:
         - "docs/prd/modules/**.md"

   jobs:
     detect:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Setup Python
           uses: actions/setup-python@v5
           with:
             python-version: "3.x"

         - name: Parse PRD Diff
           run: python docs/scripts/parse_prd_diff.py > diff.json

         - name: Sync Issues
           env:
             GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
           run: python docs/scripts/sync_github_issues.py diff.json
   ```

3. 新增檔案 **`status-update.yml`**：
   ```yaml
   name: Status & Coverage Update

   on:
     push:
       branches: [ dev, main ]

   jobs:
     test-and-update:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Setup Node
           uses: actions/setup-node@v4
           with:
             node-version: "20"

         - name: Install deps
           run: npm ci

         - name: Run tests with coverage
           run: npm run test:ci

         - name: Update TOC status
           env:
             GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
             ENVIRONMENT: ${{ github.ref == 'refs/heads/main' && 'Prod' || 'Dev' }}
           run: python docs/scripts/update_toc_status.py --env "$ENVIRONMENT" --coverage "coverage/coverage-summary.json"

         - name: Commit TOC
           run: |
             git config user.name "github-actions[bot]"
             git config user.email "github-actions[bot]@users.noreply.github.com"
             git add docs/prd/README.md
             git commit -m "docs(TOC): 更新狀態與覆蓋率 [skip ci]" || echo "No changes"
             git push
   ```

---

## 4️⃣ 檢查 Workflow 是否運作
1. Push 以上兩個 workflow 檔後，去 GitHub repo 頁面 → **Actions** 分頁。  
2. 會看到兩條新的 workflow：
   - `PRD Detect & Issue Sync`
   - `Status & Coverage Update`
3. 測試：修改任何一個 PRD `.md` 檔並 push → 你會看到 workflow 被觸發。

---

## 5️⃣ 前端整合 Navbar
1. 在前端專案新增 `nav.config.ts`：
   ```ts
   export const NAV = [
     { label: 'Dashboard', path: '/dashboard', status: 'draft' },
     { label: 'CRM', children: [
         { label: '客戶主檔', path: '/crm/customers', status: 'draft' },
         { label: '定價管理', status: 'planned' }, // 待開發
       ]
     }
   ];
   ```

2. 建立 `NavItem.tsx` 元件，渲染 `NAV` 陣列，對 `status: 'planned'` 的項目加灰色字和「待開發」提示。

---

## 6️⃣ 治理規則（新手必守）
- 新增功能 → 先補 PRD（至少有 FR-ID 和背景）。  
- 修改 PRD → 一律透過 Pull Request，不可直接改 main。  
- 每個功能需求（FR）必須有一個 Issue（自動化會幫忙）。  
- 測試覆蓋率不到標準（核心流要 100%）不可合併到 main。  
- `docs/prd/README.md`（TOC）是唯一真實來源，前端 Navbar 必須跟它一致。  
