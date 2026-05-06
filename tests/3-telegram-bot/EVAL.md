# Test 3 自評

| 檢查項 | 結果 |
|---|---|
| JSON 可解析 | ✅ |
| 三層結構 | ✅ |
| `@trigger: telegram` 推論 | ✅ AI 從語料常識選 telegramTrigger |
| 雙向通訊（trigger 與回 output 同服務） | ✅ |
| chat_id 跨節點引用（避免被 OpenAI 覆蓋） | ✅ 用 `$('Telegram Trigger').item.json` |
| @on-error 走 IF + continueOnFail | ✅ |
| 反模式檢查 | ✅ |

## 發現的 spec 缺口
1. **DSL §3 (`@trigger` 詞彙表) 沒列 `telegram`**——只有 webhook/schedule/form/manual/email/error。應補 `telegram`、`slack`、`discord`、`googleDriveTrigger` 等常見 trigger。
2. **`@on-error` 第二種實作模式（continueOnFail + IF）** 與 Test 2 的 Error Trigger workflow 並存，spec 應明說兩種模式何時用哪種。
3. **跨節點變數引用 gotcha** —— 用 `$('NodeName').item.json` 而非 `$json` 是常踩坑。已在 cookbook 04 提過一次，但 spec 主文件未提。

## 結論
✅ **通過**。需擴充 DSL §3 trigger 字典 + 補「@on-error 兩種模式」說明。
