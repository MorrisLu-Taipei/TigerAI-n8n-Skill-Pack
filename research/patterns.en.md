# Workflow Pattern Synthesis (Phase 1)

> 🌐 **English** | [繁體中文](patterns.md)

> Patterns derived from co-occurrence + stats over 2,061 workflows. These are the skeletons AI should **prioritize** when generating workflows.

---

## 1. Top 10 co-occurrence (which nodes appear together)

| Node pair | Count | Implied pattern |
|---|---|---|
| `httpRequest` + `set` | **592** | API fetch + shape data |
| `noOp` + `set` | 585 | Branch converge + set field |
| `manualTrigger` + `stopAndError` | 507 | Manual demo with validation |
| `manualTrigger` + `set` | 464 | Demo set parameters |
| `if` + `set` | 453 | Conditional + shape |
| `httpRequest` + `noOp` | 439 | API call + branch |
| `set` + `stopAndError` | 432 | Set then validate |
| `httpRequest` + `manualTrigger` | 425 | Manual API test |
| `manualTrigger` + `noOp` | 389 | Demo placeholder |
| `noOp` + `stopAndError` | 388 | Branch + throw |

### Truly meaningful "business pattern" co-occurrences

After excluding `manualTrigger` / `noOp` etc. (template/structural):

| Node pair | Pattern name |
|---|---|
| `httpRequest` + `set` | **API shape** |
| `if` + `set` | **Conditional shape** |
| `code` + `httpRequest` | **API + custom logic** |
| `merge` + `set` | **Merge + shape** |
| `set` + `splitOut` | **Array → single** |
| `httpRequest` + `splitOut` | **API returns array, split** |
| `scheduleTrigger` + `set` + `httpRequest` | **Scheduled API fetch** (cookbook 02 pattern) |
| `googleSheets` + `set` | **Write to Sheet** |
| `httpRequest` + `merge` | **Multi-API merge** (cookbook 07 pattern) |
| `set` + `switch` | **Field-based routing** (cookbook 04 pattern) |

---

## 2. 7 standard skeletons synthesized from co-occurrences

### Pattern A: Webhook real-time (cookbook 01 / 04)
```
webhook → [validate (if)] → [transform (set/code)] → action(s) → respondToWebhook
```
~60% of 313 webhook workflows.

### Pattern B: Scheduled data sync (cookbook 02 / 07)
```
scheduleTrigger → httpRequest (×N parallel) → merge → transform → output (sheets/db/email)
```
~50% of 311 schedule workflows.

### Pattern C: Form intake (cookbook 03)
```
formTrigger → if(validate) → [postgres/airtable/sheets insert] → respondToWebhook
```
~40% of 114 formTrigger workflows.

### Pattern D: Batch processing (cookbook 08)
```
[trigger] → [fetch list] → splitInBatches → (loop body) → aggregate → output
```
splitInBatches (224) + aggregate (173) heavily co-occur.

### Pattern E: Conditional routing (cookbook 04)
```
[trigger] → [classify (code/openAi)] → switch → branches → noOp(merge) → output
```
switch (234) usually pairs with set + noOp.

### Pattern F: Sub-workflow orchestration (TigerAI atomic / cookbook 05)
```
[main] → executeWorkflow → [worker workflow]
                       ↓
                       splitInBatches loop
```
executeWorkflowTrigger (180) shows enterprises starting to split workflows.

### Pattern G: Retry + error notification (cookbook 06)
```
[main] httpRequest (retry config) → success → output
                                   ↓ fail
                                   slack/gmail
+ errorTrigger workflow (global)
```
**Warning**: errorTrigger only used in 18 workflows (<1%) → most don't use global error handling. AI must guide.

---

## 3. Anti-patterns (common in corpus, AI should avoid)

### Anti-pattern 1: manualTrigger in production
- 927 workflows use manualTrigger (45%)
- Demo OK; production should use webhook / schedule
- **AI rule**: when generating production workflows, forbid manualTrigger (unless user explicitly says `@trigger: manual`)

### Anti-pattern 2: missing error handling
- 88% of workflows have NO error handling
- **AI rule**: any workflow containing httpRequest, must flag in Layer 3 "Known limits"
- **AI rule**: when user didn't write `@on-error`, proactively suggest

### Anti-pattern 3: legacy nodes
- `cron` (108) / `function` (125) still appear
- **AI rule**: output always uses new nodes (`scheduleTrigger` / `code`)

### Anti-pattern 4: oversized workflows not split
- 216 xlarge workflows (31+ nodes)
- Hard to maintain
- **AI rule**: when output > 15 nodes, proactively suggest sub-workflow (`executeWorkflowTrigger`)

---

## 4. Mapping to 8 cookbooks

| Cookbook | Pattern | Corpus support |
|---|---|---|
| 01 webhook→slack | A | 313 webhook + 140 slack |
| 02 schedule→email | B | 311 schedule + 168 gmail |
| 03 form→DB | C | 114 form + airtable/postgres |
| 04 AI route | E | 234 switch (with AI agent freq) |
| 05 file pipeline | F + custom worker | executeWorkflow 180 + httpRequest 895 |
| 06 retry/error | G | 251 with error handling (incl. 18 errorTrigger) |
| 07 multi-source | B (variant) | 340 merge |
| 08 batch | D | 224 splitInBatches + 173 aggregate |

✅ **8 cookbooks fully cover the 7 standard skeletons**.

---

## 5. AI's workflow generation decision flow (summary)

```text
1. Parse Layer 1 DSL → confirm trigger
2. Match against 7 Patterns → pick closest skeleton
3. Apply node mapping (node-frequency.md §4 + dsl §4)
4. Auto-add structural nodes:
   - if followed by noOp converge
   - splitInBatches followed by aggregate
   - webhook trigger paired with respondToWebhook
   - switch without explicit fallback → must add fallback (NaN/null/otherwise) → noOp
   - 3+ branch switch → tail must merge (mode=append) into single output
5. Node count caps (flexible):
   - linear workflow ≤ 15 nodes → over → suggest sub-workflow (executeWorkflowTrigger)
   - branched workflow ≤ 25 nodes → relaxed because each branch has independent nodes
6. Proactively add Layer 3 risk warnings:
   - Contains httpRequest → flag retry/timeout
   - Missing @on-error → suggest add (per three-layer.md §6 mode A or B)
   - Node count nearing cap → suggest sub-workflow split
   - LLM scoring/classify → flag non-determinism, calibration needed
   - Switch missing fallback → AI auto-adds + Layer 3 notes "user did not specify, default noOp"
7. Forbid: manualTrigger (unless explicit) / cron / function
```
