# Cookbook 08 — Loop batch processing

> 🌐 **English** | [繁體中文](08-loop-batch-processing.md)

## Use case
You have a batch (100 / 1000 items); apply the same processing to each (call API / write DB); batch to avoid hammering downstream.

---

## Sticky note content

### 🌱 Plain-language version (recommended)

**【English】**

```text
I want a manually-triggered batch email flow.

Steps:
1. Pull all active subscribers from Postgres (active=true)
2. To avoid SMTP rate-limit, process 10 at a time
3. For each:
   - Apply personalized template (use first_name)
   - Send via SendGrid
   - On failure: bump that user's bounce_count by 1, continue (don't kill the batch)
4. Wait 5 seconds between batches

At the end, print: "Sent N / Failed M".
```

**【繁體中文】**

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

<details>
<summary>📐 Advanced: DSL strict syntax</summary>

```markdown
## Need: Batch send personalized emails

@trigger: manual (click Execute)
@step: Postgres SELECT * FROM newsletter_subscribers WHERE active=true
@step: 10 per batch (avoid SMTP rate limit)
@step: for each:
  - render personalized template (using first_name)
  - send Email via SendGrid
  - failure → mark bounce_count++ and continue, don't break batch
@step: Wait 5s between batches
@output: log "Sent {success} / Failed {fail}"
```

</details>

---

## Layer 2 nodes

```text
[Manual Trigger]
   ↓
[Postgres SELECT]
   ↓
[Split In Batches: batchSize=10]
   ↓
   ├─ (loop body)
   │  [Set: render template]
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
[Aggregate: stats success/fail]
   ↓
[NoOp / Console]
```

| Node | Highlights |
|---|---|
| Split In Batches | `batchSize=10`, auto-loops until exhausted |
| Set template | `body=Hi {{ $json.first_name }}, ...` |
| SendGrid | `continueOnFail=true`; one failure doesn't kill the batch |
| IF | detect `$json.error` |
| Postgres UPDATE | `UPDATE subscribers SET bounce_count=bounce_count+1 WHERE id={{ $json.id }}` |
| Wait | 5s, basic SMTP rate limit |
| Aggregate | collect all batch results |

---

## Layer 3

```markdown
### 🤖 AI implementation notes — Batch email send

**Node choices**
- `splitInBatches`: n8n standard batch loop, auto-loops back until done
- `continueOnFail` on SendGrid: per-item failure doesn't break the batch (matches "don't break" requirement)
- `wait` node: simplest rate-limit mechanism

**Required credentials**
- [ ] Postgres
- [ ] SendGrid API key

**Assumptions**
- Subscribers table has first_name, email, bounce_count columns
- SendGrid sender is verified
- Estimated runtime: 1000 items ÷ 10/batch × 5s ≈ 8.3 min

**Test recipe**
1. Limit 5 first to verify template rendering
2. Set one subscriber's email to invalid format → verify bounce_count++ and batch continues
3. Watch n8n timeline; confirm ~5s between batches

**Known limits**
- batchSize=10 hardcoded; for dynamic, use expression
- Wait node consumes worker (queue-mode releases worker)
- No mid-batch pause/resume; for that, use sub-workflow + central state table

**Mapped to user requirements**
- @trigger → Manual Trigger
- @step (fetch) → Postgres SELECT
- @step (10 per batch) → Split In Batches
- @step (loop body) → Set / SendGrid / IF / Postgres UPDATE
- @step (Wait between batches) → Wait
- @output → Aggregate (NoOp display)
```
