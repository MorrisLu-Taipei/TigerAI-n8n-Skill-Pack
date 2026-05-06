# Test Q2 自評（範例查詢模式 end-to-end）

| 檢查項 | 結果 |
|---|---|
| 解析使用者模糊需求關鍵字 | ✅ `訂單` / `通知` / `LINE` |
| 主動點出「LINE 無原生節點」 | ✅ 早期警告，避免使用者誤解 |
| 找出 3 個範例（cookbook + reference）| ✅ 1 cookbook + 2 真實語料 |
| 每範例含「對比 + 直接用/要改」建議 | ✅ |
| 結尾 4 選項（A/B/C/D）| ✅ |
| 使用者選 A 後接力產 Layer 1 草稿 | ✅ |
| 草稿含使用者「自家訂單不是 WooCommerce」修正 | ✅ AI 主動調整 |
| 接力 sticky-note-to-workflow 產 JSON | ✅ |
| JSON 解析通過 | ✅ |
| Layer 3 標出 LINE Notify 2026 停用警告 | ✅ AI 主動加值（spec 沒規定但合理） |

## Skill 表現觀察

### example-finder Skill 做對的事
- **早期警告**：第一句就說「LINE 無原生節點」，避免使用者期望落空
- 用「結構價值」評估範例（範例 1 主題不同但結構同 → 反而最相近）
- 範例 2、3 結構重複時主動提示「二選一即可」（不浪費使用者時間）
- 把語料的 file path 直接給連結，方便使用者去看原檔
- 結尾用「直接用？要改？」的 friction-low 提問

### sticky-note-to-workflow 做對的事
- LINE Notify 沒節點 → 用 `httpRequest` + `httpHeaderAuth` credential（DSL §6.2 降級對應）
- form-urlencoded body 寫對（LINE Notify API 規格）
- Layer 3 主動加「LINE Notify 2026 停用」警告 → 真正的「對使用者好」
- 標出「webhook 沒驗 secret」資安風險

## 發現的 spec 缺口

1. **example-finder Skill 沒明文規定「結構價值評估」** — Q2 中 AI 主動把 cookbook 01（GitHub 主題）排第一，是因為「結構同」勝過「主題同」。Skill 該補一條：「找範例時優先看骨架而非主題」。
2. **「研究新節點/API 的時效性警告」沒在任何 Skill 文件化** — LINE Notify 停用是 2025 年宣布的事；AI 該知道並警告。建議在 `enterprise-patterns` Skill §4 加「時效性警告」項。
3. **沒有 reference-workflows 索引中的標題語意搜尋** — 目前是檔名搜尋，靠人工挑。Phase 4 建議建語意 embedding 索引。

## 結論
✅ **通過**。範例查詢模式對「不知道怎麼描述需求」的使用者很有效。LINE Notify 主動警告體現了 AI 增值。
