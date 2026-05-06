# Test Q1 自評（問答模式 end-to-end）

| 檢查項 | 結果 |
|---|---|
| 5 階段提問完整 | ✅ |
| 每階段最多 1–2 題 | ✅ 全程符合 |
| AI 用 A/B/C/D 選項降低打字 | ✅ |
| 中途複述需求 | ✅ 第 3 階段「列成清單」AI 主動翻譯為技術語意 |
| 結束前出 Layer 1 草稿請確認 | ✅ |
| 接力 sticky-note-to-workflow 自動化 | ✅ |
| 產出 JSON 可解析 | ✅ |
| 三層結構 + 對應追溯 | ✅ Layer 3 列出 5 階段對應 |
| 主動加 IF 防無人寄空信 | ✅ AI 自行加值（使用者沒寫但合理） |
| 主動加 Error Trigger workflow 建議 | ✅ Layer 3 已標註 |

## Skill 表現觀察

### qa-mode Skill 做對的事
- 嚴格控制每階段提問題數（不轟炸）
- 用「補習班老闆」聽得懂的語言（沒講 webhook、cron、credentials）
- 「列成清單」這種模糊需求 AI 主動翻譯並請確認，不腦補
- 階段 5 提供 D = 「不確定用預設」選項，照顧不懂技術的使用者
- 結束前出**草稿讓使用者最後確認**，避免直接產 JSON 翻車

### sticky-note-to-workflow 做對的事
- 從 9 個節點精準推斷（filter / aggregate / set / if / gmail）
- IF length>0 是使用者沒明示但 AI 主動加的「合理性增值」
- Layer 3 對應「問答模式 5 階段」做了反向追溯 → 使用者好驗收
- retry 對應 @on-error 用 `retryOnFail + maxTries` 而非另建 workflow（小白路線正確）

## 發現的 spec 缺口

1. **`@input` 含「子欄位列表」的縮排語法在 DSL 沒明文** — Q1 用了 `- A: 姓名 (string)` 縮排寫法，AI 解析正確但 spec 應補。
2. **「中文欄位 header」的 expression gotcha** (`$json['姓名']` vs `$json.姓名`) — 至少在實作 AI 該知道，但 spec 未提。
3. **問答模式階段 3「循環提問」的退出條件** — Skill 寫「直到使用者說沒了」但沒寫上限（萬一使用者列 50 步？）。建議補：「達 7 步主動建議拆 sub-workflow」。

## 結論
✅ **通過**。問答模式 + 接力產出鏈路完整。對「完全不懂技術」的使用者體驗友好。
