# splitPDF-orchestrated — Deployment

> 🌐 **English** | [繁體中文](README.md)

## Quick import

```bash
# In n8n UI: Workflows → Import from File → choose workflow.json
```

## Deployment steps

### 1. Confirm n8n container has shared volume

```yaml
# docker-compose.yml snippet
services:
  n8n:
    volumes:
      - n8n-files:/home/node/.n8n-files
```

### 2. Install PyMuPDF

If running Python directly inside n8n container (Code node uses `child_process.execSync`):

```bash
docker exec -it n8n pip install pymupdf
```

Or use the Universal Worker variant (**recommended**): see `tests/4-pdf-worker-s3/`.

### 3. Set folder permissions

```bash
docker exec -it n8n mkdir -p /home/node/.n8n-files/splitePDF/{input,output}
```

### 4. Activate the workflow

Click Active toggle in n8n UI.

## Test

Visit the form trigger URL (copy from Form Trigger node webhook URL after activation), upload a PDF, watch:
1. Each chapter visible on UI (loop transparency)
2. `output/` folder gets multiple PDFs
3. Form shows processed chapter count

## Known limits

- No file size limit → large files may OOM
- No filename collision check → same chapter names overwrite
- Input file not auto-cleaned mid-processing

## Extension ideas

- Move to Universal Worker: PyMuPDF logic into FastAPI container (see `tests/4-pdf-worker-s3/workflow.json`)
- Add file size pre-check
- Add cleanup workflow (daily clean input/output)
