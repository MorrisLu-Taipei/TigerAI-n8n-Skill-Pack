# Workflow Pattern 歸納（Phase 1）

> 🌐 [English](patterns.en.md) | **繁體中文**

> 從 2,061 個 workflow 的 node 共現 + 統計推導出的高頻模式。
> 這些是 AI 產出 workflow 時應**優先套用**的骨架。

---

## 1. 共現 Top 10（哪些節點常一起出現）

| 節點對 | 出現次數 | 暗示的模式 |
|---|---|---|
| `httpRequest` + `set` | **592** | 拉 API 後整形資料 |
| `noOp` + `set` | 585 | 分支收斂並設欄位 |
| `manualTrigger` + `stopAndError` | 507 | 手動 demo 含驗證 |
| `manualTrigger` + `set` | 464 | demo 設參數 |
| `if` + `set` | 453 | 條件判斷後修改資料 |
| `httpRequest` + `noOp` | 439 | API 呼叫後分支 |
| `set` + `stopAndError` | 432 | 設值後驗證 |
| `httpRequest` + `manualTrigger` | 425 | 手動測 API |
| `manualTrigger` + `noOp` | 389 | demo 占位 |
| `noOp` + `stopAndError` | 388 | 分支 + 拋錯 |

### 真正有意義的「業務模式」共現

排除 `manualTrigger` / `noOp` 等模板/結構性節點後：

| 節點對 | 模式名 |
|---|---|
| `httpRequest` + `set` | **API 整形** |
| `if` + `set` | **條件分支整形** |
| `code` + `httpRequest` | **API + 客製邏輯** |
| `merge` + `set` | **合併後整形** |
| `set` + `splitOut` | **陣列拆單** |
| `httpRequest` + `splitOut` | **API 回陣列拆單** |
| `scheduleTrigger` + `set` + `httpRequest` | **定時抓 API**（cookbook 02 模式）|
| `googleSheets` + `set` | **寫入 Sheet** |
| `httpRequest` + `merge` | **多 API 合流**（cookbook 07 模式）|
| `set` + `switch` | **依欄位分流**（cookbook 04 模式）|

---

## 2. 從共現歸納的 7 大標準骨架

### Pattern A：Webhook 即時處理（cookbook 01 / 04）
```
webhook → [validate (if)] → [transform (set/code)] → action(s) → respondToWebhook
```
出現於：313 個 webhook workflow 中約 60%

### Pattern B：定時資料同步（cookbook 02 / 07）
```
scheduleTrigger → httpRequest (×N 平行) → merge → transform → output (sheets/db/email)
```
出現於：311 個 schedule workflow 中約 50%

### Pattern C：表單入庫（cookbook 03）
```
formTrigger → if(validate) → [postgres/airtable/sheets insert] → respondToWebhook
```
含 formTrigger 的 114 個中約 40% 走此模式

### Pattern D：批次處理（cookbook 08）
```
[trigger] → [fetch list] → splitInBatches → (loop body) → aggregate → output
```
splitInBatches (224) + aggregate (173) 高度共現

### Pattern E：條件分流（cookbook 04）
```
[trigger] → [classify (code/openAi)] → switch → 多分支 → noOp(收斂) → output
```
switch (234) 通常與 set + noOp 配對

### Pattern F：sub-workflow 編排（TigerAI 原子化模式 / cookbook 05）
```
[main] → executeWorkflow → [worker workflow]
                       ↓
                       splitInBatches loop
```
executeWorkflowTrigger (180) 顯示企業已開始拆 workflow

### Pattern G：重試與錯誤通報（cookbook 06）
```
[main] httpRequest (retry config) → success → output
                                   ↓ fail
                                   slack/gmail
+ errorTrigger workflow（全域）
```
**警訊**：errorTrigger 僅 18 個 workflow 使用（<1%）→ 多數人不會用全域錯誤處理。AI 應主動引導。

---

## 3. 反模式（語料中常見但 AI 應避免）

### 反模式 1：濫用 manualTrigger 上線
- 927 個 workflow 用 manualTrigger（45%）
- demo 合理，但生產環境應改 webhook / schedule
- **AI 規則**：產生生產 workflow 時禁用 manualTrigger（除非使用者明示 `@trigger: manual`）

### 反模式 2：缺錯誤處理
- 88% workflow 沒有任何錯誤處理機制
- **AI 規則**：對任何含 httpRequest 的 workflow，必須在 Layer 3「已知限制」標註
- **AI 規則**：使用者沒寫 `@on-error` 時，主動建議加上

### 反模式 3：用舊節點
- `cron` (108) / `function` (125) 仍出現
- **AI 規則**：產出時一律新節點（`scheduleTrigger` / `code`）

### 反模式 4：超大 workflow 不拆分
- 216 個 xlarge workflow（31+ 節點）
- 維護困難
- **AI 規則**：產出 > 15 節點時主動建議拆 sub-workflow（用 `executeWorkflowTrigger`）

---

## 4. 與 Cookbook 8 範例的對映

| Cookbook | Pattern | 語料支撐 |
|---|---|---|
| 01 webhook→slack | A | 313 webhook + 140 slack |
| 02 schedule→email | B | 311 schedule + 168 gmail |
| 03 form→DB | C | 114 form + airtable/postgres |
| 04 AI 分流 | E | 234 switch（含 AI agent 高頻使用） |
| 05 檔案 pipeline | F + 自製 worker | executeWorkflow 180 + httpRequest 895 |
| 06 retry/錯誤 | G | 251 有錯誤處理（含 18 errorTrigger） |
| 07 多源合併 | B（變體） | 340 merge |
| 08 批次處理 | D | 224 splitInBatches + 173 aggregate |

✅ **8 個 cookbook 完整覆蓋了 7 大標準骨架**。

---

## 5. AI 產出 workflow 的決策流程（總結）

```text
1. 解析 Layer 1 DSL → 確定 trigger
2. 比對 7 大 Pattern → 選最近骨架
3. 套節點對應表（node-frequency.md §4 + dsl §4）
4. 必加結構性節點：
   - if 後接 noOp 收斂
   - splitInBatches 後接 aggregate
   - webhook trigger 配 respondToWebhook
   - switch 沒明示 fallback 時必加 fallback (NaN/null/otherwise) 並走 noOp
   - 三路以上 switch → 結尾必接 merge (mode=append) 收斂到單一輸出
5. 節點數上限（彈性）：
   - 單線型 workflow ≤ 15 節點 → 超過建議拆 sub-workflow (executeWorkflowTrigger)
   - 分流型 workflow ≤ 25 節點 → 因為每路都有獨立節點，放寬上限
6. 主動加 Layer 3 風險提示：
   - 含 httpRequest → 提醒 retry/timeout
   - 缺 @on-error → 建議補（並依 three-layer.md §6 選 A 或 B 模式）
   - 節點數逼近上限 → 建議拆 sub-workflow
   - LLM 評分/分類 → 提醒非確定性、需校準
   - Switch fallback 缺漏 → AI 自補後在 Layer 3 標註「使用者未明示，預設 noOp」
7. 禁用：manualTrigger（除非明示）/ cron / function
```

---

**Phase 1 完成**。Pattern 與節點知識已結構化，後續 Phase 3 的 `sticky-note-to-workflow` Skill 將以本檔 + `node-frequency.md` + `dsl.md` 為實作基礎。
