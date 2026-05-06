# TigerAI Flagship Examples — 旗艦範例索引

> 🌐 [English](INDEX.en.md) | **繁體中文**

> 從 TigerAI 內部 workflow 庫精選 3 個體現四大支柱的實戰 workflow，配 SDD 文件與重現步驟。
> （與 MCP 無關；命名 `n8n-mcp-json` 只是上游資料夾的歷史名稱）
> 與 `cookbook/`（教學用）不同：本目錄是**實戰級範例**，含 credential 模板、Worker 部署需求、SDD spec。

---

## 範例

| # | 範例 | 體現支柱 | 節點數 | 適用情境 |
|---|---|---|---|---|
| 1 | [splitPDF-orchestrated](splitPDF-orchestrated/) | 1 原子化 + 2 Universal Worker | 6 | PDF 章節切分、合約處理 |
| 2 | [splitMP3-API-Orchestrated](splitMP3-API-Orchestrated/) | 1 + 2（不同媒介驗證模式可遷移）| 6 | 音訊片段切分、會議錄音處理 |
| 3 | [openwebui-bridge-v2](openwebui-bridge-v2/) | 3 Skill-Driven + 4 安全 | 5 | OpenWebUI ↔ n8n 系統整合 |

---

## 共通結構

每個旗艦範例目錄包含：

```text
<example-name>/
├── workflow.json     # 可直接 import n8n
├── spec.md           # SDD 規格文件（依 enterprise-patterns Skill §3 模板）
└── README.md         # 部署步驟、credential 設定、測試 case
```

---

## 學習順序建議

1. 先看 `splitPDF-orchestrated`：理解「原子化 + Universal Worker」的核心
2. 再看 `splitMP3-API-Orchestrated`：驗證「同模式可換媒介」
3. 最後看 `openwebui-bridge-v2`：理解 Skill Pack 如何被 OpenWebUI 串接

---

## 與 cookbook 的差異

| 維度 | cookbook | flagship |
|---|---|---|
| 目的 | 教使用者寫 sticky note | 給工程師參考實戰部署 |
| 內容 | Layer 1 + 預期 Layer 2 / 3 描述 | 完整 workflow.json + SDD + README |
| credential | 描述用途 | 列出所有需求 + 設定步驟 |
| 外部依賴 | 文字提及 | 明列 Worker 容器、API key 取得 |
| 可直接用 | 改寫後可用 | 設好 credential 即可跑 |
