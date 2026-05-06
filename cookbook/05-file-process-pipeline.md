# Cookbook 05 — 檔案處理 Pipeline

> 🌐 [English](05-file-process-pipeline.en.md) | **繁體中文**

## 使用情境
使用者上傳 PDF / MP3 / 圖片，呼叫外部 Worker（FastAPI 容器）切分、轉檔、產出多個小檔，逐一上傳到雲端。**對應 TigerAI 企業模式：原子化 + Universal Worker**。

---

## Sticky Note 內容

### 🌱 自然語言版（推薦）

**【中文】**

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
5. After done, show "Processed N chapters + S3 paths" on the form
On failure, clean temp and return error.

⚠️ Assumptions: Worker deployed, shares /tmp with n8n, S3 bucket exists with write permissions.
```

<details>
<summary>📐 進階：DSL 嚴謹寫法</summary>

```markdown
## 需求：PDF 切章節 → 上傳 S3

@trigger: form
@form-fields:
  - file: "上傳 PDF" (file, required)
  - prefix: "命名前綴" (text, default: "doc")
@step: 存暫存到 /tmp/{uuid}/input.pdf
@step: 呼叫 FastAPI Worker POST http://worker:8000/split-pdf 取得 chapters[]
@step: 逐章節 (loop) 處理：
  - 命名 = "{prefix}_{seq:03d}_{title}.pdf"
  - 上傳 S3 bucket: company-docs, key: pdfs/{命名}
@output: form 顯示已處理章節數與 S3 路徑列表
@on-error: 清理 /tmp，回傳錯誤訊息

@assume: FastAPI Worker `worker:8000` 已部署且 n8n 可從內網存取
@assume: /tmp 為 n8n 與 worker 共用 volume mount
@assume: S3 bucket `company-docs` 已存在且 credential 有 PutObject 權限
```

</details>

---

## 預期 Layer 2

```
[Form Trigger]
       ↓
[Write Binary File: /tmp/{uuid}/input.pdf]
       ↓
[HTTP: POST worker /split-pdf]   ← 回傳 chapters[]
       ↓
[Split In Batches: chapters]
       ↓
[Code: 命名規則]
       ↓
[AWS S3: upload]
       ↓
[Aggregate: 收集 S3 keys]
       ↓
[Respond to Form: 顯示結果]
```

| 節點 | 重點 |
|---|---|
| Form | accept `.pdf` only |
| Write Binary File | path 用 `={{ '/tmp/' + $execution.id + '/input.pdf' }}` |
| HTTP Worker | bodyParameters 帶 file path，timeout 設 300s |
| Split In Batches | batchSize=1 → 章節逐一處理（透明度） |
| Code 命名 | `${prefix}_${String(seq).padStart(3,'0')}_${title}.pdf` |
| S3 | operation=`upload`, bucketName=`company-docs` |
| Aggregate | 收集所有 batch 的 S3 key |

---

## 預期 Layer 3

```markdown
### 🤖 AI 實作說明 — PDF 章節切分上傳

**節點選型**
- 採 **TigerAI Universal Worker 模式**：邏輯放在 FastAPI（非 Code 節點），n8n 只當編排者
- `splitInBatches` batchSize=1：刻意逐筆，讓畫面上每章節執行可見（loop 透明度）
- `aggregate`：把多筆 batch 結果合併成單一回應給 Form

**所需 Credentials**
- [ ] AWS S3 credential
- Worker URL 走內網不需 credential（如走公網需加 Header Auth）

**前提假設**
- FastAPI Worker `worker:8000` 已部署且可從 n8n 存取
- Worker 介面：POST `/split-pdf` body `{file_path}`，回傳 `{chapters:[{title,page,output_path}]}`
- /tmp 為 ephemeral，n8n 與 worker 共用 volume mount
- S3 bucket `company-docs` 已建立

**測試建議**
1. 上傳一個含 3 章節的 PDF → S3 應出現 3 檔
2. 上傳非 PDF → Form 應拒絕（accept filter）
3. Worker 服務停掉 → 應走 @on-error 路徑

**已知限制**
- /tmp 未做主動清理（依賴容器重啟回收）
- Worker timeout 5 分鐘，超大 PDF 會失敗
- 未做 S3 conflict 檢查（同名直接覆蓋）

**對應使用者需求**
- @trigger → Form
- @step (暫存) → Write Binary File
- @step (Worker 切分) → HTTP Request
- @step (loop 命名上傳) → Split In Batches → Code → S3
- @output → Aggregate → Respond to Form
```
