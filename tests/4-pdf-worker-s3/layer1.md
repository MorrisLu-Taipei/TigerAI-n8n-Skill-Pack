# Layer 1

```markdown
## 需求：合約 PDF 章節切分上傳 S3

@flow: 上傳 PDF → 呼叫 Worker 切章節 → 逐章節上傳 S3
@trigger: form
@form-fields:
  - file: "上傳合約 PDF" (file, required)
  - prefix: "命名前綴" (text, default: "contract")
@step: 存暫存到 /tmp/{execution_id}/input.pdf
@step: 呼叫 FastAPI Worker POST http://worker:8000/split-pdf
@step: 對每個章節 (loop, 透明度):
  - 命名 = "{prefix}_{seq:03d}_{title}.pdf"
  - 上傳 S3 bucket: legal-contracts, key: pdfs/{命名}
@output: form 顯示處理章節數與 S3 keys
@on-error: 清理 /tmp，回傳錯誤訊息
@assume: Worker 與 n8n 共用 /tmp volume mount
```
