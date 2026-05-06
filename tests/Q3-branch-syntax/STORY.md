# Test Q3：重跑 Test 5 用新 `@branch` 語法

## 情境
Test 5（訂單 → AI 風險分流）原本 Layer 1 用自然語言寫分流：
```
@step: 依 score 三分流:
  - high (score > 70): 開 Jira ticket project=FRAUD + Slack #fraud-alert 警示
  - medium (30 <= score <= 70): 寫入 Postgres review_queue 表等待人工
  - low (score < 30): 寫入 Postgres orders 表並回應 webhook "accepted"
```

DSL v1.1（spec/sticky-note-dsl.md §2.4）新增 `@branch` 嚴格語法。本測試驗證：
1. 新語法能否取代自然語言？
2. AI 是否會自動補 `fallback` 路徑（spec 強制規定）？
3. 產出 workflow 與 Test 5 是否邏輯等價但結構更清晰？
