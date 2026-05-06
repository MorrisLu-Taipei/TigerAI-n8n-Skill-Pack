# 安裝說明

> 🌐 [English](01-INSTALL.en.md) | **繁體中文**

## 前提

- 已安裝 [Claude Code](https://claude.com/claude-code) 或 [Antigravity](https://github.com/google-deepmind/antigravity) 等可載入 Skill 的環境
- 已部署 n8n 實例（version ≥ 1.0）
- （建議）已安裝 [n8n-mcp](https://github.com/czlonkowski/n8n-mcp) MCP server

## 一鍵安裝（推薦）

### Linux / macOS / WSL
```bash
bash install.sh
```

### Windows PowerShell
```powershell
.\install.ps1
```

## Antigravity 專屬安裝（極速）

如果你使用的是 **Antigravity (AG)**，可以直接在對話框輸入指令，讓 AI 自動幫你跑完所有流程：

```text
/install-n8n-pack
```

或者直接對 AI 說：
> 「幫我安裝這個 n8n Skill Pack」

腳本會：
1. 把 `skills/_vendor/*` 與 `skills/tigerai/*` 拷貝至你的設定目錄（Claude `~/.claude/skills/` 或 Antigravity `~/.gemini/antigravity/global_skills/`）
2. 把 `cookbook/`、`spec/` 連結至設定目錄供 AI 隨時查閱
3. 驗證 skill description 觸發詞已被 Claude 載入

## 手動安裝

```bash
# 拷貝 skills
cp -r skills/_vendor/* ~/.claude/skills/
cp -r skills/tigerai/* ~/.claude/skills/

# 驗證
ls ~/.claude/skills/
```

## 環境變數設定

本專案使用 `.env` 檔案管理連線資訊。請在根目錄建立 `.env` 並填入：

```bash
N8N_API_URL="http://localhost:5678"
N8N_API_KEY="你的-n8n-api-key"
```

> [!TIP]
> 如果你是在 Docker 中執行 n8n，請確保 `N8N_API_URL` 在主機端可被存取。

## n8n 端設定

讓 AI 能呼叫 n8n API 讀寫 workflow：

1. 在 n8n 建立 API Key：Settings → API → Create
2. （選擇性）手動設定環境變數：
   ```bash
   export N8N_API_URL="https://your-n8n.example.com"
   export N8N_API_KEY="<api-key>"
   ```
3. 在 Claude Code / Antigravity 啟用 n8n-mcp

## 驗證

在 Claude Code 或 Antigravity 對話中輸入：
> 我要建一個 webhook 收 GitHub event 然後通知 Slack 的 workflow

如果安裝成功，Claude 會：
- 載入 `n8n-mcp-tools-expert` skill
- 引用 `cookbook/01-webhook-to-slack.md`
- 產出符合三層結構的 workflow

## 解除安裝

```bash
rm -rf ~/.claude/skills/n8n-*
rm -rf ~/.claude/skills/tigerai-*
rm -rf ~/.claude/skills/sticky-note-*
```
