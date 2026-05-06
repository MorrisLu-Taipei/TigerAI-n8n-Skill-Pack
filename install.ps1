# TigerAI n8n Skill Pack 一鍵安裝（Windows PowerShell）
# 用法: .\install.ps1

$ErrorActionPreference = 'Stop'

$PackDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ClaudeHome = if ($env:CLAUDE_HOME) { $env:CLAUDE_HOME } else { Join-Path $HOME '.claude' }
$AntigravityHome = Join-Path $HOME '.gemini\antigravity'

$Targets = @()
if (Test-Path $ClaudeHome) { $Targets += Join-Path $ClaudeHome 'skills' }
if (Test-Path $AntigravityHome) { $Targets += Join-Path $AntigravityHome 'global_skills' }

# If neither exists, default to Claude
if ($Targets.Count -eq 0) { $Targets = @(Join-Path $ClaudeHome 'skills') }

Write-Host "📦 TigerAI n8n Skill Pack — Installer" -ForegroundColor Cyan
Write-Host "   Source: $PackDir"
foreach ($T in $Targets) {
  Write-Host "   Target: $T"
}
Write-Host ""

foreach ($Target in $Targets) {
  Write-Host "`n🚀 Installing to: $Target" -ForegroundColor Yellow
  if (-not (Test-Path $Target)) { New-Item -ItemType Directory -Path $Target -Force | Out-Null }

  # 1. Vendor skills
  Write-Host "→ 安裝 7 個官方 vendor skills..."
  Get-ChildItem -Path (Join-Path $PackDir 'skills\_vendor') -Directory -Filter 'n8n-*' | ForEach-Object {
    $dest = Join-Path $Target $_.Name
    if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
    Copy-Item -Path $_.FullName -Destination $dest -Recurse
    Write-Host "   ✓ $($_.Name)"
  }

  # 2. TigerAI skills
  Write-Host "→ 安裝 TigerAI 自製 skills..."
  Get-ChildItem -Path (Join-Path $PackDir 'skills\tigerai') -Directory | ForEach-Object {
    $dest = Join-Path $Target $_.Name
    if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
    Copy-Item -Path $_.FullName -Destination $dest -Recurse
    Write-Host "   ✓ $($_.Name)"
  }

  # 3. Shared spec / cookbook / research
  $Shared = Join-Path $Target '_tigerai-pack-shared'
  if (Test-Path $Shared) { Remove-Item $Shared -Recurse -Force }
  New-Item -ItemType Directory -Path $Shared -Force | Out-Null
  foreach ($sub in @('spec', 'cookbook', 'research', '02-USAGE-MODES.md', '03-FIRST-WORKFLOW.md', '04-FAQ.md')) {
    $src = Join-Path $PackDir $sub
    if (Test-Path $src) {
      Copy-Item -Path $src -Destination $Shared -Recurse
      Write-Host "   ✓ shared/$sub"
    }
  }
}

Write-Host ""
Write-Host "✅ 安裝完成。" -ForegroundColor Green
Write-Host "已安裝於以下路徑："
foreach ($T in $Targets) {
  Write-Host "   - $T"
}

Write-Host ""
Write-Host "下一步："
Write-Host "  1. 設定 n8n 連線環境變數："
Write-Host '       $env:N8N_API_URL = "https://your-n8n.example.com"'
Write-Host '       $env:N8N_API_KEY = "<your-api-key>"'
Write-Host "  2. 在 Claude Code 或 Antigravity 中試問：『我要建一個 webhook 收 GitHub event 通知 Slack』"
Write-Host "  3. 詳細用法見 $PackDir\README.md（會引導你看後續 01–04 文件）"
