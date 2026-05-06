# splitMP3-API-Orchestrated — 部署說明

> 🌐 [English](README.md) | **繁體中文**

## 部署步驟

### 1. 部署 FastAPI Worker

範例 Worker（精簡版）：

```python
# worker/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import subprocess

app = FastAPI()

class SplitReq(BaseModel):
    file_path: str
    name: str
    start_time: str
    end_time: str

@app.post("/split-mp3")
def split_mp3(req: SplitReq):
    out = f"/home/node/.n8n-files/splitMP3/output/{req.name}.mp3"
    subprocess.run([
        "ffmpeg", "-i", req.file_path,
        "-ss", req.start_time, "-to", req.end_time,
        "-c", "copy", out, "-y"
    ], check=True)
    return {"output_path": out}
```

```dockerfile
# worker/Dockerfile
FROM python:3.12-slim
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
RUN pip install fastapi uvicorn
COPY main.py /app/main.py
WORKDIR /app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. docker-compose

```yaml
services:
  n8n:
    # ...
    volumes:
      - n8n-files:/home/node/.n8n-files
    networks:
      - tigerai

  worker:
    build: ./worker
    volumes:
      - n8n-files:/home/node/.n8n-files
    networks:
      - tigerai
```

### 3. Import workflow.json 到 n8n

啟用後即可使用。

## 測試

```bash
# 用 curl 上傳 + 帶 segments JSON
curl -F "file=@meeting.mp3" \
     -F 'segments=[{"name":"intro","start":"00:00","end":"03:30"},{"name":"main","start":"03:30","end":"45:00"}]' \
     <form-trigger-url>
```

## 已知限制

- Worker 沒做 input 安全檢查（path traversal 風險）→ 生產用需加白名單
- 不支援 stream（必須整檔下載完才處理）
- segments 重疊不檢查 → 重疊段會切兩次
