# splitPDF-orchestrated — 部署說明

> 🌐 [English](README.md) | **繁體中文**

## 快速 import

```bash
# 在 n8n 介面：Workflows → Import from File → 選 workflow.json
```

## 部署步驟

### 1. 確認 n8n 容器有共享 volume

```yaml
# docker-compose.yml 片段
services:
  n8n:
    volumes:
      - n8n-files:/home/node/.n8n-files
```

### 2. 安裝 PyMuPDF

如直接在 n8n 容器執行 Python（Code 節點呼叫 `child_process.execSync`）：

```bash
docker exec -it n8n pip install pymupdf
```

或者改採 Universal Worker 模式（**推薦**）：見 `tests/4-pdf-worker-s3/`。

### 3. 確認資料夾權限

```bash
docker exec -it n8n mkdir -p /home/node/.n8n-files/splitePDF/{input,output}
```

### 4. 啟用 workflow

在 n8n UI 點 Active toggle。

## 測試

訪問 form trigger URL（在 workflow 開啟後可從 Form Trigger 節點 webhook URL 複製），上傳 PDF 觀察：
1. UI 上每章節執行可見（loop 透明度）
2. `output/` 資料夾應出現多個 PDF
3. Form 顯示處理章節數

## 已知限制

- 無對 PDF 大小設限 → 大檔可能 OOM
- 無檔名衝突檢查 → 同名章節會覆蓋
- 處理過程中 input 檔不會自動清理

## 擴充建議

- 改成 Universal Worker：把 PyMuPDF 邏輯移到 FastAPI container（見 `tests/4-pdf-worker-s3/workflow.json`）
- 加 file size pre-check
- 加 cleanup workflow（每日清 input/output）
