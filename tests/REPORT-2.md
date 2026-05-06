# 第二輪驗收報告：對話模式 + DSL v1.1

> 🌐 [English](REPORT-2.en.md) | **繁體中文**

> 驗收方法：dogfood `tigerai-qa-mode` / `tigerai-example-finder` / `sticky-note-to-workflow` 三個自製 Skill 的 end-to-end 流程，包含對話腳本與最終 workflow 產出。
> 通過標準：(1) 對話自然且有效率 (2) 接力鏈完整 (3) 產 JSON 可解析 (4) DSL v1.1 強化點（`@branch`、強制 fallback）真能落地。

---

## 1. 結果總覽

| # | 情境 | Skill | 對話階段 | 節點數 | JSON | 結論 |
|---|---|---|---|---|---|---|
| Q1 | 補習班繳費提醒（不熟使用者）| qa-mode → sticky-note-to-workflow | 5 | 9 | ✅ | ✅ 通過 |
| Q2 | 訂單通知 LINE（模糊需求）| example-finder → sticky-note-to-workflow | 範例 3 個 + 接力 | 4 | ✅ | ✅ 通過 |
| Q3 | DSL v1.1 `@branch` 重跑 Test 5 | sticky-note-to-workflow | 直接 | 16 | ✅ | ✅ 通過 |

**3/3 通過。** 連同第一輪 5 情境，**累計 8/8 通過**。

---

## 2. 三 Skill 的端到端表現

### `tigerai-qa-mode`（Q1 驗證）
**設計達成**：
- 5 階段嚴格控制提問題數（每階段 1–2 題）
- 用使用者語言（不講 webhook/cron）
- 模糊回答主動翻譯並請確認（「列成清單」→「彙總成單一訊息」）
- 結束前出 Layer 1 草稿等使用者最後確認
- 接力 sticky-note-to-workflow 自動化

**實踐增值**：
- 主動加 IF 防無人寄空信（使用者沒寫但合理）
- Layer 3 對應「問答 5 階段」做反向追溯，使用者好驗收

### `tigerai-example-finder`（Q2 驗證）
**設計達成**：
- 解析模糊關鍵字 → 找 cookbook + reference-workflows
- 結尾 4 選項（A/B/C/D）友善決策
- 範例對比含「直接用？要改？」建議

**實踐增值**：
- **早期警告**：第一句指出「LINE 無原生節點」
- 結構價值評估（cookbook 01 主題不同但結構同 → 排第一）
- LINE Notify 2026 停用警告（時效性增值）

### `sticky-note-to-workflow`（Q1/Q2/Q3 全程驅動）
**設計達成**：
- 七步流程嚴格執行（解析 → 選骨架 → 解節點 → 產 nodes → 產 connections → 寫 Layer 3 → 驗證）
- 三層結構 100% 合規
- 跨節點變數引用 100% 正確（Q3 用 `$('Webhook').item.json.body`）
- 結構性節點自動加（Q1 IF length>0、Q3 fallback noOp + Set unknown）
- DSL §6.2 降級對應正確套用（Q2 的 LINE 節點 → httpRequest）

---

## 3. DSL v1.1 強化點驗證（Q3 重點）

| v1.1 強化 | 是否落地 | 證據 |
|---|---|---|
| `@branch` 嚴格分流語法 | ✅ | Q3 Layer 1 用 3 個 `@branch` 取代自然語言 |
| Switch 強制 fallback | ✅ | Q3 使用者未寫 fallback，AI 自動補 noOp + Set unknown |
| `@on-error` 兩種模式區分 | ✅ | Q1 用模式 A (retryOnFail)；Q3 標註模式 B (Error Trigger) |
| Telegram trigger 字典擴充 | ✅ | Test 3（v0.4.0 已驗）+ Q1 不需此項 |
| 跨節點 `$('Node')` gotcha | ✅ | Q3 Layer 3 主動引用 DSL §6.1 |
| 降級對應規則 | ✅ | Q2 LINE Notify → httpRequest，Layer 3 註明來源 |
| 節點數放寬（分流 25）| ✅ | Q3 16 節點未觸發拆分建議 |
| `@assume` cookbook 範例 | ✅ | Q1/Q2/Q3 全用 |

**8/8 v0.5.0 強化點全部落地。**

---

## 4. 仍未解的細節（v0.6.0 候選）

### Critical
- 無

### Major
1. **`@input` 子欄位縮排語法** — Q1 用 `- A: 姓名 (string)` 縮排清單，AI 解析正確但 spec 未明示。
   → 修法：DSL §2.2 補一條「`@input` 多欄位用 YAML-style 縮排清單」。
2. **問答模式階段 3 提問上限** — Skill 沒寫「達 7 步主動建議拆 sub-workflow」。
   → 修法：`tigerai-qa-mode/SKILL.md` §2 階段 3 補上限規則。
3. **example-finder「結構價值優先於主題」未明文** — Q2 中 AI 主動把主題不同但結構同的 cookbook 01 排第一。
   → 修法：`tigerai-example-finder/SKILL.md` §3.3 排序規則補一條。

### Minor
4. **`@branch` 跨路徑共用變數**（如所有路皆寫 audit log）需手動重複。
   → 增強：v1.2 考慮加 `@before-branch` / `@after-branch` 標籤。
5. **時效性警告**（如 LINE Notify 2026 停用）沒系統性收錄處。
   → 修法：`tigerai-enterprise-patterns/SKILL.md` §4 加「時效性警告」項。
6. **中文欄位 header 的 expression gotcha**（`$json['姓名']` vs `$json.姓名`）。
   → 修法：DSL §6.1 補一條。
7. **語意搜尋索引**：reference-workflows 目前只能檔名 grep，無法語意比對。
   → 增強：Phase 4 候選——建 embedding 索引。

---

## 5. 累計驗收統計（兩輪合併）

| 維度 | 第一輪 | 第二輪 | 合計 |
|---|---|---|---|
| 情境數 | 5 | 3 | **8** |
| JSON 解析通過率 | 5/5 | 3/3 | **8/8 (100%)** |
| 揭露 spec 缺口 | 9 條 | 7 條 | 16 條 |
| 已修補 | 9 條 (v0.5.0) | 0 條 | 9/16 |
| 待修 | 0 條 | 7 條 | 7/16 |

---

## 6. Pack 客戶可用性結論（更新）

| 客戶類型 | 可用性 | 變化 |
|---|---|---|
| n8n 老手 | ⭐⭐⭐⭐⭐ | 同 v0.4.0 |
| n8n 新手（走問答模式） | **⭐⭐⭐⭐⭐** | ↑ 從 4 顆星升 5 顆（Skill 已實作 + Q1 驗證） |
| 走 OpenWebUI 整合 | ⭐⭐⭐ | 同（待 integrations/openwebui/） |
| 純 API 自動化 | ⭐⭐⭐⭐⭐ | ↑ 從 4 顆星升 5 顆（n8n-api-bridge Skill 已實作） |
| 對複雜分流的需求 | **⭐⭐⭐⭐⭐** | NEW（Q3 證明 v1.1 足夠處理）|

---

## 7. 下一步建議優先序

1. **修 7 條 minor/major 缺口**（兩小時）→ 出 v0.6.0
2. **整合 OpenWebUI**（spike，半天）
3. **產旗艦範例 examples/tigerai-flagship/**（一天）
4. **客戶 beta 試用**（壓 zip，發給 1–2 位驗證 install）
5. **第三輪驗收**：找真實 n8n 實例跑 Q1 / Q2 的 workflow JSON 驗證可運行（不只解析）

---

**報告版本**：v1.0
**驗收日期**：2026-05-05
**驗收人**：Claude (dogfooding TigerAI Skill Pack v0.5.0)
