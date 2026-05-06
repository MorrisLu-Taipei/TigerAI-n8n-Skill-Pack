# SDD：splitMP3-API-Orchestrated

> 🌐 [English](spec.en.md) | **繁體中文**

## 1. Purpose

**Business objective**：把上傳的 MP3 依時間段切分成多個片段（podcast 章節 / 會議錄音 / 演講分段）。

**為何旗艦**：與 splitPDF-orchestrated **同模式不同媒介**，驗證 TigerAI 設計可遷移性。

---

## 2. Trigger & Inputs

**Trigger**：`n8n-nodes-base.formTrigger`

**Input schema**：
| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| Upload MP3 | binary (audio) | ✅ | 任意 MP3 檔 |
| Segments JSON | text | ✅ | `[{"name":"intro","start":"00:00","end":"03:30"}, ...]` |

---

## 3. Business Logic

```
[Form Trigger]
   ↓
[Save Input MP3]
   ↓
[Parse Segments JSON]   → set 節點解析 JSON
   ↓
[Split In Batches]      → batchSize=1
   ↓
[HTTP → FastAPI /split-mp3]   ← Universal Worker 處理 FFmpeg
   ↓
[Aggregate]
```

關鍵：FFmpeg 邏輯**不在 n8n 容器**，避免汙染。Worker 暴露 `/split-mp3` 接受 `{file_path, name, start, end}`。

---

## 4. Outputs

- 每段 MP3 寫入 `/home/node/.n8n-files/splitMP3/output/<name>.mp3`
- Form 回應段數 + 路徑

---

## 5. Errors & Recovery

| 失敗模式 | 處置 |
|---|---|
| Segments JSON 格式錯誤 | Set 節點解析 throw |
| 時間範圍超出 MP3 長度 | Worker 回 400 → workflow 失敗該段，其他段繼續（continueOnFail）|
| FFmpeg unavailable | Worker 啟動失敗，整體 workflow 不工作 |

---

## 6. Test Scenarios

1. **Golden**：60 分鐘 podcast 切 5 段 → 應產 5 個 MP3
2. **Edge**：時間超出 → 該段失敗但不阻擋其他段
3. **Edge**：上傳非 MP3 → form `acceptFileTypes` 應擋下

---

## 7. Deployment Pre-requisites

- 部署 FastAPI Worker container：`worker:8000`，含 `ffmpeg` binary
- Worker endpoint：
  ```
  POST /split-mp3
  body: { file_path, name, start_time, end_time }
  response: { output_path, duration }
  ```
- volume mount：n8n 與 worker 共用 `/home/node/.n8n-files`

---

## 8. 與 splitPDF 的對照

| 維度 | splitPDF | splitMP3 |
|---|---|---|
| Worker 邏輯 | PyMuPDF | FFmpeg |
| 切分依據 | TOC | 使用者提供時間段 |
| 透明度 | batchSize=1 | batchSize=1 |
| 輸出位置 | `/.../splitePDF/output/` | `/.../splitMP3/output/` |
| 設計骨架 | **完全相同** | **完全相同** |

→ 證明 TigerAI 旗艦模式（編排 + Worker）對「邏輯重的批次處理」有可重用的骨架。
