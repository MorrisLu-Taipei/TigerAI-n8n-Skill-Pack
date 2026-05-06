# 01 — Installation

> 🌐 **English** | [繁體中文](01-INSTALL.md)

## Prerequisites

- [Claude Code](https://claude.com/claude-code) or [Antigravity](https://github.com/google-deepmind/antigravity) (environments that can load Skills)
- A deployed n8n instance (version ≥ 1.0) accessible via REST API
- **No n8n-mcp required**: this Pack uses n8n REST API throughout; no MCP dependency

## One-command install (recommended)

### Linux / macOS / WSL

```bash
bash install.sh
```

### Windows PowerShell

```powershell
.\install.ps1
```

## Antigravity Exclusive Install (Fastest)

If you are using **Antigravity (AG)**, you can type the command directly in the chat and let the AI handle everything:

```text
/install-n8n-pack
```

Or just tell the AI:
> "Install this n8n Skill Pack for me."

The script will:
1. Copy `skills/_vendor/*` and `skills/tigerai/*` into your config directory (Claude `~/.claude/skills/` or Antigravity `~/.gemini/antigravity/global_skills/`)
2. Link `cookbook/`, `spec/`, and supporting docs (02/03/04) into the config dir for AI to consult
3. Verify skill description triggers are loaded by Claude

## Manual install

```bash
cp -r skills/_vendor/* ~/.claude/skills/
cp -r skills/tigerai/* ~/.claude/skills/
ls ~/.claude/skills/
```

## Environment Variables Setup

This project uses a `.env` file to manage connection information. Please create a `.env` file in the root directory and fill in:

```bash
N8N_API_URL="http://localhost:5678"
N8N_API_KEY="your-n8n-api-key"
```

> [!TIP]
> If you are running n8n in Docker, ensure `N8N_API_URL` is accessible from your host.

## n8n Configuration

To allow the AI to call the n8n API for reading and writing workflows:

1. Create an API Key in n8n: Settings → API → Create
2. (Optional) Manually set environment variables:
   ```bash
   export N8N_API_URL="https://your-n8n.example.com"
   export N8N_API_KEY="<api-key>"
   ```
3. Enable n8n-mcp in Claude Code / Antigravity

   ```bash
   curl -H "X-N8N-API-KEY: $N8N_API_KEY" "$N8N_API_URL/api/v1/workflows?limit=1"
   ```


## Verify

In a Claude Code or Antigravity conversation, type:

> I want to build a workflow that takes a GitHub event webhook and notifies Slack.

If installed correctly, the assistant will:
- Reference `cookbook/01-webhook-to-slack.en.md`
- Produce a three-layer workflow JSON via `sticky-note-to-workflow` Skill
- PUT the JSON into your n8n via `n8n-api-bridge` Skill (requires env vars set)

## Uninstall

```bash
rm -rf ~/.claude/skills/n8n-*
rm -rf ~/.claude/skills/tigerai-*
rm -rf ~/.claude/skills/sticky-note-*
```

## Next: [02-USAGE-MODES.en.md](02-USAGE-MODES.en.md)
