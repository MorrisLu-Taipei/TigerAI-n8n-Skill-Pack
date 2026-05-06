# Cookbook 03 — Form → Validate → Database insert

> 🌐 **English** | [繁體中文](03-form-to-database.md)

## Use case
n8n Form Trigger collects user input; on validation pass, insert into Postgres / MySQL; otherwise show rejection.

---

## Sticky note content

### 🌱 Plain-language version (recommended)

**【English】**

```text
I want a form with these fields:
  - Reporter name (required)
  - Email (required)
  - Issue type: dropdown of Account / Order / Tech
  - Description (required, at least 10 characters)

After submit: check email format and description length.
If valid → write to Postgres `tickets` table and reply "Received, ticket #N".
If invalid → reply "Invalid format" and don't save to DB.
```

**【繁體中文】**

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

<details>
<summary>📐 Advanced: DSL strict syntax</summary>

```markdown
## Need: Customer support form intake

@trigger: form
@form-fields:
  - name: "Reporter name" (text, required)
  - email: "Email" (email, required)
  - issue_type: "Issue type" (dropdown: Account/Order/Tech)
  - description: "Description" (textarea, required, min 10 chars)
@step: validate email format + description length >= 10
@step: insert into Postgres tickets (columns: name, email, issue_type, description, created_at)
@output: form shows "Received, ticket #{ticket_id}"
@on-error: form shows "Invalid format" + skip DB insert
```

</details>

---

## Layer 2 nodes

```text
[Form Trigger]
      ↓
[IF: email format + description length]
   │ true                    │ false
   ↓                         ↓
[Postgres INSERT tickets]   [Respond: "Invalid format"]
      ↓
[Respond: "Received #{id}"]
```

| Node | type | Key params |
|---|---|---|
| Form | `n8n-nodes-base.formTrigger` | formFields for 4 fields, responseMode=`responseNode` |
| IF | `n8n-nodes-base.if` | combinator=`and`, condition1=email regex, condition2=length>=10 |
| Postgres | `n8n-nodes-base.postgres` | operation=`insert`, table=`tickets`, returnFields=`id` |
| Respond OK | `n8n-nodes-base.respondToWebhook` | text=`Received, ticket #{{ $json.id }}` |
| Respond Fail | `n8n-nodes-base.respondToWebhook` | text=`Invalid format` |

---

## Layer 3

```markdown
### 🤖 AI implementation notes — Support form intake

**Node choices**
- `formTrigger` (v2): native form, no separate frontend
- `if`: two AND conditions, clearer than a code node
- `postgres`: returnFields=`id` to get the new ticket id automatically
- `respondToWebhook`: pairs with form's `responseMode=responseNode`

**Required credentials**
- [ ] Postgres credential (host / db / user / password)

**Assumptions**
- `tickets` table exists with schema:
  ```sql
  CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    name TEXT, email TEXT, issue_type TEXT,
    description TEXT, created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- Email regex is simplified (HTML5 `type=email` filters most issues at input)

**Test recipe**
1. Submit valid data → expect ticket id + new DB row
2. Description only 5 chars → expect "Invalid format"
3. Email missing @ → expect "Invalid format"

**Known limits**
- No SQL injection guard (parameter binding used; issue_type is dropdown so safe)
- No rate limit (same IP can spam)
- IP / user agent not stored for audit

**Mapped to user requirements**
- @trigger → Form Trigger
- @step (validate) → IF
- @step (insert) → Postgres
- @output / @on-error → Respond to Webhook (two branches)
```
