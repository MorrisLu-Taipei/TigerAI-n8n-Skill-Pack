# Test 4：PDF 上傳 → FastAPI Worker → S3

## 情境
法務部上傳合約 PDF，系統按章節切分後上傳 AWS S3。**對應 TigerAI 旗艦原子化模式**。

## 模式
Cookbook 05 + n8n-mcp-json/splitPDF-orchestrated.json 的 hybrid。Universal Worker + Loop 透明度。

## 驗證目標
- TigerAI 「邏輯放 FastAPI、n8n 當編排」設計能否從 DSL 表達
- Form Trigger + 二進位檔處理
- splitInBatches batchSize=1 透明 loop
- HTTP 呼叫外部 worker 的標準寫法
