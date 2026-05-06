# Cookbook 07 — Multi-source merge

> 🌐 **English** | [繁體中文](07-multi-source-merge.md)

## Use case
Pull data from 2+ APIs / DBs in parallel; merge by a common key (e.g. user_id) and output.

---

## Sticky note content

### 🌱 Plain-language version (recommended)

**【English】**

```text
Every Monday at 6 AM,
fetch data from two places in parallel:
  A. CRM → /customers, get: id, name, email, segment
  B. Billing → /invoices?status=unpaid, get: customer_id, amount_due

Merge by customer_id (CRM as primary; skip if no matching billing record),
filter out amount_due = 0,
write the result into Google Sheet "AR Aging" (overwrite the entire sheet).

After done, notify Slack #finance: "Weekly AR report updated, N rows".
```

**【繁體中文】**

```text
每週一早上 6 點，
同時去兩個地方拿資料：
  A. CRM 系統 → /customers，要：id、姓名、Email、客群
  B. 帳務系統 → /invoices?status=unpaid，要：客戶 id、欠款金額

用「客戶 id」把這兩邊合起來（以 CRM 為主，找不到對應帳款的就略過），
再過濾掉欠款 0 的，
把結果寫進 Google Sheet 的「AR Aging」分頁（整張覆蓋掉前一週的）。

完成後在 Slack #finance 通知一聲：「本週 AR 報表已更新，共 N 筆」
```

<details>
<summary>📐 Advanced: DSL strict syntax</summary>

```markdown
## Need: Merge CRM + billing customer list

@trigger: schedule cron "0 6 * * 1" (Mon 06:00)
@step: parallel fetch
  - A. CRM API GET /customers → (id, name, email, segment)
  - B. Billing API GET /invoices?status=unpaid → (customer_id, amount_due)
@step: merge by customer_id (left join, CRM as primary)
@step: filter amount_due > 0
@step: write Google Sheet "AR Aging" (clear-overwrite)
@output: Slack #finance "Weekly AR report updated, {n} rows"
```

</details>

---

## Layer 2 nodes

```text
[Schedule]
   ├─→ [HTTP: CRM /customers]  ─┐
   └─→ [HTTP: Billing /invoices]─┤
                                 ↓
                            [Merge: by customer_id]
                                 ↓
                            [Filter: amount_due > 0]
                                 ↓
                            [Google Sheets: clear+write]
                                 ↓
                            [Slack: #finance]
```

| Node | Highlights |
|---|---|
| Schedule | cron `0 6 * * 1` |
| HTTP × 2 | Schedule fans out to both branches in parallel |
| Merge | mode=`combine`, combineBy=`mergeByFields`, key1=`id`, key2=`customer_id`, joinMode=`enrichInput1` |
| Filter | condition: `amount_due > 0` |
| Google Sheets | operation=`append or update`, use `clear` mode for overwrite |
| Slack | text with `={{ $json.length }}` |

---

## Layer 3

```markdown
### 🤖 AI implementation notes — CRM + Billing merge

**Node choices**
- Two HTTP nodes branch from Schedule in parallel (not sequential, saves time)
- `merge` mode `combine`+`enrichInput1`: CRM is primary, Billing is enrichment
- `filter` (not `if`): better for batch data

**Required credentials**
- [ ] CRM API (Header Auth: Bearer token)
- [ ] Billing API (Header Auth)
- [ ] Google Sheets OAuth2
- [ ] Slack OAuth2

**Assumptions**
- Both APIs return JSON arrays
- customer_id format consistent on both sides (both string or both int; mixing causes merge miss)
- Google Sheet "AR Aging" exists

**Test recipe**
1. Manual trigger; verify Sheet is fully overwritten
2. CRM has customer not in Billing → verify left-join behavior (filtered out)
3. Billing returns empty → verify Sheet still produces (only CRM data, no amounts)

**Known limits**
- Full overwrite mode: no historical snapshot
- Two APIs not in same transaction; data may be inconsistent across time
- Merge by single field; duplicate customer_id causes Cartesian product

**Mapped to user requirements**
- @trigger → Schedule
- @step (parallel fetch) → two HTTP
- @step (merge) → Merge
- @step (filter) → Filter
- @step (write) → Google Sheets
- @output → Slack
```
