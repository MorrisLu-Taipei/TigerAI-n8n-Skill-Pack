# Verified Runnable Examples

> 🌐 **English** | [繁體中文](_runnable-README.md)

> Different from cookbook examples (educational markdown) and `_starter-*` templates (blank starting points):
> these JSONs were **actually run on n8n 2.10.3, curl-triggered to 200, execution status=success**.
> They give customers a minimum-risk starting point — guaranteed to import + activate + webhook-fire.

---

## Two verified workflows

| File | Scenario | Nodes | Real execution |
|---|---|---|---|
| [`_runnable-T1-github-slack.json`](_runnable-T1-github-slack.json) | GitHub webhook → Slack notify | 5 | ✅ curl 200 + execution success |
| [`_runnable-Q2-order-line.json`](_runnable-Q2-order-line.json) | Order webhook → LINE Notify | 5 | ✅ curl 200 + execution success |

Both contain the complete three-layer structure (Layer 1 yellow sticky + Layer 2 nodes + Layer 3 blue sticky).

---

## Acceptance evidence

Executed in v0.9.0 third round acceptance (R3), records in [`../tests/REPORT-3.md`](../tests/REPORT-3.md) §4. Excerpt:

### T1 real execution
```
curl -X POST /webhook/github-issue -d '{"title":"R3-v09 test",...}'
→ 200 "Workflow was started"
→ execution status=success
→ Path: Webhook → Set msg → Slack(continueOnFail=true)
```

### Q2 real execution
```
curl -X POST /webhook/order-q2-final -d '{"order_id":"Q2-001","customer_name":"張三","amount":1280}'
→ 200 "Workflow was started"
→ execution status=success
→ Path: Webhook → Set "🛒 New order #Q2-001 customer:張三 amount:$1280" → HTTP LINE Notify(continueOnFail)
```

Both have `continueOnFail` design, so even though the final Slack / LINE credential is stub (no real token), the overall execution still marks success (node failure swallowed but flow ends normally).

---

## Three-layer structure is right in the JSON

Open either JSON and you'll see:

| Node ID | type | Role |
|---|---|---|
| `sticky-user-1` | `n8n-nodes-base.stickyNote` (color=4 yellow) | Layer 1 — user requirement |
| `node-webhook` | `n8n-nodes-base.webhook` | Layer 2 — trigger |
| `node-set` | `n8n-nodes-base.set` | Layer 2 — shape data |
| `node-slack` or `node-line` | `n8n-nodes-base.slack` / `n8n-nodes-base.httpRequest` | Layer 2 — output |
| `sticky-ai-1` | `n8n-nodes-base.stickyNote` (color=5 blue) | Layer 3 — AI commentary |

---

## How to use

### Step 1: Import

```
n8n UI → Workflows → Import from File → choose _runnable-T1-github-slack.json or _runnable-Q2-order-line.json
```

### Step 2: Replace stub credentials with real ones

After import, the Slack / HTTP nodes' credentials are `STUB-slackApi` / `STUB-httpHeaderAuth`. These **only pass the activate check; can't actually send messages**. To actually run:

1. Click the node → Credentials → "New" → create real ones (Slack OAuth2 / LINE Notify token)
2. Replace stub with the new credential
3. Re-activate

### Step 3: Activate + trigger

```bash
# T1
curl -X POST <n8n-url>/webhook/github-issue \
  -H "Content-Type: application/json" \
  -d '{"title":"hello","html_url":"http://x.com/i/1","user":{"login":"me"}}'

# Q2
curl -X POST <n8n-url>/webhook/order \
  -H "Content-Type: application/json" \
  -d '{"order_id":"A001","customer_name":"張三","amount":1280}'
```

Both expected to return `{"message":"Workflow was started"}` 200, and the corresponding Slack channel / LINE group receives the message (after real credential swap).

---

## Three cookbook resource types compared

| Type | Use | Form |
|---|---|---|
| `01–08` cookbook md | Teach you how to write the sticky (Chinese + English natural language + DSL) | Educational markdown |
| `_starter-blank.json` / `_starter-template.json` | Empty sticky / bilingual template; fill in + AI generates nodes | Starter JSON (no nodes) |
| **`_runnable-*.json`** | **Complete three-layer structure + verified runnable** | **Full JSON (with nodes)** |

If you want to:
- Learn how to write stickies → see cookbook 01–08
- Start from blank → use `_starter-*.json`
- Reference a known-working full example → **use `_runnable-*.json`**

---

## Want to see what AI wrote in Layer 3?

Open the JSON and find the `sticky-ai-1` node's `parameters.content`, or in n8n canvas click the bottom blue sticky. You'll see 5 sections: Node choices, Required credentials, Assumptions, Test recipe, Known limits.
