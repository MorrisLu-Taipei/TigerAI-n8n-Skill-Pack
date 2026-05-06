# Cookbook 08 — 迴圈批次處理

> 🌐 [English](08-loop-batch-processing.en.md) | **繁體中文**

## 使用情境
拿到一批資料（100 筆 / 1000 筆），對每一筆做相同處理（呼叫 API / 寫 DB），需要分批避免一次打爆下游。

---

## Sticky Note 內容

### 🌱 自然語言版（推薦）

**【中文】**

```text
我要手動觸發一個批次寄信流程。

步驟：
1. 從 Postgres 撈出所有 active=true 的訂閱者
2. 為了不被 SMTP 鎖，每 10 筆一批處理
3. 對每一筆：
   - 套個人化模板（用收件人 first_name）
   - 透過 SendGrid 寄出
   - 寄失敗的話，把那個人的 bounce_count +1，繼續處理下一筆，不要整批中斷
4. 每批之間等 5 秒再繼續

最後印出：成功 N 封 / 失敗 M 封
```

**【English】**

```text
I want a manually-triggered batch email flow.

Steps:
1. Pull all active subscribers from Postgres (active=true)
2. Process 10 at a time to avoid SMTP rate-limit
3. For each:
   - apply personalized template (using first_name)
   - send via SendGrid
   - on failure, bump that user's bounce_count by 1 and continue (don't kill the batch)
4. Wait 5 seconds between batches

At the end, print "Sent N / Failed M".
```

<details>
<summary>📐 進階：DSL 嚴謹寫法</summary>

```markdown
## 需求：批次寄出個人化 Email

@trigger: manual (手動點 Execute)
@step: 從 Postgres 撈 SELECT * FROM newsletter_subscribers WHERE active=true
@step: 每 10 筆一批 (避免 SMTP rate limit)
@step: 對每筆：
  - 套個人化模板 (使用 first_name)
  - 寄 Email via SendGrid
  - 失敗 → 標記 bounce_count++ 並繼續下一筆，不中斷整批
@step: 每批之間 Wait 5 秒
@output: 寫入 console "已寄 {success} / 失敗 {fail}"
```

</details>

---

## 預期 Layer 2

```
[Manual Trigger]
   ↓
[Postgres SELECT]
   ↓
[Split In Batches: batchSize=10]
   ↓
   ├─ (loop body)
   │  [Set: 套模板]
   │     ↓
   │  [SendGrid: send]   ← continueOnFail=true
   │     ↓
   │  [IF: $json.error?]
   │     ├─ true → [Postgres UPDATE bounce_count++]
   │     └─ false → [NoOp]
   │     ↓
   │  [Wait: 5s]
   │     ↓
   │  (loop back)
   ↓ (done)
[Aggregate: 統計 success/fail]
   ↓
[NoOp / Console]
```

| 節點 | 重點 |
|---|---|
| Split In Batches | `batchSize=10`, 自動 loop 至清空 |
| Set 套模板 | `body=Hi {{ $json.first_name }}, ...` |
| SendGrid | `continueOnFail=true`，失敗不中斷 |
| IF | 偵測 `$json.error` |
| Postgres UPDATE | `UPDATE subscribers SET bounce_count=bounce_count+1 WHERE id={{ $json.id }}` |
| Wait | 5 秒，避免 SMTP rate limit |
| Aggregate | 收集所有 batch 結果 |

---

## 預期 Layer 3

```markdown
### 🤖 AI 實作說明 — 批次寄信

**節點選型**
- `splitInBatches`：n8n 標準批次 loop，自動回到自己直到清空
- `continueOnFail` on SendGrid：單筆失敗不中斷整批，符合「不中斷」需求
- `wait` 節點：最簡單的限速機制

**所需 Credentials**
- [ ] Postgres
- [ ] SendGrid API key

**前提假設**
- Subscribers 表含 first_name, email, bounce_count 欄位
- SendGrid 帳號 sender 已驗證
- 預估執行時間：1000 筆 ÷ 10/批 × 5 秒 ≈ 8.3 分鐘

**測試建議**
1. 限定 LIMIT 5 先測模板渲染正確
2. 故意把某筆 email 設為非法格式 → 驗證 bounce_count 確實 ++ 且未中斷
3. 觀察 n8n 執行時間軸，確認每批間隔 ~5 秒

**已知限制**
- batchSize 寫死 10，未來如要動態需改為 expression
- Wait 節點消耗 worker 資源（n8n queue mode 才會 release worker）
- 無法中途暫停；如要支援，改用 sub-workflow + 中央 state table

**對應使用者需求**
- @trigger → Manual Trigger
- @step (撈資料) → Postgres SELECT
- @step (每 10 筆一批) → Split In Batches
- @step (loop body) → Set / SendGrid / IF / Postgres UPDATE
- @step (批間 Wait) → Wait
- @output → Aggregate (NoOp 顯示)
```
