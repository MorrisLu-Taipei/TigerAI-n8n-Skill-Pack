# Verified Runnable Examples — 真實跑過的 workflow

> 🌐 [English](_runnable-README.en.md) | **繁體中文**

> 與 cookbook 範例（教學用 markdown）和 `_starter-*` 模板（空白起手式）不同：
> 這裡的 JSON 是**真的在 n8n 2.10.3 環境跑過、curl 觸發成功、execution status=success** 的 workflow。
> 給客戶當作「保證能 import + 能 activate + webhook 能觸發」的最低風險起點。

---

## 兩個驗證過的 workflow

| 檔案 | 情境 | 節點數 | 真實執行結果 |
|---|---|---|---|
| [`_runnable-T1-github-slack.json`](_runnable-T1-github-slack.json) | GitHub webhook → Slack 通知 | 5 | ✅ curl 200 + execution success |
| [`_runnable-Q2-order-line.json`](_runnable-Q2-order-line.json) | 訂單 webhook → LINE Notify | 5 | ✅ curl 200 + execution success |

兩個都含完整三層結構（Layer 1 黃便利貼 + Layer 2 nodes + Layer 3 藍便利貼）。

---

## 驗收證據

執行於 v0.9.0 第三輪驗收（R3），紀錄見 [`../tests/REPORT-3.md`](../tests/REPORT-3.md) §4。摘錄：

### T1 真實執行
```
curl -X POST /webhook/github-issue -d '{"title":"R3-v09 test",...}'
→ 200 "Workflow was started"
→ execution status=success
→ 路徑：Webhook → Set 組訊息 → Slack(continueOnFail=true)
```

### Q2 真實執行
```
curl -X POST /webhook/order-q2-final -d '{"order_id":"Q2-001","customer_name":"張三","amount":1280}'
→ 200 "Workflow was started"
→ execution status=success
→ 路徑：Webhook → Set "🛒 新訂單 #Q2-001 客戶：張三 金額：$1280" → HTTP LINE Notify(continueOnFail)
```

兩者皆含 `continueOnFail` 設計，所以即便最終的 Slack / LINE credential 是 stub（沒有真實 token），整體 execution 仍標記 success（節點失敗被吞但流程正常結束）。

---

## 三層結構就在 JSON 裡

打開任一 JSON，你會看到：

| 節點 ID | type | 角色 |
|---|---|---|
| `sticky-user-1` | `n8n-nodes-base.stickyNote`（color=4 黃）| Layer 1 — 使用者需求 |
| `node-webhook` | `n8n-nodes-base.webhook` | Layer 2 — trigger |
| `node-set` | `n8n-nodes-base.set` | Layer 2 — 整形資料 |
| `node-slack` 或 `node-line` | `n8n-nodes-base.slack` / `n8n-nodes-base.httpRequest` | Layer 2 — 輸出 |
| `sticky-ai-1` | `n8n-nodes-base.stickyNote`（color=5 藍）| Layer 3 — AI 說明 |

---

## 怎麼用

### Step 1：匯入

```
n8n UI → Workflows → Import from File → 選 _runnable-T1-github-slack.json 或 _runnable-Q2-order-line.json
```

### Step 2：把 stub credential 換成真實的

匯入後，Slack / HTTP 節點的 credential 是 `STUB-slackApi` / `STUB-httpHeaderAuth`。這些**只能讓 workflow 通過 activate 檢查，無法真的送訊息**。要實際運作：

1. 點該節點 → Credentials → 「New」建真實的（Slack OAuth2 / LINE Notify token）
2. 把 stub 換成新建的
3. 重新 activate

### Step 3：activate + 觸發

```bash
# T1
curl -X POST <n8n-url>/webhook/github-issue \
  -H "Content-Type: application/json" \
  -d '{"title":"hello","html_url":"http://x.com/i/1","user":{"login":"me"}}'

# Q2
curl -X POST <n8n-url>/webhook/order \
  -H "Content-Type: application/json" \
  -d '{"order_id":"A001","customer_name":"張三","amount":1280}'
```

預期都回 `{"message":"Workflow was started"}` 200，並對應的 channel / LINE 群組收到訊息（換真實 credential 後）。

---

## 三種 cookbook 資源差別

| 類型 | 用途 | 形式 |
|---|---|---|
| `01–08` cookbook md | 教你如何寫便利貼（含中英自然語言 + DSL）| 教學 markdown |
| `_starter-blank.json` / `_starter-template.json` | 給空白便利貼 / 雙語模板，等你自己填 + AI 產 nodes | 起手式 JSON（無 nodes）|
| **`_runnable-*.json`** | **完整三層結構 + 已驗證能跑** | **完整 JSON（含 nodes）** |

如果你想：
- 學寫便利貼 → 看 cookbook 01–08
- 從空白開始 → 用 `_starter-*.json`
- 拿現成可運作的當參考 → **用 `_runnable-*.json`**

---

## 想看 AI 寫的 Layer 3 內容？

打開 JSON 找 `sticky-ai-1` 節點的 `parameters.content`，或在 n8n 畫布上點下方藍色便利貼。會看到 5 段：節點選型、所需 Credentials、前提假設、測試建議、已知限制。
