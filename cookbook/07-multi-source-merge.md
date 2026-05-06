# Cookbook 07 — 多來源合併

> 🌐 [English](07-multi-source-merge.en.md) | **繁體中文**

## 使用情境
同時從 2+ 個 API / DB 拿資料，依共同 key（如 user_id）合併後輸出。

---

## Sticky Note 內容

### 🌱 自然語言版（推薦）

**【中文】**

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

<details>
<summary>📐 進階：DSL 嚴謹寫法</summary>

```markdown
## 需求：合併 CRM + 帳務系統的客戶清單

@trigger: schedule cron "0 6 * * 1" (每週一 06:00)
@step: 平行抓取
  - A. 從 CRM API GET /customers 拿 (id, name, email, segment)
  - B. 從 Billing API GET /invoices?status=unpaid 拿 (customer_id, amount_due)
@step: 以 customer_id 合併（左 join，CRM 為主）
@step: 過濾 amount_due > 0
@step: 寫入 Google Sheet "AR Aging" (覆蓋整張)
@output: Slack #finance "本週 AR 報表已更新, 共 {n} 筆"
```

</details>

---

## 預期 Layer 2

```
[Schedule]
   ├─→ [HTTP: CRM /customers]  ─┐
   └─→ [HTTP: Billing /invoices]─┤
                                 ↓
                            [Merge: by customer_id]
                                 ↓
                            [Filter: amount_due > 0]
                                 ↓
                            [Google Sheets: 清空+寫入]
                                 ↓
                            [Slack: #finance]
```

| 節點 | 重點 |
|---|---|
| Schedule | cron `0 6 * * 1` |
| HTTP × 2 | 兩個分支同時觸發（schedule 連到兩個節點） |
| Merge | mode=`combine`, combineBy=`mergeByFields`, key1=`id`, key2=`customer_id`, joinMode=`enrichInput1` |
| Filter | condition: `amount_due > 0` |
| Google Sheets | operation=`append or update`, 用 `clear` 模式覆蓋 |
| Slack | text 帶 `={{ $json.length }}` |

---

## 預期 Layer 3

```markdown
### 🤖 AI 實作說明 — CRM + Billing 合併

**節點選型**
- 兩個 HTTP 節點從 Schedule 平行展開（不串聯，省時間）
- `merge` mode `combine`+`enrichInput1`：CRM 為主，Billing 是 enrichment
- `filter` 而非 `if`：批次資料用 filter 較適合

**所需 Credentials**
- [ ] CRM API（Header Auth: Bearer token）
- [ ] Billing API（Header Auth）
- [ ] Google Sheets OAuth2
- [ ] Slack OAuth2

**前提假設**
- 兩 API 回傳 JSON array
- customer_id 在兩端格式一致（皆為 string；若一邊 int 一邊 string，merge 會 miss）
- Google Sheet "AR Aging" 已存在

**測試建議**
1. 手動觸發，驗證 Sheet 整張被覆蓋
2. 故意讓 CRM 沒有 customer 而 Billing 有 → 驗證左 join 行為（該筆應被丟棄）
3. Billing API 回空陣列 → 驗證 Sheet 仍正確產出（只有 CRM 資料無金額）

**已知限制**
- 全量覆蓋模式：歷史 snapshot 不保留
- 兩 API 不在同一 transaction，可能取到不一致時間點的資料
- Merge by single field，若 customer_id 重複會出現笛卡兒積

**對應使用者需求**
- @trigger → Schedule
- @step (平行抓) → 兩個 HTTP
- @step (合併) → Merge
- @step (過濾) → Filter
- @step (寫入) → Google Sheets
- @output → Slack
```
