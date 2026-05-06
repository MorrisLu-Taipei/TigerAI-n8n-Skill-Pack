---
name: tigerai-enterprise-patterns
description: Applies TigerAI enterprise-grade design patterns when generating n8n workflows — Atomic Orchestration, Universal Worker (FastAPI), Specification-Driven Development (SDD), and security/governance constraints. Use when the user mentions enterprise / production / 企業級 / atomic / orchestration / FastAPI worker / SDD, or when a workflow involves heavy compute (PDF/MP3/image processing), regulated data, or multi-team handoff. Drives architectural decisions like loop transparency (batchSize=1), location-transparent workers, and mandatory error/audit annotations.
---

# TigerAI Enterprise Patterns

> 🌐 **English** | [繁體中文](SKILL.md)

## 1. Trigger conditions

**Explicit**:
- "enterprise-grade" / "production" / "go live"
- "atomic" / "orchestration"
- "FastAPI worker" / "Universal Worker" / "external worker"
- "SDD" / "specification-driven"

**Implicit** (must auto-apply):
- Files (PDF / MP3 / image / docs) → Universal Worker
- Multi-team handoff / cross-service orchestration → SDD
- Legal / Finance / Healthcare / PII data → Security governance
- High-cost-of-failure tasks (payments, ETL) → Global Error Trigger workflow

---

## 2. TigerAI Four Pillars (Consultancy Pillars)

From the project README. AI-generated workflows must reflect:

### Pillar 1: Atomic Orchestration
**Problem**: Traditional black-box Python scripts are opaque, hard to debug.
**Solution**: Decompose flow into atomic actions; each = one n8n node; loops use `splitInBatches batchSize=1` for per-iteration UI visibility.
**AI rules**:
- File processing per-item → `splitInBatches batchSize=1` (trade speed for transparency)
- Each atomic node's `notes` field is **mandatory** (maps to which Layer 1 step)
- Disallow stuffing 100 lines into one code node → split into multiple nodes

### Pillar 2: Universal Worker (location transparency)
**Problem**: Installing FFmpeg/PyMuPDF inside n8n container pollutes environment.
**Solution**: Encapsulate heavy logic in FastAPI Worker container; n8n calls via `httpRequest`. Worker URL same across local/WSL/cloud.
**AI rules**:
- Detected "PDF split / MP3 process / image transcode / OCR / FFmpeg" → don't generate code node, generate `httpRequest` to worker
- Default worker URL: `http://worker:8000/<endpoint>`, timeout 300s
- Layer 3 must note "needs FastAPI Worker container deployed first" + expected API contract

### Pillar 3: Skill-Driven Development (this Pack itself)
**Problem**: AI-written workflows are fragmented and inconsistent.
**Solution**: Treat SKILL.md as the single source of truth. Read spec / cookbook / patterns before producing.
**AI rules**:
- Don't generate from thin air — first compare against this Pack's 7 patterns
- Don't quietly modify spec — defer to user

### Pillar 4: Enterprise Security
**AI rules**:
- Webhook defaults to **no secret verification** → Layer 3 must flag "Security risk"
- Any hardcoded credential → refuse, demand credential reference
- PII data flow → Layer 3 must flag "Confirm data retention policy"
- Default timeouts: HTTP 30s / Worker 300s / Wait ≤ 1 hour

### Pillar 4.1: Sunset / Deprecation Watch

External services / APIs / nodes get deprecated. AI must **proactively** warn about time-relevance to avoid users deploying things that fail in months.

**Known sunset list** (continuously updated):

| Service / Node | Status | Action |
|---|---|---|
| LINE Notify API | Sunset 2026/03/31 | Switch to LINE Messaging API (channel access token) |
| Twitter API v1.1 | Discontinued 2023; free v2 limited | Evaluate X Premium or alternative channel |
| `n8n-nodes-base.cron` | Deprecated but functional | Switch to `n8n-nodes-base.scheduleTrigger` |
| `n8n-nodes-base.function` / `functionItem` | Deprecated | Switch to `n8n-nodes-base.code` |
| OpenAI gpt-3.5-turbo | Models deprecate often | Plan model swap (use env var for model ID) |
| Slack Legacy Tokens | Discontinued | Must use OAuth2 |

**AI generation rules**:
- "LINE Notify" detected → Layer 3 must include "⚠️ Sunset 2026/03/31"
- cron / function / functionItem detected → refuse, switch to new nodes
- LLM model mentioned → Layer 3 adds "model may deprecate within 18 months; use env var for model ID"
- Not in list but user explicitly says "known to be sunset" → transcribe to Layer 3

**Maintenance**:
- This list is updated **at least quarterly** by TigerAI ops team
- Customers can subscribe to additions in Slack channel `#tigerai-skill-pack-updates`
- Deprecated entries move to `research/deprecated-services.md` (TBD) for history

---

## 3. SDD (Specification-Driven Development) integration

For enterprise-grade workflows, AI **suggests** users also create a `specification.md`:

```markdown
# Workflow Specification

## 1. Purpose
- Business objective
- Stakeholders

## 2. Trigger & Inputs
- Trigger type
- Input schema (JSON Schema or field list)

## 3. Business Logic (Step-by-Step)
- Maps to this workflow's @step order

## 4. Outputs
- External returns / write targets / notification recipients

## 5. Errors & Recovery
- Known failure modes
- Error Trigger workflow ID

## 6. Test Scenarios
- At least 3 cases: golden path / edge / error
```

**AI rule**: when user says "enterprise-grade" / "SDD", after producing JSON **proactively ask**: "Want me to also produce specification.md?"

---

## 4. Flagship reference examples

| Example | Pillars | Path |
|---|---|---|
| splitPDF-orchestrated | 1 + 2 | `examples/tigerai-flagship/splitPDF-orchestrated/` |
| splitMP3-API-Orchestrated | 1 + 2 | `examples/tigerai-flagship/splitMP3-API-Orchestrated/` |
| openwebui-bridge-v2 | 3 (Skill driven) | `examples/tigerai-flagship/openwebui-bridge-v2/` |
| Test 4 (this Pack) | All 4 | `tests/4-pdf-worker-s3/workflow.json` |

---

## 5. AI self-check list

After producing enterprise-grade workflow, **must verify each**:

- [ ] Heavy logic in worker, n8n only orchestrates?
- [ ] Loop is `batchSize=1` (unless explicitly speed-prioritized)?
- [ ] Every node `notes` filled?
- [ ] Credentials are references (not hardcoded)?
- [ ] Layer 3 includes "Security risk" / "Data retention"?
- [ ] Global Error Trigger workflow suggested?
- [ ] All timeouts set?
- [ ] All 6 SDD sections findable in Layer 1+3?

Missing one = not enterprise-grade.

---

## 6. Integration with other Skills

- **Vs `sticky-note-to-workflow`**: this Skill is its "enterprise branch", auto-activates on enterprise context
- **Vs `n8n-validation-expert`**: validate output with profile=`strict`

---

## 7. Anti-patterns (forbidden in enterprise)

- ❌ 100-line business logic in code node
- ❌ Hardcoded API key / DB password
- ❌ `manualTrigger` in production
- ❌ No timeout on third-party API call
- ❌ No Error Trigger workflow
- ❌ PII without access control / log redaction
- ❌ Workflow names like "Untitled" / "Test" / "Copy of..."
