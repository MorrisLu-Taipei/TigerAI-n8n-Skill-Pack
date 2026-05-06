# 03 — Hands-On: Build Your First Workflow in 15 Minutes

> 🌐 **English** | [繁體中文](03-FIRST-WORKFLOW.md)

> Step-by-step tutorial. Follow along and you'll see AI produce a complete workflow with nodes, connections, and an explanation sticky note.
>
> Prerequisite: [01-INSTALL.en.md](01-INSTALL.en.md) completed; n8n and Skill Pack are ready.

---

## What you'll build

Scenario: **Notify Slack when a new GitHub Issue is opened**.

End result:

```
┌─ Top yellow sticky: your requirement ─────────────┐
│ Notify Slack #dev-issues channel when GitHub has   │
│ a new issue. Message must include title, opener,   │
│ link. If Slack is temporarily down, just skip.     │
└────────────────────────────────────────────────────┘
   ↓
┌─ Middle: AI-generated nodes ────────────────────┐
│ Webhook → Set message → Slack Send              │
└─────────────────────────────────────────────────┘
   ↓
┌─ Bottom blue sticky: AI's explanation ──────────┐
│ • Why each node was chosen                       │
│ • Credentials you need to set up                 │
│ • Assumptions and known limits                   │
│ • How to test                                    │
└──────────────────────────────────────────────────┘
```

---

## Step 1: Open n8n, create an empty workflow

1. Open n8n (usually `http://localhost:5678` or your company's deployment URL)
2. Top-left: **Workflows → + New** to create an empty workflow
3. Name it whatever, e.g. "My first AI workflow"

---

## Step 2: Drop a sticky note (this is your requirement)

1. Find **Sticky Note** in the toolbar, drag it to the **top** of the canvas
2. Color: **yellow** (this is Layer 1: user intent)
3. **Paste this text**:

```text
Notify Slack #dev-issues channel when GitHub has a new issue.
Message should include the issue title, opener, and link, prefixed with a 🐛 emoji.
If Slack is temporarily down, just skip — no need to retry later.
```

> 💡 Note: this is plain English. No syntax to learn.
>
> Or copy from [`cookbook/01-webhook-to-slack.en.md`](cookbook/01-webhook-to-slack.en.md) "🌱 Plain-language version".

---

## Step 3: Ask AI to generate the workflow

Pick the option that fits your environment:

### Option A — In Claude Code (most direct)

Tell Claude:

> I created an empty workflow in n8n with one yellow sticky note describing my needs.
> Please generate the middle nodes and the bottom explanation sticky note.

Claude will:
1. Read your sticky (via n8n REST API; needs `N8N_API_URL` / `N8N_API_KEY` set)
2. Auto-trigger the `sticky-note-to-workflow` Skill
3. Produce workflow JSON and write back to your n8n

### Option B — Paste sticky into ChatGPT / Claude.ai chat

Say:

> I want to build an n8n workflow with this requirement: [paste sticky note]
> Please follow the TigerAI Skill Pack three-layer structure and produce JSON I can import into n8n.

The AI returns JSON. Copy to n8n via **Workflows → Import from File**.

### Option C — OpenWebUI integration (if deployed)

Just say it in the chat. The OpenWebUI Function calls n8n API and writes the result back.

---

## Step 4: Verify the three-layer structure

Back in the n8n canvas, you should see:

| Position | Color | Content |
|---|---|---|
| Top | 🟡 Yellow | Your requirement (**unchanged**) |
| Middle | — | Three nodes: Webhook → Set → Slack |
| Bottom | 🔵 Blue | AI's notes: node choices / credentials / assumptions / how to test |

---

## Step 5: Set up real credentials before running

The AI-generated workflow has **complete structure but stub credentials**. To actually run:

1. Click the Slack node → Credentials → "Create New"
2. Follow n8n's Slack OAuth2 flow
3. Replace stub credential with your real one

> 💡 Why doesn't AI create credentials for you? To protect your tokens / accounts. AI only generates structure; you keep secrets.

---

## Step 6: Trigger a real test

In your terminal:

```bash
curl -X POST http://localhost:5678/webhook/github-issue \
  -H "Content-Type: application/json" \
  -d '{"title":"My first test","html_url":"http://example.com/i/1","user":{"login":"me"}}'
```

Expected:
- Response: `{"message":"Workflow was started"}` 200 OK
- Slack #dev-issues receives: `🐛 New Issue: My first test by me → http://example.com/i/1`

---

## Don't use webhooks? Try these instead

| Your need | Cookbook to use | How to test |
|---|---|---|
| Scheduled (daily/weekly) | [02-schedule-report](cookbook/02-schedule-report.en.md) | Click "Execute Workflow" in n8n |
| Form submissions | [03-form-to-database](cookbook/03-form-to-database.en.md) | Open form URL in browser |

---

## You're done! What's next

| Goal | Where |
|---|---|
| More examples | [`cookbook/00-INDEX.en.md`](cookbook/00-INDEX.en.md) — 8 total |
| Don't know how to describe my needs | [`02-USAGE-MODES.en.md`](02-USAGE-MODES.en.md) → Q&A mode |
| Want to see prior art | [`02-USAGE-MODES.en.md`](02-USAGE-MODES.en.md) → Example finder |
| Hit a problem | [`04-FAQ.en.md`](04-FAQ.en.md) |
| Engineer wants tech specs | [`spec/`](spec/) folder |

---

## Stuck?

Tell Claude / ChatGPT:

> "I'm following 03-FIRST-WORKFLOW.en.md, stuck at Step N: <describe problem>"

AI will pick up from there. Or check [04-FAQ.en.md](04-FAQ.en.md).
