# Test 3：Telegram bot → OpenAI → Telegram

## 情境
建立一個 Telegram bot，使用者傳訊息 → bot 透過 OpenAI 回覆 → 回傳到原對話。

## 模式
全新情境（cookbook 沒有），但語料中 telegram (176) + telegramTrigger (94) 高頻。

## 驗證目標
- DSL `@trigger: telegram` 是否能被合理推論（spec §3 沒明列）
- 雙向通訊（trigger 與 output 都用同一服務）是否正確處理
- chat_id 跨節點引用
