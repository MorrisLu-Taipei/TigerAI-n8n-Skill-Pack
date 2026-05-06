# splitMP3-API-Orchestrated — Deployment

> 🌐 **English** | [繁體中文](README.md)

## Deployment steps

### 1. Deploy FastAPI Worker

Sample Worker (minimal):

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

### 3. Import workflow.json into n8n

Activate after import.

## Test

```bash
curl -F "file=@meeting.mp3" \
     -F 'segments=[{"name":"intro","start":"00:00","end":"03:30"},{"name":"main","start":"03:30","end":"45:00"}]' \
     <form-trigger-url>
```

## Known limits

- Worker has no input safety (path traversal risk) → production needs whitelist
- No streaming (must download full file before processing)
- Segment overlap not checked → overlapping segments split twice
