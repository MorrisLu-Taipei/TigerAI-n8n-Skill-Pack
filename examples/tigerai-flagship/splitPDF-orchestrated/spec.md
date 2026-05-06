# SDD：splitPDF-orchestrated

> 🌐 [English](spec.en.md) | **繁體中文**

## 1. Purpose

**Business objective**：把使用者上傳的 PDF 依目錄章節（TOC）切分成多個獨立 PDF，命名規則由 form 參數控制。

**Stakeholders**：法務 / 出版 / 教育訓練（任何需要章節級操作的單位）。

**為何採旗艦設計**：
- 體現 TigerAI Pillar 1（原子化編排）：每章節獨立節點視覺化
- 體現 Pillar 2（Universal Worker）：PyMuPDF 邏輯放 FastAPI，n8n 純編排
- 是「Workflow as Code」的代表

---

## 2. Trigger & Inputs

**Trigger**：`n8n-nodes-base.formTrigger` v2

**Input schema**：
| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| Upload PDF | binary (file) | ✅ | 任意可被 PyMuPDF 解析的 PDF |
| Naming Rule | text | ❌ | 預設 `{title}`，可改 `{seq}_{title}`（章節編號+標題）|

---

## 3. Business Logic（Step-by-Step）

```
[Form Trigger]
   ↓
[Save Input File]   → 寫入 /home/node/.n8n-files/splitePDF/input/<原檔名>
   ↓
[Get Chapters]      → Code 節點呼叫 PyMuPDF 取得 TOC（chapters[]）
   ↓
[Split In Batches]  → batchSize=1（透明度）
   ↓
[Code Per Chapter]  → 對單章節呼叫 PyMuPDF 切分並寫檔
   ↓
[Aggregate]         → 收集所有章節輸出路徑
   ↓ (回 Loop)
```

詳見 `workflow.json` 與 `splitePDF/` Python script（位於 `n8n-mcp-json/splitePDF/` 上游目錄）。

---

## 4. Outputs

- **檔案**：每章節一個 PDF 寫入 `/home/node/.n8n-files/splitePDF/output/`
- **名稱**：依 form 的 `Naming Rule` 套用
- **回應**：Form 顯示處理章節數

---

## 5. Errors & Recovery

| 失敗模式 | 處置 |
|---|---|
| PDF 無 TOC | Code 節點回空陣列 → 跳過 split，提示使用者 |
| PyMuPDF 無法解析（壞檔）| Code 節點 throw → workflow 失敗 |
| /home/node/.n8n-files 寫入權限不足 | Worker 啟動時即失敗 |

**建議**：
- 配 Error Trigger workflow 統一通報
- 增加 file size limit pre-check（避免 GB 級 PDF 卡住 worker）

---

## 6. Test Scenarios

1. **Golden path**：上傳 10 章節技術手冊 → 應產出 10 個獨立 PDF
2. **Edge — 無 TOC**：上傳掃描版 PDF → 應 graceful 失敗 + 友善訊息
3. **Edge — 大檔**：上傳 200 MB PDF → 觀察 Worker timeout（5 分鐘預設）

---

## 7. Deployment Pre-requisites

- n8n 容器掛載 volume：`/home/node/.n8n-files`（n8n 與 Python script 共用）
- Python 3 環境可訪問 `pymupdf` 套件（`pip install pymupdf`）
- 若採 Universal Worker 變體：另起 FastAPI container 暴露 `/split-pdf`

---

## 8. 與 Skill Pack 的關係

- **三層結構**：本範例為 v1.0 預-三層時代產出，**未含 Layer 1/3 sticky note**。產品化時可加入。
- **適用 Skill**：`tigerai-enterprise-patterns`（必）、`sticky-note-to-workflow`（若要重新生成三層版）
- **DSL 對應**（若改寫成 sticky note 規範）：
  ```
  @trigger: form
  @form-fields:
    - file: "Upload PDF" (file, required)
    - rule: "Naming Rule" (text, default: "{title}")
  @step: 存暫存
  @step: 取 TOC（呼叫 PyMuPDF / Worker）
  @step: 對每章節切分 → 寫檔
  @output: form 顯示處理結果
  @assume: PyMuPDF 可解析輸入 PDF
  ```
