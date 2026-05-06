# Cookbook 06 — 錯誤處理與重試模式

> 🌐 [English](06-error-retry-pattern.en.md) | **繁體中文**

## 使用情境
呼叫不穩定的外部 API（網路抖動、暫時 5xx），需要 retry；超過上限要通報人員。

---

## Sticky Note 內容

### 🌱 自然語言版（推薦）

**【中文】**

```text
有人 call 我的 webhook 時，我要去抓 https://flaky-api.example.com/data。

這個 API 不太穩定，所以：
  - 失敗時重試最多 3 次（中間等 1 秒、2 秒、4 秒）
  - 但只有伺服器錯誤（5xx）才重試；4xx 那種錯誤直接放棄不要硬撐
  - 三次都失敗 → Slack 通知 #ops-alert，同時寄信給 oncall@example.com

成功的話就把資料寫進 Google Sheet。

⚠️ 假設：oncall 信箱與 #ops-alert 已存在、Slack 與 Gmail credential 都設好了
```

**【English】**

```text
When someone calls my webhook, I fetch https://flaky-api.example.com/data.

This API is flaky, so:
  - On failure, retry up to 3 times (wait 1s, 2s, 4s in between)
  - Only retry on server errors (5xx); give up on 4xx errors
  - After 3 failures → notify Slack #ops-alert AND email oncall@example.com

On success, write the data into Google Sheets.

⚠️ Assumptions: oncall mailbox + #ops-alert exist; Slack and Gmail credentials configured.
```

<details>
<summary>📐 進階：DSL 嚴謹寫法</summary>

```markdown
## 需求：API 呼叫的 retry + 失敗通報

@trigger: webhook POST /trigger-sync
@step: 呼叫 API GET https://flaky-api.example.com/data
  - retry: 最多 3 次, 指數退避 (1s, 2s, 4s)
  - 5xx 才 retry，4xx 直接失敗
@step: 成功 → 寫入 Google Sheet
@step: 失敗（3 次後仍敗） → Slack #ops-alert + 通知 oncall@example.com
@on-error: 同上失敗路徑

@assume: API 5xx 為暫時性錯誤、4xx 為永久（如 401 不該 retry）
@assume: oncall@example.com 與 #ops-alert channel 已存在
@assume: Slack 與 Gmail credentials 皆已設定
```

</details>

---

## 預期 Layer 2

```
[Webhook]
   ↓
[HTTP Request]   ← 啟用節點內建 retry: 3, retryInterval=指數
   │ success                    │ continueOnFail
   ↓                            ↓
[Google Sheets: append]    [IF: $json.error?]
                                ↓ true
                           [Slack: #ops-alert]
                                ↓
                           [Gmail: oncall@]
```

| 節點 | 重點 |
|---|---|
| HTTP | `retry.enabled=true`, `maxTries=3`, `waitBetween=1000` (n8n 內建非指數，需 Code 補) |
| Code（替代方案） | 自寫 fetch + try/catch + `await new Promise(r=>setTimeout(r, 2**i*1000))` |
| IF | 檢查 `$json.error` 存在 |
| Slack / Gmail | 平行通知 |

> 進階：使用 **Error Trigger workflow**（另一個專屬 workflow type）統一處理所有 workflow 的錯誤，避免每個 workflow 都重複 retry 節點。

---

## 預期 Layer 3

```markdown
### 🤖 AI 實作說明 — Retry + 失敗通報

**節點選型**
- HTTP 節點原生 retry：簡單但不支援指數退避
- 若需嚴格指數退避，改用 `code` 節點手寫（範例已附）
- 失敗通報走 Slack + Gmail 雙通道，避免單點失誤

**所需 Credentials**
- [ ] Google Sheets OAuth2
- [ ] Slack OAuth2
- [ ] Gmail OAuth2

**前提假設**
- API 5xx 為暫時性、4xx 為永久（如 401 不該 retry）
- oncall 信箱與 Slack channel 已設定

**測試建議**
1. 模擬 API 回 500 三次 → 驗證 retry 觸發
2. 模擬 API 持續 500 → 驗證 Slack + Gmail 都收到
3. 模擬 API 回 401 → 驗證**沒有** retry，直接走失敗

**已知限制**
- n8n 原生 retry 為固定間隔，非指數（已在 layer 2 註明替代方案）
- 失敗通報本身若失敗（Slack down）無 fallback

**對應使用者需求**
- @trigger → Webhook
- @step (retry) → HTTP retry config
- @step (成功) → Google Sheets
- @step (失敗) → Slack + Gmail
- @on-error 與失敗分支共用同一條 fallback 路徑
```
