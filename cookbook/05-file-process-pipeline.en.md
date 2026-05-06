# Cookbook 05 — File processing pipeline

> 🌐 **English** | [繁體中文](05-file-process-pipeline.md)

## Use case
User uploads PDF / MP3 / image; an external Worker (FastAPI container) splits / transcodes / produces multiple files; each gets uploaded to cloud. **Maps to TigerAI enterprise patterns: Atomic + Universal Worker.**

---

## Sticky note content

### 🌱 Plain-language version (recommended)

**【English】**

```text
I want a form for users to upload PDFs, with fields:
  - Upload PDF (required)
  - Naming prefix (optional, default "doc")

After receiving:
1. Save the file to server temp
2. Call our Worker (http://worker:8000/split-pdf) to split by chapters
3. Each chapter's filename: "prefix_NNN_title.pdf" (3-digit zero-padded)
4. Upload each one to S3 bucket `company-docs` under `pdfs/`
5. After all done, show "Processed N chapters + S3 paths" on the form

On failure, clean temp and return error.

⚠️ Assumptions: Worker is deployed, shares /tmp with n8n, S3 bucket exists with write permissions
```

**【繁體中文】**

```text
我要一個表單給人上傳 PDF，欄位有：
  - 上傳 PDF（必填）
  - 命名前綴（選填，預設 "doc"）

收到後：
1. 把檔案先存到伺服器暫存
2. 呼叫我們的 Worker（http://worker:8000/split-pdf）幫我按章節切開
3. 每一章的檔名是「前綴_編號_章節名.pdf」（編號 3 位數補零）
4. 一章一章上傳到 S3 的 company-docs 這個 bucket，路徑放在 pdfs/ 下
5. 全部完成後在表單頁面顯示「處理了幾章 + S3 路徑清單」
失敗就清理暫存檔，回傳錯誤訊息。

⚠️ 假設：Worker 已部署、與 n8n 共用 /tmp 資料夾、S3 bucket 已建立有寫入權限
```

<details>
<summary>📐 Advanced: DSL strict syntax</summary>

```markdown
## Need: PDF chapter split → S3 upload

@flow: upload PDF → call Worker to split by chapters → upload each to S3
@trigger: form
@form-fields:
  - file: "Upload PDF" (file, required)
  - prefix: "Naming prefix" (text, default: "doc")
@step: save temp to /tmp/{uuid}/input.pdf
@step: call FastAPI Worker POST http://worker:8000/split-pdf, receive chapters[]
@step: per chapter (loop):
  - name = "{prefix}_{seq:03d}_{title}.pdf"
  - upload S3 bucket: company-docs, key: pdfs/{name}
@output: form shows processed chapter count + S3 path list
@on-error: clean /tmp, return error message

@assume: FastAPI Worker `worker:8000` deployed and accessible from n8n (intranet)
@assume: /tmp is volume mount shared by n8n + worker
@assume: S3 bucket `company-docs` exists; credential has PutObject permission
```

</details>

---

## Layer 2 nodes

```text
[Form Trigger]
       ↓
[Write Binary File: /tmp/{uuid}/input.pdf]
       ↓
[HTTP: POST worker /split-pdf]   ← returns chapters[]
       ↓
[Split In Batches: chapters]
       ↓
[Code: naming rule]
       ↓
[AWS S3: upload]
       ↓
[Aggregate: collect S3 keys]
       ↓
[Respond to Form: show result]
```

| Node | Highlights |
|---|---|
| Form | accept `.pdf` only |
| Write Binary File | path expression `={{ '/tmp/' + $execution.id + '/input.pdf' }}` |
| HTTP Worker | bodyParameters carry file path; timeout 300s |
| Split In Batches | batchSize=1 → process chapters one-by-one (transparency) |
| Code naming | `${prefix}_${String(seq).padStart(3,'0')}_${title}.pdf` |
| S3 | operation=`upload`, bucketName=`company-docs` |
| Aggregate | collect all batch S3 keys |

---

## Layer 3

```markdown
### 🤖 AI implementation notes — PDF Worker S3 (TigerAI atomic mode)

**Node choices (per TigerAI flagship pattern)**
- TigerAI **Universal Worker** pattern: business logic in FastAPI (not Code node); n8n is pure orchestrator
- `splitInBatches` batchSize=1: deliberate one-by-one — every chapter execution visible (loop transparency)
- `aggregate`: combines multi-batch results into single response for Form

**Required credentials**
- [ ] AWS S3 credential
- Worker URL is intranet (no credential needed); add Header Auth if exposed

**Assumptions**
- FastAPI Worker `worker:8000` is deployed and reachable
- Worker contract: POST `/split-pdf` body `{file_path}`, returns `{chapters:[{title,page,output_path}]}`
- /tmp is ephemeral, shared volume between n8n and worker
- S3 bucket `company-docs` exists

**Test recipe**
1. Upload a 3-chapter PDF → S3 should have 3 files
2. Upload non-PDF → Form rejects via accept filter
3. Stop worker → triggers @on-error path

**Known limits**
- /tmp not actively cleaned (relies on container restart)
- Worker timeout 5min; very large PDFs fail
- No S3 conflict check (overwrite by name)

**Mapped to user requirements**
- @trigger → Form
- @step (temp) → Write Binary File
- @step (Worker split) → HTTP Request
- @step (loop name+upload) → Split In Batches → Code → S3
- @output → Aggregate → Respond to Form
```
