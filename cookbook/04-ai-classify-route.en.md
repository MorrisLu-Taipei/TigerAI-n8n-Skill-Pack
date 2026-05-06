# Cookbook 04 — AI classify → Conditional routing

> 🌐 **English** | [繁體中文](04-ai-classify-route.md)

## Use case
Incoming message / email / ticket gets classified by an LLM, then routed differently per class.

---

## Sticky note content

### 🌱 Plain-language version (recommended)

**【English】**

```text
When a customer email arrives (via webhook),
ask AI which type of issue it is, classified as: Tech / Billing / Other.

Then process by category:
  - Tech → open a Jira ticket in the TECH project
  - Billing → forward to billing@example.com
  - Other → notify the on-duty colleague in Slack #cs-general

If AI classification fails, also notify in #cs-general.
```

**【繁體中文】**

```text
客服 Email 進來時（透過 webhook 傳給我），
讓 AI 看一下是哪一類問題，分成：技術 / 帳務 / 其他。

接著依類別處理：
  - 技術問題 → 在 Jira 的 TECH 專案開 ticket
  - 帳務問題 → 轉寄到 billing@example.com
  - 其他 → 在 Slack #cs-general 通知值班同事

如果 AI 分類失敗，也在 #cs-general 通知一聲。
```

<details>
<summary>📐 Advanced: DSL strict syntax</summary>

```markdown
## Need: Customer email AI routing

@trigger: webhook POST /inbound-email
@input: { from, subject, body }
@step: AI classify (gpt-4o-mini) → one word: "Tech" / "Billing" / "Other"
@step: route by class
  - Tech → open Jira ticket project=TECH
  - Billing → send Email to billing@example.com
  - Other → Slack #cs-general notify on-duty
@on-error: slack #cs-general "AI classify failed: {error}"
```

</details>

---

## Layer 2 nodes

```text
[Webhook]
   ↓
[OpenAI: classify]   ← system prompt restricts output to one word
   ↓
[Switch: by classification]
   ├─ "Tech"    → [Jira: create issue]
   ├─ "Billing" → [Gmail: send to billing]
   └─ "Other"   → [Slack: #cs-general]
```

| Node | type | Key params |
|---|---|---|
| Webhook | `n8n-nodes-base.webhook` | path=`inbound-email`, POST |
| OpenAI | `@n8n/n8n-nodes-langchain.openAi` | model=`gpt-4o-mini`, system="You are a classifier, return one of: Tech / Billing / Other", user=`={{ $json.body.subject }}\n\n{{ $json.body.body }}` |
| Switch | `n8n-nodes-base.switch` | rules: contains "Tech" / "Billing" / fallback |
| Jira | `n8n-nodes-base.jira` | project=TECH, summary=`={{ $('Webhook').item.json.body.subject }}` |
| Gmail | `n8n-nodes-base.gmail` | to=`billing@example.com` |
| Slack | `n8n-nodes-base.slack` | channel=`#cs-general` |

---

## Layer 3

```markdown
### 🤖 AI implementation notes — Customer email routing

**Node choices**
- `openAi` (langchain pkg): chat mode + strict system prompt for output constraint
- `switch` (v3): 3-way clearer than chained `if`
- Cross-node reference: `$('Webhook').item.json` (NOT `$json`) to avoid being overwritten by OpenAI node output

**Required credentials**
- [ ] OpenAI API key
- [ ] Jira OAuth2 / API token
- [ ] Gmail OAuth2
- [ ] Slack OAuth2

**Assumptions**
- LLM 100% returns single word (constrained by system prompt; can still hallucinate)
- Jira project key TECH exists; bot has issue:create

**Test recipe**
1. Send one of each class; verify routing
2. Send ambiguous content; verify fallback ("Other") triggers
3. Break OpenAI key; verify @on-error path

**Known limits**
- LLM occasionally returns non-single-word ("Tech issue"); contains-mode in Switch mitigates but not perfect
- No confidence score; future: use function calling to force JSON output
- OpenAI cost: ~50 tokens/email × 10k/month ≈ $0.50

**Mapped to user requirements**
- @trigger → Webhook
- @step (AI classify) → OpenAI
- @step (route) → Switch + 3 downstream nodes
- @on-error → Error workflow → Slack
```
