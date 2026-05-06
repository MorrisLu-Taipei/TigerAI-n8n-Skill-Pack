# Cookbook 06 — Error handling and retry

> 🌐 **English** | [繁體中文](06-error-retry-pattern.md)

## Use case
Calling an unstable external API (network jitter, transient 5xx); needs retry; alert humans on exhaustion.

---

## Sticky note content

### 🌱 Plain-language version (recommended)

**【English】**

```text
When someone calls my webhook, I fetch https://flaky-api.example.com/data.

This API is flaky, so:
  - On failure, retry up to 3 times (wait 1s, 2s, 4s in between)
  - Only retry on server errors (5xx); 4xx errors give up immediately
  - After 3 failures → notify Slack #ops-alert AND email oncall@example.com

On success, write the data into Google Sheets.

⚠️ Assumptions: oncall mailbox + #ops-alert exist; Slack and Gmail credentials configured
```

**【繁體中文】**

```text
有人 call 我的 webhook 時，我要去抓 https://flaky-api.example.com/data。

這個 API 不太穩定，所以：
  - 失敗時重試最多 3 次（中間等 1 秒、2 秒、4 秒）
  - 但只有伺服器錯誤（5xx）才重試；4xx 那種錯誤直接放棄不要硬撐
  - 三次都失敗 → Slack 通知 #ops-alert，同時寄信給 oncall@example.com

成功的話就把資料寫進 Google Sheet。

⚠️ 假設：oncall 信箱與 #ops-alert 已存在、Slack 與 Gmail credential 都設好了
```

<details>
<summary>📐 Advanced: DSL strict syntax</summary>

```markdown
## Need: API call retry + failure alert

@trigger: webhook POST /trigger-sync
@step: call API GET https://flaky-api.example.com/data
  - retry: up to 3 times, exponential backoff (1s, 2s, 4s)
  - retry on 5xx only; fail-fast on 4xx
@step: success → write Google Sheet
@step: failure (after 3 retries) → Slack #ops-alert + Email oncall@example.com
@on-error: same as failure path

@assume: 5xx is transient, 4xx is permanent (e.g. 401 should not retry)
@assume: oncall@example.com and #ops-alert exist
@assume: Slack and Gmail credentials configured
```

</details>

---

## Layer 2 nodes

```text
[Webhook]
   ↓
[HTTP Request]   ← built-in retry: 3, retryInterval=exponential
   │ success                    │ continueOnFail
   ↓                            ↓
[Google Sheets: append]    [IF: $json.error?]
                                ↓ true
                           [Slack: #ops-alert]
                                ↓
                           [Gmail: oncall@]
```

| Node | Highlights |
|---|---|
| HTTP | `retry.enabled=true`, `maxTries=3`, `waitBetween=1000` (n8n native is fixed-interval; need code for exp) |
| Code (alt) | hand-write fetch + try/catch + `await new Promise(r=>setTimeout(r, 2**i*1000))` |
| IF | check `$json.error` exists |
| Slack / Gmail | parallel notifications |

> Pro-tip: Use **Error Trigger workflow** (a separate workflow type) to centralize all error handling instead of duplicating retry nodes per workflow.

---

## Layer 3

```markdown
### 🤖 AI implementation notes — Retry + failure alert

**Node choices**
- HTTP node native retry: simple but no exponential backoff
- For strict exponential, use a `code` node (sample provided)
- Failure path: dual Slack + Gmail to avoid single-channel failure

**Required credentials**
- [ ] Google Sheets OAuth2
- [ ] Slack OAuth2
- [ ] Gmail OAuth2

**Assumptions**
- API 5xx is transient, 4xx is permanent (e.g. 401 should NOT retry)
- oncall mailbox and Slack channel exist

**Test recipe**
1. Mock 500 three times → verify retries
2. Mock persistent 500 → verify both Slack + Gmail receive
3. Mock 401 → verify NO retry, fast-fail

**Known limits**
- n8n native retry uses fixed interval, not exponential (alt noted in Layer 2)
- If alert path itself fails (Slack down), no fallback

**Mapped to user requirements**
- @trigger → Webhook
- @step (retry) → HTTP retry config
- @step (success) → Google Sheets
- @step (failure) → Slack + Gmail
- @on-error and failure share the same fallback path
```
