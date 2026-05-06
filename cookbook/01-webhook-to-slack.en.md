# Cookbook 01 — Webhook → Slack notification

> 🌐 **English** | [繁體中文](01-webhook-to-slack.md)

## Use case
External system (GitHub / Jira / monitoring) sends a webhook; you want immediate Slack notification. The simplest "1 trigger + 1 action" pattern.

---

## Sticky note content

### 🌱 Plain-language version (recommended)

**【English】**

```text
When GitHub has a new Issue, immediately notify Slack channel #dev-issues.
The message must include the issue title, opener, and link, prefixed with a 🐛 emoji.
If Slack is temporarily down, just skip — no need to retry.
```

**【繁體中文】**

```text
GitHub 有新 Issue 時，立刻通知 Slack 的 #dev-issues 頻道。
訊息要包含 issue 標題、開啟者、連結，前面加個 🐛 emoji。
萬一 Slack 暫時不通，就略過不用補通知。
```

<details>
<summary>📐 Advanced: DSL strict syntax (same meaning, AI uses internally)</summary>

```markdown
## Need: GitHub Issue → Slack notification

@trigger: webhook POST /github-issue
@input: GitHub Issue webhook payload (title, html_url, user.login)
@step: extract title / url / author
@step: compose message "🐛 New Issue: {title} by {author} → {url}"
@output: slack channel #dev-issues
@on-error: log to console (skip notification for now)
```

</details>

---

## Layer 2 nodes AI will produce

```text
[Webhook]  →  [Set: compose msg]  →  [Slack: send]
   │
   └── (continueOnFail) → [NoOp]
```

| Node | type | Key params |
|---|---|---|
| Webhook | `n8n-nodes-base.webhook` | path=`github-issue`, method=POST, responseMode=`onReceived` |
| Set msg | `n8n-nodes-base.set` | `text = =🐛 New Issue: {{ $json.body.title }} by {{ $json.body.user.login }} → {{ $json.body.html_url }}` |
| Slack | `n8n-nodes-base.slack` | channel=`#dev-issues`, text=`={{ $json.text }}` |

> ⚠️ Webhook payload sits under `$json.body` (gotcha #1 from n8n-expression-syntax skill).

---

## Layer 3 sticky note AI writes back

```markdown
### 🤖 AI implementation notes — GitHub Issue → Slack

**Node choices**
- `webhook`: standard trigger, more suitable for machine-to-machine than `n8n-form-trigger`
- `set`: composing string via expression is lighter than a code node
- `slack`: native node, more concise than httpRequest

**Required credentials**
- [ ] Slack OAuth2 (needs `chat:write`)

**Assumptions**
- GitHub webhook configured; secret unverified for now (add HMAC verify code node if needed)
- Channel #dev-issues exists; bot is invited

**Test recipe**
1. `curl -X POST <n8n-url>/webhook/github-issue -H 'Content-Type: application/json' -d '{"title":"test","html_url":"http://x","user":{"login":"me"}}'`
2. Expect Slack #dev-issues to receive the message

**Known limits**
- Webhook secret unverified (security risk: anyone can call this webhook)
- No retry on Slack — temporary failures lose messages

**Mapped to user requirements**
- @trigger → Webhook
- @step (compose) → Set
- @output → Slack
```
