# Vendor Skills 來源

本目錄下的 6 個 Skill 來自 **n8n-skills** 開源專案：

- Repo: https://github.com/czlonkowski/n8n-skills
- 作者：Romuald Członkowski（aiadvisors.pl）
- 授權：MIT（見 `LICENSE`）

## 已收錄的 Skill（6 個）

- `n8n-expression-syntax`
- `n8n-workflow-patterns`
- `n8n-validation-expert`
- `n8n-node-configuration`
- `n8n-code-javascript`
- `n8n-code-python`

## 已移除的 Skill（v0.16.0）

- ❌ `n8n-mcp-tools-expert` — TigerAI Skill Pack 不依賴 MCP，全程用 n8n REST API（見 `skills/tigerai/n8n-api-bridge/`）。此 Skill 與 MCP server 強綁定，不適用本 Pack 設計。

## 維運規則

- ❌ **不修改** vendor skill 內容（保持與上游同步能力）
- ✅ 如需擴充行為，建立新 Skill 在 `skills/tigerai/`
- ✅ 上游更新時，整資料夾覆蓋即可（記錄在 `CHANGELOG.md`）
- ✅ 同步時**不要** 拷回 `n8n-mcp-tools-expert`（v0.16.0 起明確排除）

## 同步步驟

1. `git clone https://github.com/czlonkowski/n8n-skills.git /tmp/upstream`
2. `rm -rf skills/_vendor/n8n-*`（清舊；此時若有 mcp-tools-expert 殘留也會清掉）
3. 拷貝**除 mcp-tools-expert 外**的 Skill：

   ```bash
   for d in /tmp/upstream/skills/*/; do
     name=$(basename "$d")
     [ "$name" = "n8n-mcp-tools-expert" ] && continue
     cp -r "$d" skills/_vendor/
   done
   ```

4. 更新 `CHANGELOG.md` 標註 vendor 版本
