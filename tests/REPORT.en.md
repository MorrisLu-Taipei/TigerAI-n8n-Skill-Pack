# Round 1 Acceptance Report: 5 End-to-End Scenarios

> 🌐 **English** | [繁體中文](REPORT.md)

> **Method**: Using this Skill Pack's spec / cookbook / patterns as the only reference, AI directly produced complete three-layer workflow JSON for 5 scenarios (dogfooding).
> **Pass criteria**: (1) JSON importable to n8n (2) three-layer structure compliant (3) AI proactively fills gaps (4) revealed spec gaps are fixable.

---

## 1. Result overview

| # | Scenario | Type | Nodes | JSON parse | Three-layer | Conclusion |
|---|---|---|---|---|---|---|
| 1 | GitHub Webhook → Slack | Aligned with cookbook 01 | 5 | ✅ | ✅ | ✅ Pass |
| 2 | RSS → AI summarize → Email | Cookbook 02 variant | 11 | ✅ | ✅ | ✅ Pass |
| 3 | Telegram bot ↔ OpenAI | New scenario | 7 | ✅ | ✅ | ✅ Pass |
| 4 | PDF → Worker → S3 | TigerAI flagship | 11 | ✅ | ✅ | ✅ Pass |
| 5 | Order → AI risk routing | Complex composite | 14 | ✅ | ✅ | ✅ Pass |

**5/5 pass.** The three-layer spec + DSL + cookbook + 7 patterns suffice to drive AI to produce production-grade workflows in tested scenarios.

---

## 2. Revealed spec gaps (must-fix in Phase 3)

### Critical (impacts usability)
1. **`@on-error` two implementation modes** — same-workflow `continueOnFail` (Test 3) vs cross-workflow `Error Trigger` (Test 2); spec doesn't distinguish.
   → **Fix**: add §6 to `spec/sticky-note-three-layer.md` describing when to use which.

2. **DSL `@trigger` dictionary missing common items** — `telegram` / `slack` / `discord` / `googleDriveTrigger` not listed in §3.
   → **Fix**: extend `spec/sticky-note-dsl.md` §3 table.

3. **"Routing sub-rules" lacks strict syntax** — Test 5's `@step: split by score: high (>70): ...` is natural language; parser hard.
   → **Fix**: add `@branch` tag syntax.

### Major (impacts quality)
4. **Cross-node variable reference gotcha** — `$('NodeName').item.json` vs `$json` is a common pitfall (used in Tests 3, 5), but spec doesn't mention.
   → **Fix**: add to `spec/sticky-note-dsl.md` §6 parser spec.

5. **`@assume` lacks usage example in cookbook** — Tests 4, 5 use it naturally but cookbook 8 examples don't show.
   → **Fix**: add `@assume` example to cookbook 05 / 06.

6. **Node count cap of 15 too tight** — Test 5 hits 14; branched workflows easily exceed.
   → **Fix**: rule in `research/patterns.md` §5 → "branched can relax to 25".

### Minor (polish)
7. **Switch must add fallback when missing** — Test 5 missed NaN path; AI didn't proactively add.
   → **Fix**: add 5th structural-node rule to `research/patterns.md`.

8. **No-matching-node downgrade rule** — Test 1's "log to console", Test 4's "clean /tmp" have no native nodes.
   → **Fix**: add "downgrade rule" to DSL §6.

9. **TigerAI enterprise philosophy (batchSize=1 transparency) not documented** — Test 4 relied on AI self-aligning to cookbook 05.
   → **Fix**: Phase 3 must complete `skills/tigerai/tigerai-enterprise-patterns/SKILL.md`.

---

## 3. AI self-performance observations

### Did well
- ✅ For 5 node types **not in spec** (rssFeedRead, limit, telegramTrigger, awsS3, jira), AI selected correctly
- ✅ `splitInBatches` loop-back wiring (output[0] body, output[1] aggregate) — 4/4 written correctly
- ✅ Layer 3 5 mandatory sections (Node choices / Credentials / Assumptions / Tests / Limits) — 100% covered
- ✅ Anti-pattern check: 5/5 used `scheduleTrigger` not `cron`, `code` not `function`
- ✅ webhook paired `responseMode=responseNode` + `respondToWebhook` correctly

### Tends to err
- ⚠️ `@on-error` path often "half-implemented" (noted in Layer 3 but no actual node)
- ⚠️ Switch fallback often missed
- ⚠️ Cleanup / side-effect nodes (rm -rf) without native support: easily glossed over

---

## 4. Customer usability conclusion

| Role | Usability | Notes |
|---|---|---|
| n8n veteran | ⭐⭐⭐⭐⭐ | Spec + cookbook works immediately |
| n8n beginner (Q&A mode) | ⭐⭐⭐⭐ | Needs Phase 3 sticky-note-to-workflow Skill implementation |
| OpenWebUI integration | ⭐⭐⭐ | Needs Phase 3 + integrations/openwebui/ |
| Pure API automation (no UI) | ⭐⭐⭐⭐ | Use n8n REST API + Pack JSON examples |

---

## 5. Recommended next priorities

1. **Fix 9 spec gaps** (half-day, transcribe from this report)
2. **Phase 3: implement 3 tigerai Skills** (core: sticky-note-to-workflow)
3. **OpenWebUI integration spike** (validate cloud AI API + n8n REST end-to-end)
4. **Write install.sh / install.ps1 / plugin.json** (one-click for customers)
5. **Re-run acceptance** (including Q&A and example-finder modes end-to-end)

---

**Report version**: v1.0
**Date**: 2026-05-05
**By**: Claude (dogfooding TigerAI Skill Pack v0.3.0)
