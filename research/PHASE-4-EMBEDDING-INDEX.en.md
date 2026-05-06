# Phase 4 Design Doc: reference-workflows Semantic Index

> 🌐 **English** | [繁體中文](PHASE-4-EMBEDDING-INDEX.md)

> **Status**: design phase, NOT implemented. Recorded as v0.7.0 placeholder.
> **Priority**: low (filename grep + cookbook covers 80% of cases)

---

## 1. Motivation

The current `tigerai-example-finder` Skill searches 2,061 workflows via:
1. Filename parse (`<id>_<Vendor>_<Action>_<Trigger>`)
2. Text search of cookbook 8's INDEX
3. When needed, calls `n8n-mcp.search_templates`

**Pain points**:
- Filename has only 4 fields; can't represent semantics inside sticky notes (many workflow topics live there)
- Users describe in natural language (e.g. "customer routing"); grep can't catch English synonyms like "routing customer feedback"
- Cross-language (Chinese ↔ English) impossible via text search

---

## 2. Goals

Build a "semantic embedding index" per workflow so example-finder Skill can:
- Query in natural language (any language)
- Find semantically similar examples (even with different vocabulary in filename / sticky)
- Combine "structural similarity" and "topical similarity" in ranking

---

## 3. Design

### 3.1 Index content (per workflow row)

```json
{
  "file": "Telegramtool/1575_Telegramtool_Woocommercetool_Automate_Webhook.json",
  "name": "<wf.name>",
  "description_concat": "<all sticky note content concatenated>",
  "node_types": ["webhook", "set", "telegram", ...],
  "trigger_type": "webhook",
  "size_bucket": "medium",
  "embedding": [0.123, -0.456, ...],   // 1536 dim (Anthropic / OpenAI / local)
  "skeleton_hash": "<canonical node-type sequence>"
}
```

### 3.2 Embedding source (pick one)

| Option | Pros | Cons |
|---|---|---|
| **Anthropic Voyage** (preferred) | multilingual, high quality, TigerAI has API key | cloud, paid |
| **OpenAI text-embedding-3-small** | standard, cheap ($0.02/1M tokens) | cloud, paid |
| **Local sentence-transformers** | free, private | uneven multilingual quality, self-deploy |

**Cost estimate** (OpenAI route):
- 2,061 workflows × ~2,000 tokens = ~4M tokens
- One-time index build: ~$0.08
- Monthly incremental update: ~$0.01

### 3.3 Index storage

- **Phase 4a**: flat JSON `research/embedding-index.json` (~10 MB)
  - Load into memory and query
  - Cosine similarity (tens of ms)
- **Phase 4b** (optional): SQLite + `sqlite-vss` extension
  - Suitable for > 10,000 workflow scale

### 3.4 Integrate into example-finder Skill

Modify `tigerai-example-finder/SKILL.md` §3.2 three-tier search:

```text
1. cookbook (same as now, text INDEX)
2. flagship (same as now)
3. reference-workflows:
   a. compute embedding for user description
   b. top-K cosine similarity against embedding-index.json
   c. combine with §3.3 ranking formula (skeleton + topic + sunset)
```

---

## 4. Implementation steps (when actually executed)

1. **Script** `research/_build_embeddings.js`:
   - Walk `reference-workflows/`, extract sticky notes + name + node types
   - Call embedding API in batches (100 per batch)
   - Output `embedding-index.json`
2. **Query function** `research/_search.js`:
   - Load index
   - Top-K against query embedding
3. **Integrate SKILL.md**: add invocation example
4. **Acceptance**: re-run Q2 example-finder's 7 hypothetical needs and compare recall

---

## 5. Why not implementing now

- Current workflow count (2,061) covered by filename + cookbook for 80% of cases
- example-finder v0.6.0's "structural value first" ranking already greatly improved UX
- Customer beta testing doesn't need richer search yet
- Would add: API key management / index rebuild scheduling / ops cost

**Activation triggers**:
- Customers complain "can't find the example I need"
- Workflow library grows to 5,000+
- Begin accepting multilingual (Japanese / Korean / Spanish) needs

---

## 6. Risks and alternatives

- If embedding API short-term unavailable → fall back to plain text search (small impact)
- Privacy concerns (customer reference-workflows contain sensitive data) → use local sentence-transformers
- Index drift (new workflows not promptly indexed) → schedule cron hourly incremental

---

**Conclusion**: design recorded. Don't activate implementation until customer validation.
