# Sticky Note Bilingual Examples (Chinese + English)

> 🌐 **English** | [繁體中文](STICKY-EXAMPLES-BILINGUAL.md)

> The 8 cookbook examples' sticky note contents, **Chinese and English side by side**. Pick the language your team prefers and paste the entire block into a yellow sticky in n8n.
>
> AI accepts both languages and produces equivalent workflows.

---

## How to use this table

1. Find your scenario (numbers match [`00-INDEX.en.md`](00-INDEX.en.md))
2. Copy the entire **繁體中文** or **English** column
3. Paste into a yellow sticky note in n8n
4. Ask AI → automatically generates the complete workflow

---

## 01 — Webhook → Slack notification

| 繁體中文 | English |
|---|---|
| GitHub 有新 Issue 時，立刻通知 Slack 的 #dev-issues 頻道。訊息要包含 issue 標題、開啟者、連結，前面加個 🐛 emoji。萬一 Slack 暫時不通，就略過不用補通知。 | When GitHub has a new Issue, immediately notify Slack channel #dev-issues. The message must include the issue title, opener, and link, prefixed with a 🐛 emoji. If Slack is temporarily down, just skip — no need to retry. |

---

## 02 — Scheduled fetch → Email report

| 繁體中文 | English |
|---|---|
| 每天早上 8 點，從 https://api.example.com/sales 抓昨天的銷售資料，算出總金額、訂單數、賣得最好的前 3 個商品，套成 HTML 報表寄到 sales@example.com，主旨寫「銷售日報 - 昨天日期」。失敗就在 #ops-alert 通知。 | Every morning at 8 AM, fetch yesterday's sales data from https://api.example.com/sales, calculate total amount, order count, top 3 products, format as HTML and email to sales@example.com, subject "Sales Daily - <yesterday>". On failure, notify Slack #ops-alert. |

---

## 03 — Form → Validate → Database insert

| 繁體中文 | English |
|---|---|
| 我要一個表單，欄位有：回報人姓名（必填）、Email（必填）、問題類別（下拉選 帳號/訂單/技術）、詳細描述（必填，至少 10 字）。送出後檢查 email 格式跟描述長度。通過就寫入 Postgres 的 tickets 表並回顯「已收到，工單編號 #N」；不通過就回顯「資料格式不正確」並且不存 DB。 | I want a form with these fields: Reporter name (required), Email (required), Issue type (dropdown: Account/Order/Tech), Description (required, at least 10 chars). After submit, check email format and description length. If valid → write to Postgres `tickets` table and reply "Received, ticket #N". If invalid → reply "Invalid format" and don't save to DB. |

---

## 04 — AI classify → Conditional routing

| 繁體中文 | English |
|---|---|
| 客服 Email 進來時（透過 webhook 傳給我），讓 AI 看一下是哪一類問題，分成：技術 / 帳務 / 其他。接著依類別處理：技術問題開 Jira ticket（project=TECH）；帳務問題轉寄到 billing@example.com；其他在 Slack #cs-general 通知值班同事。如果 AI 分類失敗，也在 #cs-general 通知一聲。 | When a customer email arrives (via webhook), ask AI which type of issue it is: Tech / Billing / Other. Then route by category: Tech → open Jira ticket in TECH project; Billing → forward to billing@example.com; Other → notify on-duty colleague in Slack #cs-general. If AI classification fails, also notify in #cs-general. |

---

## 05 — File processing pipeline

| 繁體中文 | English |
|---|---|
| 我要一個表單給人上傳 PDF，欄位有：上傳 PDF（必填）、命名前綴（選填，預設 "doc"）。收到後：(1) 把檔案先存到伺服器暫存；(2) 呼叫我們的 Worker（http://worker:8000/split-pdf）幫我按章節切開；(3) 每一章的檔名是「前綴_編號_章節名.pdf」（編號 3 位數補零）；(4) 一章一章上傳到 S3 的 company-docs 這個 bucket，路徑放在 pdfs/ 下；(5) 全部完成後在表單頁面顯示「處理了幾章 + S3 路徑清單」。失敗就清理暫存檔，回傳錯誤訊息。⚠️ 假設：Worker 已部署、與 n8n 共用 /tmp 資料夾、S3 bucket 已建立有寫入權限。 | I want a form for users to upload PDFs, with fields: Upload PDF (required), Naming prefix (optional, default "doc"). After receiving: (1) Save the file to server temp; (2) Call our Worker (http://worker:8000/split-pdf) to split by chapters; (3) Each chapter's filename: "prefix_NNN_title.pdf" (3-digit zero-padded); (4) Upload each one to S3 bucket `company-docs` under `pdfs/`; (5) After done, show "Processed N chapters + S3 paths" on the form. On failure, clean temp and return error. ⚠️ Assumptions: Worker deployed, shares /tmp with n8n, S3 bucket exists with write permissions. |

---

## 06 — Error handling and retry

| 繁體中文 | English |
|---|---|
| 有人 call 我的 webhook 時，我要去抓 https://flaky-api.example.com/data。這個 API 不太穩定，所以：失敗時重試最多 3 次（中間等 1 秒、2 秒、4 秒）；但只有伺服器錯誤（5xx）才重試，4xx 那種錯誤直接放棄不要硬撐；三次都失敗 → Slack 通知 #ops-alert，同時寄信給 oncall@example.com。成功的話就把資料寫進 Google Sheets。⚠️ 假設：oncall 信箱與 #ops-alert 已存在、Slack 與 Gmail credential 都設好了。 | When someone calls my webhook, I fetch https://flaky-api.example.com/data. This API is flaky, so: retry up to 3 times on failure (wait 1s, 2s, 4s in between); only retry on 5xx, give up on 4xx; after 3 failures → notify Slack #ops-alert AND email oncall@example.com. On success, write the data into Google Sheets. ⚠️ Assumptions: oncall mailbox + #ops-alert exist; Slack and Gmail credentials configured. |

---

## 07 — Multi-source merge

| 繁體中文 | English |
|---|---|
| 每週一早上 6 點，同時去兩個地方拿資料：(A) CRM 系統 → /customers，要：id、姓名、Email、客群；(B) 帳務系統 → /invoices?status=unpaid，要：客戶 id、欠款金額。用「客戶 id」把這兩邊合起來（以 CRM 為主，找不到對應帳款的就略過），再過濾掉欠款 0 的，把結果寫進 Google Sheet 的「AR Aging」分頁（整張覆蓋掉前一週的）。完成後在 Slack #finance 通知一聲：「本週 AR 報表已更新，共 N 筆」。 | Every Monday at 6 AM, fetch data from two places in parallel: (A) CRM → /customers, get: id, name, email, segment; (B) Billing → /invoices?status=unpaid, get: customer_id, amount_due. Merge by customer_id (CRM as primary; skip if no matching billing record), filter out amount_due = 0, write result into Google Sheet "AR Aging" (overwrite entire sheet). After done, notify Slack #finance: "Weekly AR report updated, N rows". |

---

## 08 — Loop batch processing

| 繁體中文 | English |
|---|---|
| 我要手動觸發一個批次寄信流程。步驟：(1) 從 Postgres 撈出所有 active=true 的訂閱者；(2) 為了不被 SMTP 鎖，每 10 筆一批處理；(3) 對每一筆：套個人化模板（用收件人 first_name），透過 SendGrid 寄出，寄失敗的話把那個人的 bounce_count +1，繼續處理下一筆，不要整批中斷；(4) 每批之間等 5 秒再繼續。最後印出：成功 N 封 / 失敗 M 封。 | I want a manually-triggered batch email flow. Steps: (1) Pull all active subscribers from Postgres (active=true); (2) Process 10 at a time to avoid SMTP rate-limit; (3) For each: apply personalized template (using first_name), send via SendGrid; on failure, bump that user's bounce_count by 1 and continue (don't kill the batch); (4) Wait 5 seconds between batches. At the end, print "Sent N / Failed M". |

---

## Advanced: DSL strict syntax

Each example's DSL version is **language-neutral** (uses English `@trigger:` `@step:` tags + content in any language). AI accepts both. See "📐 Advanced: DSL strict syntax" folded section in each cookbook page.

---

## Recommendations by team context

| Your team | Recommended |
|---|---|
| All Chinese-speaking | Chinese sticky + Chinese AI dialogue |
| All English / international | English sticky + English AI dialogue |
| Mixed Chinese-English / cross-border | **Recommend unified English** (international understanding; highest AI consistency) |
| For future maintainers | Either; but keep one language per workflow (avoid ambiguity) |
