# Layer 1

```markdown
## 需求：電商訂單 AI 風險分流

@flow: 收訂單 → AI 風險評分 → 依風險高/中/低三路處理
@trigger: webhook POST /order
@input: { order_id, customer_email, amount, ip, items[] }

@step: 用 OpenAI gpt-4o-mini 評估詐欺風險，回 JSON {score: 0-100, reason: string}
@step: 依 score 三分流:
  - high (score > 70): 開 Jira ticket project=FRAUD + Slack #fraud-alert 警示
  - medium (30 <= score <= 70): 寫入 Postgres review_queue 表等待人工
  - low (score < 30): 寫入 Postgres orders 表並回應 webhook "accepted"
@output: webhook 回 { order_id, status: "high|medium|low|rejected" }
@on-error: slack #ops-alert "訂單處理失敗 order={order_id}: {error}"
@assume: Postgres 表 review_queue / orders 已存在
```
