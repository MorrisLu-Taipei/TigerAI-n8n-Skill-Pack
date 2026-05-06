# Test Q3 自評（DSL v1.1 `@branch` 語法重跑 Test 5）

| 檢查項 | 結果 |
|---|---|
| `@branch` 語法解析正確 | ✅ |
| AI 自動補 fallback（使用者未寫）| ✅ DSL v1.1 §2.4 強制執行 |
| Layer 3 標註「使用者未明示 fallback，AI 自補」| ✅ |
| Switch fallbackOutput=extra 正確設定 | ✅ |
| 四路收斂（含 fallback 也走 Set + Merge）| ✅ 避免 webhook 卡死 |
| JSON 解析通過 | ✅ 16 節點 / 13 connections |
| 與 Test 5 邏輯等價 | ✅ |
| 比 Test 5 多 2 節點（fallback noOp + Set unknown） | ✅ 為嚴謹度付出代價 |

## v1.1 vs v1.0（Test 5）對比表

| 維度 | Test 5（v1.0 自然語言）| Test Q3（v1.1 `@branch`）|
|---|---|---|
| Layer 1 字數 | 多（含完整描述）| 略多（語法稍嚴格但同等清楚）|
| AI 解析難度 | 需 NLP 推論 | 直接結構化提取 |
| Fallback 處理 | ❌ 漏（驗收揭露） | ✅ AI 強制補 |
| Workflow 節點數 | 14 | 16（+ fallback noOp + Set unknown）|
| 安全性 | 中（NaN 可能卡住）| 高（fallback 必入流）|
| 可維護性 | 中 | 高（語意明確）|

## DSL v1.1 設計驗證

### `@branch` 語法成功傳達的資訊
- ✅ 路徑名稱（high/medium/low）
- ✅ 條件運算式（>, >=, <=, and）
- ✅ 動作清單（- jira, - slack）
- ✅ 動作的關鍵參數（project=FRAUD, channel=#fraud-alert）

### `@branch` 語法尚未支援
- ⚠️ **跨路徑共用變數**：例如所有路徑都要存一筆 audit log，目前需手動在每路寫一次
- ⚠️ **路徑優先順序**：Switch 在 n8n 預設「第一個 match 即停」；DSL 沒明說 ordering，靠書寫順序

## 結論
✅ **通過**。DSL v1.1 `@branch` 語法達成設計目標：嚴謹度上升、安全性提升、AI 解析難度下降。**建議**所有複雜分流情境都改用 v1.1 語法。

未來增強：考慮加 `@before-branch` / `@after-branch` 標籤處理跨路徑共用邏輯。
