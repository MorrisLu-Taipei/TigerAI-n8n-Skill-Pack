#!/usr/bin/env bash
# TigerAI n8n Skill Pack 一鍵安裝（Linux / macOS / WSL / Git Bash）
# 用法: bash install.sh

set -euo pipefail

PACK_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_TARGET="${CLAUDE_HOME:-$HOME/.claude}/skills"
ANTIGRAVITY_TARGET="$HOME/.gemini/antigravity/global_skills"

TARGETS=()
[ -d "$(dirname "$CLAUDE_TARGET")" ] && TARGETS+=("$CLAUDE_TARGET")
[ -d "$(dirname "$ANTIGRAVITY_TARGET")" ] && TARGETS+=("$ANTIGRAVITY_TARGET")

# Default to Claude if none found
if [ ${#TARGETS[@]} -eq 0 ]; then
  TARGETS+=("$CLAUDE_TARGET")
fi

echo "📦 TigerAI n8n Skill Pack — Installer"
echo "   Source: $PACK_DIR"
for T in "${TARGETS[@]}"; do
  echo "   Target: $T"
done
echo ""

for TARGET in "${TARGETS[@]}"; do
  echo "🚀 Installing to: $TARGET"
  mkdir -p "$TARGET"

  # 1. 拷貝 vendor skills
  echo "→ 安裝 7 個官方 vendor skills..."
  for d in "$PACK_DIR/skills/_vendor"/n8n-*; do
    [ -d "$d" ] || continue
    name="$(basename "$d")"
    rm -rf "$TARGET/$name"
    cp -r "$d" "$TARGET/$name"
    echo "   ✓ $name"
  done

  # 2. 拷貝 tigerai skills
  echo "→ 安裝 TigerAI 自製 skills..."
  for d in "$PACK_DIR/skills/tigerai"/*/; do
    [ -d "$d" ] || continue
    name="$(basename "$d")"
    rm -rf "$TARGET/$name"
    cp -r "$d" "$TARGET/$name"
    echo "   ✓ $name"
  done

  # 3. Symlink spec / cookbook / research 至 skills 共用目錄
  SHARED="$TARGET/_tigerai-pack-shared"
  rm -rf "$SHARED"
  mkdir -p "$SHARED"
  for sub in spec cookbook research 02-USAGE-MODES.md 03-FIRST-WORKFLOW.md 04-FAQ.md; do
    if [ -e "$PACK_DIR/$sub" ]; then
      cp -r "$PACK_DIR/$sub" "$SHARED/"
      echo "   ✓ shared/$sub"
    fi
  done
  echo ""
done

# 4. 驗證
echo "✅ 安裝完成。已安裝於以下路徑："
for T in "${TARGETS[@]}"; do
  echo "   - $T"
done

echo ""
echo "下一步："
echo "  1. 設定 n8n 連線環境變數："
echo "       export N8N_API_URL=https://your-n8n.example.com"
echo "       export N8N_API_KEY=<your-api-key>"
echo "  2. 在 Claude Code 或 Antigravity 中試問：「我要建一個 webhook 收 GitHub event 通知 Slack」"
echo "  3. 詳細用法見 $PACK_DIR/README.md（會引導你看後續 01–04 文件）"
