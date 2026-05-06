# Phase 4 Design Doc：reference-workflows 語意索引

> 🌐 [English](PHASE-4-EMBEDDING-INDEX.en.md) | **繁體中文**

> **狀態**：設計階段，未實作。記錄為 v0.7.0 的 placeholder。
> **優先級**：低（檔名 grep + cookbook 已能滿足 80% 場景）

---

## 1. 動機

當前 `tigerai-example-finder` Skill 在 2,061 個 workflow 中找範例，靠：
1. 檔名解析（`<id>_<Vendor>_<Action>_<Trigger>`）
2. cookbook 8 個精選的 INDEX 文字搜尋
3. 必要時透過 n8n REST API 撈現有 workflow 的 sticky note 內容做關鍵字比對

**痛點**：
- 檔名只有 4 個欄位，無法表達 workflow 內部 sticky note 的語意（很多 workflow 主題其實藏在 sticky note 內）
- 使用者用自然語言描述，例如「客服分流」，靠 grep 抓不到「routing customer feedback」這類英文同義詞
- 跨語言（中英對照）幾乎不可能用文字搜尋達成

---

## 2. 目標

建立每個 workflow 的「語意 embedding 索引」，使 example-finder Skill 能：
- 用自然語言查詢（中英不限）
- 找出語意相近的範例（即使檔名 / sticky note 用詞不同）
- 排序時整合「結構相似」與「主題相似」兩個維度

---

## 3. 設計

### 3.1 索引內容（每 workflow 一筆）

```json
{
  "file": "Telegramtool/1575_Telegramtool_Woocommercetool_Automate_Webhook.json",
  "name": "<wf.name>",
  "description_concat": "<all sticky note content concatenated>",
  "node_types": ["webhook", "set", "telegram", ...],
  "trigger_type": "webhook",
  "size_bucket": "medium",
  "embedding": [0.123, -0.456, ...],   // 1536 dim (Anthropic / OpenAI / 本地)
  "skeleton_hash": "<canonical node-type sequence>"
}
```

### 3.2 Embedding 來源（三選一）

| 方案 | Pros | Cons |
|---|---|---|
| **Anthropic Voyage** (建議) | 多語、品質高、TigerAI 已有 API key | 雲端；需付費 |
| **OpenAI text-embedding-3-small** | 標準、便宜（$0.02/1M tokens） | 雲端；需付費 |
| **本地 sentence-transformers** | 免費、私有 | 多語品質參差、需自部署 |

**估算成本**（OpenAI 路徑）：
- 2,061 workflow × 平均 2,000 tokens = ~4M tokens
- 一次性建索引：~$0.08
- 後續每月增量更新：~$0.01

### 3.3 索引存放

- **Phase 4a**：扁平 JSON `research/embedding-index.json`（~10 MB）
  - 載入記憶體即查詢
  - 用 cosine similarity（數十毫秒）
- **Phase 4b**（選做）：改用 SQLite + `sqlite-vss` 擴充
  - 適合 > 10,000 workflow 規模

### 3.4 example-finder Skill 整合

修改 `tigerai-example-finder/SKILL.md` §3.2 三層搜尋：

```text
1. cookbook（同前，文字 INDEX）
2. flagship（同前）
3. reference-workflows：
   a. 計算使用者描述的 embedding
   b. 對 embedding-index.json 做 top-K cosine similarity
   c. 結合 §3.3 排序公式（骨架 + 主題 + 時效性）
```

---

## 4. 實作步驟（未來執行時參考）

1. **腳本** `research/_build_embeddings.js`：
   - 遍歷 `reference-workflows/` 提取 sticky note + name + node types
   - 呼叫 embedding API 批次處理（每批 100 筆）
   - 輸出 `embedding-index.json`
2. **查詢函式** `research/_search.js`：
   - 載入索引
   - 對 query embedding 取 top-K
3. **整合 SKILL.md**：補充查詢呼叫範例
4. **驗收**：用 Q2 範例查詢的 7 個假想需求重跑，比對召回率

---

## 5. 暫不實作的原因

- 當前 workflow 量（2,061）可用檔名 + cookbook 覆蓋 80% 場景
- example-finder v0.6.0 的「結構價值優先」排序已大幅改善體驗
- 客戶 beta 試用前不需要更精緻的搜尋
- 加入後會增加：API key 管理 / 索引重建排程 / 維運成本

**啟動條件**：
- 客戶實際使用後抱怨「找不到我要的範例」
- workflow 庫成長到 5,000+
- 開始接受多語言（日文 / 韓文 / 西文）需求

---

## 6. 風險與替代方案

- 若 embedding API 短期不可用 → 退回純文字搜尋（無大影響）
- 隱私考量（客戶 reference-workflows 內含敏感資料）→ 改用本地 sentence-transformers
- 索引漂移（新增 workflow 未即時索引）→ 加排程 cron 每小時跑增量

---

**結論**：本設計記錄完成，待客戶驗證前不啟動實作。
