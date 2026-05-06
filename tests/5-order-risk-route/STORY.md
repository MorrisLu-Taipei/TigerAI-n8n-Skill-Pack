# Test 5：訂單 → AI 風險分 → 分流

## 情境
電商收訂單後，AI 評估詐欺風險分（0–100），高風險（>70）開 Jira ticket + Slack 警示，中風險（30–70）排程人工複核，低風險直接寫 DB 出貨。

## 模式
最複雜的複合：A（webhook）+ E（switch 分流）+ G（錯誤通報）+ 多步驟整形。

## 驗證目標
- 多 step + 三路分流 spec 是否撐得起
- LLM 結構化輸出 + 後續邏輯
- 跨節點變數引用（webhook payload 在多個下游使用）
- Layer 3 是否完整列出所有風險與 credentials
