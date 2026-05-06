---
name: tigerai-example-finder
description: Searches the reference-workflows/ corpus (2,061 real n8n workflows) and cookbook/ (8 curated patterns) to find the 3-5 closest examples to the user's described intent, then explains how each one works in plain language and how it differs from the user's need. Use when the user says "範例查詢模式", "find examples", "show me examples", "anyone done X before", "similar workflow", or vaguely describes a goal and wants to see prior art before committing to a design.
---

# TigerAI Example Finder

> 🌐 **English** | [繁體中文](SKILL.md)

## 1. Trigger conditions

**Explicit triggers**:
- "example finder mode" / "範例查詢模式" / "Example mode"
- "find examples" / "find similar" / "anyone done X" / "is there one already"
- "show me examples for ..." / "any reference for ..."

**Implicit trigger**:
User mentions "I don't know how", "want to see", "browse first" → AI proactively asks:
> "Want me to find a few similar examples for reference first?"

---

## 2. Search sources (in priority order)

| Source | Count | Role | Search method |
|---|---|---|---|
| `cookbook/` | 8 | TigerAI curated (with full three-layer notes) | Read INDEX titles + use cases |
| `examples/tigerai-flagship/` | TBD Phase 3 | TigerAI enterprise-grade | Read SDD specs |
| `reference-workflows/` | 2,061 | Public corpus (raw JSON) | Use `research/workflow-index.json` (post-Phase-1) + filename parse |

**Filename parse rules** (when no index):
Public corpus naming: `<id>_<Vendor>_<Action>_<Trigger>.json`. Grep keywords:
- User says "Slack notify" → grep `Slack` in filenames + sticky content
- User says "scheduled fetch" → grep `Scheduled` trigger

---

## 3. Search and ranking

### 3.1 Extract keywords
From user description, extract 1–3 core concepts:
> "I want to email customer list to sales every morning"
> → keywords: `schedule`, `customer`, `email`

### 3.2 Three-tier search
1. cookbook first (high quality, complete three-layer notes) → first match wins
2. then examples (enterprise-grade) → priority for enterprise customers
3. finally reference-workflows (large but uneven quality)

### 3.3 Ranking

**Core principle: structural value beats topical similarity**

Users describe needs by "business topic" (e.g. "order notify LINE"), but workflow reusability comes from **skeleton** (webhook + set + notify), not topic. AI must check skeleton first.

**Ranking formula** (high score wins):
1. **Skeleton match** (most important): does user's described trigger / step count / branching align with example skeleton?
   - same trigger (webhook / schedule / form …): +10
   - same primary node types (http+set / merge / splitInBatches): +5 each
2. **Source weight**: cookbook ×3 / flagship ×2.5 / reference ×1
3. **Topical keyword hits** (secondary): business domain words +2 each (prevent topic overpowering skeleton)
4. **Time-relevance penalty**: example uses deprecated nodes (cron / function) -3
5. Hit keyword count adds +1 each

**Example: user says "order notify LINE"**

| Candidate | Topic match | Skeleton match | Source weight | Total | Rank |
|---|---|---|---|---|---|
| cookbook/01 GitHub→Slack | ❌ (GitHub vs order) | ✅✅ (webhook+set+notify perfect) | ×3 | **High** | 1 |
| reference/Telegramtool/1575_Woocommerce | ✅ (order) | ✅ (same skeleton) | ×1 | Mid | 2 |
| reference/Mattermost/0294_Woocommerce | ✅ | ✅ | ×1 | Mid | 3 |

> 🎯 **Lesson**: cookbook 01 has wrong topic but most similar skeleton + high quality; ranking #1 helps user more than "topic-similar but scattered references".

Take Top 3–5. **Always explain the ranking rationale** (avoid user confusion):

> "Example 1 has a different topic (GitHub) but **the structure IS your need** — webhook receives event, compose message, push notification. Modifying from this is fastest."

---

## 4. Presentation format

For each match, AI uses this template (**plain language**, no code dumps):

```markdown
### Example N: <filename or cookbook name>

**What this workflow does**
<one-line business goal>

**How it works**
1. Trigger: <webhook / schedule / form>
2. Main steps: <3-5 plain-language steps>
3. Output: <where>

**Key nodes (why chosen)**
- `<node-type>`: <why over alternatives>

**Vs your need**
- ✅ Same: <what aligns>
- ⚠️ Different: <what differs, what you need to change>

**Use as-is? Modify?**
Suggestion: <use as-is / modify N places / not a fit, see next>
```

After listing all examples, AI ends with:

```
How to proceed?
A. Use Example N as-is → I'll modify it for your version
B. None close enough → switch to Q&A mode for fresh design
C. Show me more (give me more precise keywords)
```

---

## 5. Example: full conversation demo

> **User**: find a workflow that fetches DB data scheduled and emails a report

> **AI** (internal): keywords = `schedule`, `database`, `report`, `email`

> **AI**:
> Found 3 relevant examples:
>
> ### Example 1: cookbook/02-schedule-report.md ⭐ closest
> ... (template above)
>
> ### Example 2: reference-workflows/.../1430_Aggregate_Schedule_Send_Scheduled.json
> ...
>
> ### Example 3: ...
>
> How to proceed? A / B / C?

---

## 6. Next step

| User picks | AI action |
|---|---|
| A (use example) | Enter `sticky-note-to-workflow`, bring the example's Layer 1 and help modify |
| B (design fresh) | Switch to `tigerai-qa-mode` 5-stage Q&A |
| C (more) | Re-search and present 6th–10th |
| Nothing / vague | AI proactively pushes A (most common choice) |

---

## 7. Conversation guidelines

1. **Always plain language**: avoid `n8n-nodes-base.xxx` type names; say "Slack node", "DB node"
2. **Always compare**: each example must say "vs your need"; don't just paste descriptions
3. **No more than 5**: more is fatigue; if can't find, say so honestly + suggest Q&A mode
4. **Don't fake**: if not found, admit; don't pretend
5. **Corpus caution**: reference-workflows may have foreign-language / legacy patterns; AI should filter or annotate

---

## 8. Relation to other Skills

- **Vs `tigerai-qa-mode`**: complementary; if no good example, switch to Q&A
- **Vs `cookbook/`**: first search source
- **Vs `sticky-note-to-workflow`**: hand off after user picks an example
