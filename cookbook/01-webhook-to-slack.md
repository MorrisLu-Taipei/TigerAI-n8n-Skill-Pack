# Cookbook 01 — Webhook → Slack 通知

> 🌐 [English](01-webhook-to-slack.en.md) | **繁體中文**

## 使用情境
外部系統（GitHub / Jira / 監控系統）發送 webhook，希望立刻轉成 Slack 通知。最常見的「簡單 1 trigger + 1 action」模式。

---

## Sticky Note 內容（使用者貼進 n8n 即可）

### 🌱 自然語言版（推薦，不會寫程式也能用）

**【中文】**

```text
GitHub 有新 Issue 時，立刻通知 Slack 的 #dev-issues 頻道。
訊息要包含 issue 標題、開啟者、連結，前面加個 🐛 emoji。
萬一 Slack 暫時不通，就略過不用補通知。
```

**【English】**

```text
When GitHub has a new Issue, immediately notify Slack channel #dev-issues.
The message must include the issue title, opener, and link, prefixed with a 🐛 emoji.
If Slack is temporarily down, just skip — no need to retry.
```

<details>
<summary>📐 進階：DSL 嚴謹寫法（同樣意思，AI 內部會用這個）</summary>

```markdown
## 需求：GitHub Issue 通知到 Slack

@trigger: webhook POST /github-issue
@input: GitHub Issue webhook payload (title, html_url, user.login)
@step: 取出 title / url / 作者
@step: 組成訊息 "🐛 新 Issue: {title} by {作者} → {url}"
@output: slack channel #dev-issues
@on-error: 寫入 console（暫時不通知）
```

</details>

---

## 預期 Layer 2（AI 會產出的節點）

```
[Webhook]  →  [Set: 組訊息]  →  [Slack: 發送]
   │
   └── (continueOnFail) → [NoOp]
```

| 節點 | type | 關鍵參數 |
|---|---|---|
| Webhook | `n8n-nodes-base.webhook` | path=`github-issue`, method=POST, responseMode=`onReceived` |
| Set 組訊息 | `n8n-nodes-base.set` | `text = =🐛 新 Issue: {{ $json.body.title }} by {{ $json.body.user.login }} → {{ $json.body.html_url }}` |
| Slack | `n8n-nodes-base.slack` | channel=`#dev-issues`, text=`={{ $json.text }}` |

> ⚠️ Webhook payload 在 `$json.body` 之下（n8n-expression-syntax skill 第一條 gotcha）。

---

## 預期 Layer 3（AI 回寫的 sticky note）

```markdown
### 🤖 AI 實作說明 — GitHub Issue → Slack

**節點選型**
- `webhook`：標準 trigger，比 `n8n-form-trigger` 適合機器對機器
- `set`：用 expression 組字串比 code 節點更輕量
- `slack`：原生節點，比 httpRequest 簡潔

**所需 Credentials**
- [ ] Slack OAuth2（需 chat:write 權限）

**前提假設**
- GitHub webhook 已設定，secret 暫不驗證（如需可加 HMAC 驗證 code 節點）
- channel #dev-issues 已存在且 bot 已加入

**測試建議**
1. 用 curl 模擬：`curl -X POST <n8n-url>/webhook/github-issue -H 'Content-Type: application/json' -d '{"title":"test","html_url":"http://x","user":{"login":"me"}}'`
2. 預期 Slack #dev-issues 收到訊息

**已知限制**
- 未驗證 GitHub webhook secret（資安風險：任何人可呼叫此 webhook）
- 未做 retry，Slack 暫時失敗會丟訊息

**對應使用者需求**
- @trigger → Webhook
- @step (組訊息) → Set
- @output → Slack
```
