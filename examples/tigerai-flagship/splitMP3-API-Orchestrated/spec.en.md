# SDD: splitMP3-API-Orchestrated

> 🌐 **English** | [繁體中文](spec.md)

## 1. Purpose

**Business objective**: split uploaded MP3 by time segments into multiple clips (podcast chapters / meeting recordings / lecture segments).

**Why flagship**: **same pattern as splitPDF-orchestrated, different media** — proves TigerAI design transfers.

---

## 2. Trigger & Inputs

**Trigger**: `n8n-nodes-base.formTrigger`

**Input schema**:
| Field | Type | Required | Notes |
|---|---|---|---|
| Upload MP3 | binary (audio) | ✅ | Any MP3 |
| Segments JSON | text | ✅ | `[{"name":"intro","start":"00:00","end":"03:30"}, ...]` |

---

## 3. Business Logic

```
[Form Trigger]
   ↓
[Save Input MP3]
   ↓
[Parse Segments JSON]   → set node parses JSON
   ↓
[Split In Batches]      → batchSize=1
   ↓
[HTTP → FastAPI /split-mp3]   ← Universal Worker handles FFmpeg
   ↓
[Aggregate]
```

Key: FFmpeg is **NOT in the n8n container** — keeps it clean. Worker exposes `/split-mp3` accepting `{file_path, name, start, end}`.

---

## 4. Outputs

- Each segment written to `/home/node/.n8n-files/splitMP3/output/<name>.mp3`
- Form responds with segment count + paths

---

## 5. Errors & Recovery

| Failure mode | Handling |
|---|---|
| Segments JSON invalid | Set node parse throws |
| Time range exceeds MP3 | Worker returns 400 → segment fails, others continue (continueOnFail) |
| FFmpeg unavailable | Worker fails on startup; whole workflow non-functional |

---

## 6. Test Scenarios

1. **Golden**: 60-min podcast split into 5 segments → 5 MP3s
2. **Edge**: time exceeds → that segment fails but doesn't block others
3. **Edge**: non-MP3 → form `acceptFileTypes` rejects

---

## 7. Deployment Pre-requisites

- Deploy FastAPI Worker container: `worker:8000` with `ffmpeg`
- Worker endpoint:
  ```
  POST /split-mp3
  body: { file_path, name, start_time, end_time }
  response: { output_path, duration }
  ```
- Volume mount: n8n + worker share `/home/node/.n8n-files`

---

## 8. Comparison with splitPDF

| Dimension | splitPDF | splitMP3 |
|---|---|---|
| Worker logic | PyMuPDF | FFmpeg |
| Split key | TOC | User-provided time ranges |
| Transparency | batchSize=1 | batchSize=1 |
| Output location | `/.../splitePDF/output/` | `/.../splitMP3/output/` |
| Skeleton | **Identical** | **Identical** |

→ Proves TigerAI flagship pattern (orchestrate + Worker) has reusable skeleton for "compute-heavy batch processing."
