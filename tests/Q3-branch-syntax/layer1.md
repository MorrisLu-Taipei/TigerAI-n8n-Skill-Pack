# Layer 1（DSL v1.1 改寫版）

```markdown
## 需求：電商訂單 AI 風險分流

@flow: 收訂單 → AI 風險評分 → 依風險高/中/低三路處理
@trigger: webhook POST /order
@input: { order_id, customer_email, amount, ip, items[] }

@step: AI 風險評分（OpenAI gpt-4o-mini）→ 回 {score: 0-100, reason: string}

@branch: high when score > 70
  - jira project=FRAUD create issue summary "High-risk order {order_id}"
  - slack #fraud-alert "⚠️ High-risk order {order_id} score={score}"

@branch: medium when score >= 30 and score <= 70
  - postgres insert review_queue (order_id, score, reason, payload)

@branch: low when score < 30
  - postgres insert orders (order_id, customer_email, amount, risk_score)

@output: webhook 回 { order_id, status: <branch_name> }
@on-error: slack #ops-alert "訂單處理失敗 order={order_id}: {error}"
@assume: Postgres 表 review_queue / orders 已存在
```

> 注意：使用者**沒寫 fallback**。依 spec/sticky-note-dsl.md §2.4 規定，AI 必須自動補 `fallback when otherwise` 並在 Layer 3 標註「使用者未明示，預設 noOp」。
