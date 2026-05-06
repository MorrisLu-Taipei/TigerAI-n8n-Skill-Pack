# Starter Templates

> 🌐 **English** | [繁體中文](_starter-README.md)

> Don't want to manually drag a yellow sticky note in n8n? Import either JSON below to get a **ready-positioned Layer 1 yellow sticky** waiting for you to fill in.

---

## Two starter templates

| File | Contents | Best for |
|---|---|---|
| [`_starter-blank.json`](_starter-blank.json) | One completely blank yellow sticky | You know how to describe your need; want minimal setup |
| [`_starter-template.json`](_starter-template.json) | Yellow sticky pre-loaded with a "fill-in template" (bilingual) + sample | Not sure how to start; follow the template |

---

## How to use

### Step 1: Import into n8n

```
n8n UI → Workflows → Import from File → choose _starter-blank.json or _starter-template.json
```

Or paste the JSON content into the Import dialog.

### Step 2: Fill in the sticky

Open the imported workflow. A yellow sticky note is already positioned (top of canvas). Double-click it and write your requirement.

**No syntax restrictions**:
- Plain natural language (Chinese / English / mixed) — see 8 examples in [`STICKY-EXAMPLES-BILINGUAL.en.md`](STICKY-EXAMPLES-BILINGUAL.en.md)
- Advanced DSL syntax — see [`../spec/sticky-note-dsl.en.md`](../spec/sticky-note-dsl.en.md)

### Step 3: Ask AI

Tell Claude / ChatGPT:

> "I have an n8n workflow (ID: `starter-blank-001` or `starter-template-001`) with a yellow sticky describing my need. Please generate the middle nodes + bottom explanation sticky."

AI will:
1. Read your sticky
2. Generate middle nodes (Layer 2)
3. Write the bottom blue commentary sticky (Layer 3)
4. Push back via n8n REST API (if `N8N_API_URL` / `N8N_API_KEY` are set)

---

## Difference between the two JSONs

### `_starter-blank.json` — fully blank
Sticky `content = ""`. After import, double-click and write whatever. Looks like:

```
┌───────────────────────────┐
│                           │  ← Empty yellow sticky, waiting for you
│                           │
└───────────────────────────┘
```

### `_starter-template.json` — bilingual fill-in template
Sticky pre-loaded with 5 sections (Chinese + English side by side) + natural language sample. Looks like:

```
┌──────────────────────────────────────┐
│ ## 寫你的需求 / Describe your need     │
│                                       │
│ 範例：每天早上 9 點抓銷售資料寄報表... │
│ Example: Every day at 9 AM fetch...   │
│                                       │
│ 什麼時候跑 / When to run: ____        │
│ 要做什麼 / What to do:                │
│   1. ____                             │
│   2. ____                             │
│ 結果送哪 / Where output goes: ____    │
│ 失敗怎辦 / On failure: ____           │
└──────────────────────────────────────┘
```

---

## Next

After importing and filling your need, you've entered the "**Cookbook copy**" flow from [`02-USAGE-MODES.en.md`](../02-USAGE-MODES.en.md). Continue from Step 3 of [`03-FIRST-WORKFLOW.en.md`](../03-FIRST-WORKFLOW.en.md).
