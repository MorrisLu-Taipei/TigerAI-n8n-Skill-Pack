# 04 — FAQ

> 🌐 **English** | [繁體中文](04-FAQ.md)

> Stuck? Look here first. Each entry: **Symptom → Cause → Solution**.

---

## Install / setup

### Q1: `install.sh` fails — `~/.claude/skills/` not found

**Symptom**: Script says directory doesn't exist.
**Cause**: Claude Code never installed, or never run.
**Fix**: Run `claude` once first to create `~/.claude/`, then re-run install.sh.

### Q2: n8n won't start

**Symptom**: `http://localhost:5678` won't open.
**Fix**:
1. Check Docker: `docker ps`
2. Check n8n container health: `docker logs n8n --tail 30`
3. Restart: `docker restart n8n`
4. Still broken → check your docker-compose or [n8n docs](https://docs.n8n.io/)

### Q3: How do I get the n8n API key?

**Fix**:
1. Open n8n web UI
2. Bottom-left avatar → Settings → API
3. "Create" → name it → copy the token
4. Set env: `export N8N_API_KEY=<token>` / `export N8N_API_URL=https://your-n8n.example.com`

---

## Writing sticky notes

### Q4: How detailed should the sticky note be?

**Short answer**: Like talking to a coworker. AI will ask follow-up questions for things it can't infer.

**Good example**:
> Every morning at 9, fetch sales data and email a daily report to my boss. On failure, notify Slack #ops.

**Too vague — AI will ask for more**:
> Fetch data and send report.

**Unnecessary**:
> System Requirements Document v1.0: This flow executes ETL daily at 09:00 UTC+8...

### Q5: Must I write in English? Can I use Chinese?

**Fix**: Both work. AI handles either. You can also mix. But keep one sticky in one language to avoid ambiguity.

### Q6: Can I describe multiple flows on one sticky?

**Don't**. One sticky = one workflow. For two flows, build two workflows with one sticky each.

### Q7: When should I use the "Advanced DSL syntax"?

**Fix**: 99% of the time, plain language is enough. Use DSL only for:
1. Enterprise compliance: spec needs to be strict and auditable
2. Bulk: auto-generating many similar workflows; DSL is script-friendly
3. Plain language got mis-parsed by AI; you want 100% control → write DSL

---

## AI generating workflows

### Q8: Generated JSON fails to import into n8n

**Symptom**: n8n shows "import failed" or `null value in column "id"`.
**Cause**: Generated JSON missing n8n required fields (top-level id / webhook's webhookId).
**Fix**: Tell AI "please add top-level id and webhookId per Skill Pack §Step 4.1, regenerate."
(Skill Pack v0.9.0+ handles this automatically; if missing, AI didn't read that rule.)

### Q9: webhook curl returns 404

**Symptom**: `{"code":404,"message":"The requested webhook ... is not registered."}`
**Cause**: Workflow not activated, or path mismatch.
**Fix**:
1. In n8n UI, open the workflow → top-right Active toggle ON
2. Click the Webhook node to see the actual webhook URL (copy that into your curl)
3. Try again

### Q10: Activate fails — "Missing required credential"

**Symptom**: API returns `Cannot publish workflow: Missing required credential: slackApi`
**Cause**: Node requires a credential reference, but stub isn't enough (n8n checks ref exists at activate time).
**Fix** (pick one):
- A. In n8n UI, create a real credential for that node (even with fake token, just make the ref exist), then activate.
- B. Tell AI "please add stub credentials reference so the workflow can activate," AI will follow SKILL §Step 4.2.

### Q11: Activate fails — "Unauthorized: invalid token specified"

**Symptom**: Trigger nodes that establish a connection (e.g. Telegram bot trigger).
**Cause**: Telegram trigger calls real Telegram API at activate time to verify the bot token. Stub fails.
**Fix**: Get a real bot token from [BotFather](https://t.me/botfather) → create a Telegram credential in n8n → reference it. **Required, no workaround.**

### Q12: webhook path conflict

**Symptom**: `There is a conflict with one of the webhooks`
**Cause**: Same n8n instance can't have two active workflows with the same `webhook + path`.
**Fix**: Change the path to be unique (e.g. `/order` → `/order-myteam-2026`). v0.9.0+ AI auto-tags workflow paths to avoid this.

### Q13: Execution fails — "Credential with ID 'stub-XXX' does not exist"

**Symptom**: Activate passed, but curl-triggered execution errors.
**Cause**: Stub credentials only pass the activate check; **execution requires real credentials**.
**Fix**: In n8n UI, select a real credential for that node (create one first), then re-trigger.

---

## Three usage modes

### Q14: Which mode is right for me?

| Your situation | Use |
|---|---|
| I know what I want, fastest please | Cookbook copy (see [02-USAGE-MODES.en.md](02-USAGE-MODES.en.md) Mode 1) |
| I have no idea how to describe it | Q&A mode (tell AI "enable Q&A mode") |
| I have a rough idea but want to see prior art | Example finder (tell AI "find examples for X") |

### Q15: Can I mix modes?

**Yes**. Common combos:
- Example finder → find a close example → Q&A mode to fill the gap → AI generates
- Q&A mode mid-conversation → realize there's a ready example → switch to example finder

---

## Three-layer structure

### Q16: Can I drop the blue sticky? Layer 3 takes too much space

**No**. Layer 3 is required because:
- Lists credentials you need to set (you'll forget without it)
- Flags security risks (e.g. webhook with no secret verification)
- Provides test cases

If size bothers you, shrink the sticky (drag corner), but **don't delete it**.

### Q17: I manually edited Layer 1 (yellow). Do I regenerate?

**Yes**. Tell AI "please regenerate based on the new Layer 1." AI replaces Layer 2 + Layer 3 while **preserving your Layer 1**.

### Q18: Can I directly edit Layer 2 nodes?

**Yes**. But Layer 1 and the implementation will diverge. After editing, add a line to Layer 1 noting "Manual adjustment: XXX".

---

## Enterprise / advanced

### Q19: Can I manage multiple n8n instances (dev / staging / prod)?

**Not built into the Pack yet**, but you can swap `N8N_API_URL` env var. When generating, tell AI "import to dev first, then prod after testing." Multi-environment management coming in v1.x.

### Q20: My data has PII. Is AI safe?

**Yes, with rules**:
1. Sticky notes **must not contain real PII** (no real phone / ID / Email)
2. Use placeholders ("customer email", "phone"). AI generates the correct nodes.
3. Real data only appears at n8n execution time
4. Activate `tigerai-enterprise-patterns` Skill (tell AI "enterprise mode") to enforce security reminders in Layer 3

### Q21: How do I sync Skill Pack upgrades?

**Fix**:
1. `git pull` the latest Skill Pack
2. Re-run `install.sh` to overwrite old skills
3. Tell AI "reload Skill Pack" (or restart Claude Code)
4. Check [CHANGELOG.md](CHANGELOG.md) for what changed

---

## None of these match my problem?

Paste the error + steps you took to AI:

> "Following [filename] doing [step], hit [error], please diagnose"

AI will guide you. For truly stuck cases, file an [issue on GitHub](https://github.com/) (if open-sourced) or contact TigerAI support.
