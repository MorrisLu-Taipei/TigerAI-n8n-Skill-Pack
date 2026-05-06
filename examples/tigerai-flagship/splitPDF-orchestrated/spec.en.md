# SDD: splitPDF-orchestrated

> 🌐 **English** | [繁體中文](spec.md)

## 1. Purpose

**Business objective**: split user-uploaded PDFs by chapter (TOC) into multiple independent PDFs; naming controlled by form parameter.

**Stakeholders**: legal / publishing / training (any unit needing chapter-level PDF ops).

**Why flagship**:
- Embodies TigerAI Pillar 1 (Atomic Orchestration): every chapter is an independently visualized node iteration
- Embodies Pillar 2 (Universal Worker): PyMuPDF logic in FastAPI; n8n is pure orchestrator
- Representative of "Workflow as Code"

---

## 2. Trigger & Inputs

**Trigger**: `n8n-nodes-base.formTrigger` v2

**Input schema**:
| Field | Type | Required | Notes |
|---|---|---|---|
| Upload PDF | binary (file) | ✅ | Any PyMuPDF-parseable PDF |
| Naming Rule | text | ❌ | Default `{title}`; can be `{seq}_{title}` |

---

## 3. Business Logic (Step-by-Step)

```
[Form Trigger]
   ↓
[Save Input File]   → write to /home/node/.n8n-files/splitePDF/input/<original>
   ↓
[Get Chapters]      → Code node calls PyMuPDF for TOC (chapters[])
   ↓
[Split In Batches]  → batchSize=1 (transparency)
   ↓
[Code Per Chapter]  → for each chapter, call PyMuPDF to split + write file
   ↓
[Aggregate]         → collect all chapter output paths
   ↓ (loop back)
```

See `workflow.json` and the `splitePDF/` Python script (in `n8n-mcp-json/splitePDF/` upstream).

---

## 4. Outputs

- **Files**: each chapter as a PDF written to `/home/node/.n8n-files/splitePDF/output/`
- **Names**: applied per form's `Naming Rule`
- **Response**: form shows processed chapter count

---

## 5. Errors & Recovery

| Failure mode | Handling |
|---|---|
| PDF has no TOC | Code returns empty array → skip split, hint user |
| PyMuPDF can't parse (corrupt) | Code throws → workflow fails |
| /home/node/.n8n-files write permission denied | Worker fails on startup |

**Recommendations**:
- Configure Error Trigger workflow for centralized alerts
- Add file size pre-check (avoid GB-sized PDFs choking the worker)

---

## 6. Test Scenarios

1. **Golden**: upload 10-chapter tech manual → expect 10 PDFs
2. **Edge — no TOC**: upload scanned PDF → expect graceful failure + friendly message
3. **Edge — large file**: upload 200MB PDF → observe Worker timeout (5min default)

---

## 7. Deployment Pre-requisites

- n8n container has volume mount: `/home/node/.n8n-files` (shared with Python script)
- Python 3 with `pymupdf` (`pip install pymupdf`)
- If using Universal Worker variant: separate FastAPI container exposing `/split-pdf`

---

## 8. Relation to Skill Pack

- **Three-layer structure**: this example predates the three-layer era; Layer 1/3 stickies absent. Production version should add them.
- **Applicable Skills**: `tigerai-enterprise-patterns` (mandatory), `sticky-note-to-workflow` (if regenerating in three-layer form)
- **DSL mapping** (if rewriting as sticky):
  ```
  @trigger: form
  @form-fields:
    - file: "Upload PDF" (file, required)
    - rule: "Naming Rule" (text, default: "{title}")
  @step: save temp
  @step: get TOC (call PyMuPDF / Worker)
  @step: per chapter, split → write file
  @output: form shows result
  @assume: PyMuPDF can parse the input PDF
  ```
