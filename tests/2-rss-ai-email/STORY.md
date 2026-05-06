# Test 2：定時抓 RSS → AI 摘要 → Email

## 情境
產品經理希望每天早上 09:00 收到一封信，包含過去 24 小時內 Hacker News 前 10 篇文章的 AI 摘要。

## 模式
Cookbook 02 的變化情境：把 HTTP API 換成 RSS Feed，加上 LLM 摘要步驟。

## 驗證目標
- DSL 是否能描述 RSS trigger（cookbook 沒直接示範）
- AI 是否能正確選 `rssFeedRead` 節點（無對應 node-frequency Top 30）
- 多步驟 chain（RSS → limit → loop → AI → aggregate → email）是否串對
