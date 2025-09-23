# 🚀 部署腳本與文件

此資料夾包含所有與 Black Living 電子商務專案相關的部署腳本和文件。

## 📁 內容

### 🔧 腳本

- **`deploy.sh`** - 用於所有環境的主要自動化部署腳本
- **`test-build.sh`** - 建置驗證腳本（在部署前運行）

### 📚 文件

- **`DEPLOYMENT.md`** - 包含逐步說明的完整部署指南
- **`Deploy_options.md`** - 不同部署方法的快速參考

## 🚀 快速入門

### 從專案根目錄運行

```bash
# 先測試建置
./deployment/test-build.sh

# 部署到生產環境
./deployment/deploy.sh production

# 部署到預備環境
./deployment/deploy.sh staging
```

### 可用的部署方法

1.  **自動化腳本** (建議)

    ```bash
    ./deployment/deploy.sh production
    ```

2.  **手動指令**

    ```bash
    # 個別應用程式部署
    cd apps/api && pnpm deploy
    cd apps/web && pnpm deploy
    cd apps/admin && pnpm deploy
    ```

3.  **GitHub Actions**
    - 推送到 `main` → 生產環境部署
    - 推送到 `staging` → 預備環境部署

## 📋 先決條件

- 已安裝並驗證 **Wrangler CLI**
- **PNPM** 套件管理器
- 已建立 **Cloudflare 資源** (D1, R2, KV, Pages 專案)
- 已在 Cloudflare Workers 中設定 **Secrets**

## 🔒 安全性

所有腳本均遵循安全性最佳實踐：

- 無硬式編碼的密鑰
- 環境驗證
- 錯誤處理與回滾功能
- 全面的日誌記錄

## 📖 文件

有關詳細的部署說明，請參閱：

- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - 完整部署指南
- [`Deploy_options.md`](./Deploy_options.md) - 快速部署選項
- [`../PROJECT_MAINTENANCE.md`](../PROJECT_MAINTENANCE.md) - 持續維護

---

**需要協助嗎？** 請查看文件檔案或建立 GitHub issue。
