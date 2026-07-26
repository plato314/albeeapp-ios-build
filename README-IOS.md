# 代購記帳工具 iOS 版

此專案已同時保留 Android，並新增 Capacitor iOS 15+ 原生專案。訂單、收款、設定、照片、完整備份與 Excel 共用同一套功能與資料格式。

## 開發需求

- macOS
- Xcode 26 或更新版本
- Node.js 24
- Apple Developer 帳號（實機簽署、TestFlight 與 App Store 上架需要）

2026 年 4 月 28 日起，App Store Connect 要求 iOS App 使用 Xcode 26 與 iOS 26 SDK 或更新版本建置。

## 同步並開啟 Xcode

在 Mac 的專案根目錄執行：

```bash
npm install
npm run verify
npm run open:ios
```

`open:ios` 會先重新建立離線 Web 資源、同步相機／Filesystem／分享外掛，再開啟 Xcode 專案。

## 第一次在 Xcode 執行

1. 選取 `App` target。
2. 在 Signing & Capabilities 選擇你的 Apple Developer Team。
3. 確認 Bundle Identifier 為 `tw.albee.purchaseledger`，且尚未被其他開發者註冊；若必須更換，首次上架前一次改定。
4. 選擇 iPhone 模擬器或已配對的實機後按 Run。
5. 實機測試相機、相簿、完整備份、還原備份、Excel 分享與網路匯率。

## TestFlight／App Store

1. 先在 App Store Connect 建立相同 Bundle ID 的 App。
2. 在 Xcode 選擇實機建置目的地，使用 Product > Archive。
3. 在 Organizer 執行 Distribute App > App Store Connect。
4. 填寫 App 隱私權、年齡分級、支援網址、隱私權政策網址、售價、說明、關鍵字與螢幕截圖。
5. 先發佈到 TestFlight 驗收，再送 App Review。

目前 App 不含廣告、分析或跨 App 追蹤；訂單與照片保存在裝置本機，只有使用者主動備份、導出或分享時才會離開 App。App Store Connect 的隱私權回答仍需由上架帳號持有人依實際營運方式確認。

## 只安裝到自己的 iPhone（Windows）

不公開上架時，可使用 `.github/workflows/build-ios-unsigned.yml` 在 GitHub Actions 的 macOS 26 環境產生未簽章 IPA：

1. 將專案放入私人 GitHub 儲存庫。
2. 在 Actions 執行 `Build unsigned iOS IPA`。
3. 下載 `purchase-ledger-unsigned-ipa` 建置成品。
4. 在 Windows 安裝 Sideloadly，連接 iPhone。
5. 將 IPA 拖入 Sideloadly，使用自己的 Apple ID 簽署並安裝。

免費 Apple ID 不需要 App Store 上架，但簽署通常只有 7 天效期，需要由電腦定期重新簽署。Apple ID 與驗證碼只應輸入 Apple／Sideloadly 的本機登入介面，不要寫進專案或 GitHub。

## 更新既有 iOS App

- 沿用相同 Bundle Identifier 與 Apple Developer Team。
- 每次上傳提高 Xcode 的 Build number。
- 使用同一 App Store Connect App 發佈新版。
- 更新前仍建議先在 App 內執行「完整備份」。
