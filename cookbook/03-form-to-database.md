# Cookbook 03 — Form → 驗證 → 寫入資料庫

> 🌐 [English](03-form-to-database.en.md) | **繁體中文**

## 使用情境
n8n Form Trigger 收集使用者填寫，驗證通過後寫入 Postgres / MySQL，否則回拒絕訊息。

---

## Sticky Note 內容

### 🌱 自然語言版（推薦）

**【中文】**

```text
我要一個表單，欄位有：
  - 回報人姓名（必填）
  - Email（必填）
  - 問題類別：下拉選 帳號 / 訂單 / 技術
  - 詳細描述（必填，至少 10 個字）

送出後檢查 email 格式有沒有錯、描述夠不夠長，
通過就寫入 Postgres 的 tickets 表並回顯「已收到，工單編號 #N」。
不通過就回顯「資料格式不正確」並且不存 DB。
```

**【English】**

```text
I want a form with these fields:
  - Reporter name (required)
  - Email (required)
  - Issue type: dropdown of Account / Order / Tech
  - Description (required, at least 10 chars)

After submit, check email format and description length.
If valid → write to Postgres `tickets` table and reply "Received, ticket #N".
If invalid → reply "Invalid format" and don't save to DB.
```

<details>
<summary>📐 進階：DSL 嚴謹寫法</summary>

```markdown
## 需求：客服回報表單入庫

@trigger: form
@form-fields:
  - name: "回報人姓名" (text, required)
  - email: "Email" (email, required)
  - issue_type: "問題類別" (dropdown: 帳號/訂單/技術)
  - description: "詳細描述" (textarea, required, min 10 字)
@step: 驗證 email 格式 + description 至少 10 字
@step: 寫入 Postgres tickets 表 (columns: name, email, issue_type, description, created_at)
@output: form 顯示「已收到，工單編號 #{ticket_id}」
@on-error: form 顯示「資料格式不正確」 + 不寫 DB
```

</details>

---

## 預期 Layer 2

```
[Form Trigger]
      ↓
[IF: email 格式 + description 長度]
   │ true                   │ false
   ↓                        ↓
[Postgres INSERT tickets]   [Respond to Form: "資料格式不正確"]
      ↓
[Respond to Form: "已收到 #{id}"]
```

| 節點 | type | 關鍵參數 |
|---|---|---|
| Form | `n8n-nodes-base.formTrigger` | formFields 對應 4 欄位，responseMode=`responseNode` |
| IF | `n8n-nodes-base.if` | combinator=`and`, condition1=email regex, condition2=length>=10 |
| Postgres | `n8n-nodes-base.postgres` | operation=`insert`, table=`tickets`, returnFields=`id` |
| Respond OK | `n8n-nodes-base.respondToWebhook` | text=`已收到，工單編號 #{{ $json.id }}` |
| Respond Fail | `n8n-nodes-base.respondToWebhook` | text=`資料格式不正確` |

---

## 預期 Layer 3

```markdown
### 🤖 AI 實作說明 — 客服表單入庫

**節點選型**
- `formTrigger`（v2）：原生表單，免另建前端
- `if`：兩條件 AND，比 code 節點更清晰
- `postgres`：returnFields=`id` 自動拿到新建工單號
- `respondToWebhook`：與 form 的 `responseMode=responseNode` 配合

**所需 Credentials**
- [ ] Postgres credential（host / db / user / password）

**前提假設**
- `tickets` 表已存在，schema：
  ```sql
  CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    name TEXT, email TEXT, issue_type TEXT,
    description TEXT, created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- email regex 採簡化版（HTML5 input type=email 已先擋一次）

**測試建議**
1. 正常填寫 → 應回 ticket 編號 + DB 新一筆
2. description 只填 5 字 → 應回「資料格式不正確」
3. email 缺 @ → 應回「資料格式不正確」

**已知限制**
- 未做 SQL injection 防護（已用 parameter binding，但 issue_type 來自 dropdown 故安全）
- 未做 rate limit（同一 IP 大量提交無阻擋）
- 未存 IP / user agent 供日後 audit

**對應使用者需求**
- @trigger → Form Trigger
- @step (驗證) → IF
- @step (寫入) → Postgres
- @output / @on-error → Respond to Webhook (兩條分支)
```
