# Starter Templates — 起手式

> 🌐 [English](_starter-README.en.md) | **繁體中文**

> 不想在 n8n 手動拖一張黃色便利貼？匯入下面任一個 JSON，就有**現成定位好的 Layer 1 黃色便利貼**等你填字。

---

## 兩種起手式

| 檔案 | 內容 | 適合誰 |
|---|---|---|
| [`_starter-blank.json`](_starter-blank.json) | 一張完全空白的黃色便利貼 | 已知道怎麼描述需求，要最簡 |
| [`_starter-template.json`](_starter-template.json) | 黃色便利貼預載「填空模板」（中英雙語）+ 範例 | 不確定怎麼開始，照模板填 |

---

## 怎麼用

### Step 1：匯入 n8n

```
n8n UI → Workflows → Import from File → 選 _starter-blank.json 或 _starter-template.json
```

或直接拷貝 JSON 內容貼到 Import 對話框。

### Step 2：在便利貼裡填字

打開匯入後的 workflow，會看到一張黃色便利貼已就位（畫布上方）。雙擊它，把你的需求寫進去。

**寫法不限**：
- 純自然語言（中文 / 英文 / 混雜）皆可 — 見 [`STICKY-EXAMPLES-BILINGUAL.md`](STICKY-EXAMPLES-BILINGUAL.md) 8 個範例
- 進階 DSL 語法 — 見 [`../spec/sticky-note-dsl.md`](../spec/sticky-note-dsl.md)

### Step 3：呼叫 AI

對 Claude / ChatGPT 說：

> 「我有一個 n8n workflow（ID: `starter-blank-001` 或 `starter-template-001`），裡面有一張黃色便利貼寫了我的需求。請幫我產出中間 nodes + 下方說明便利貼。」

AI 會：
1. 讀你的便利貼
2. 產出中間節點（Layer 2）
3. 寫下方藍色說明便利貼（Layer 3）
4. 透過 n8n REST API 寫回（如已設好 `N8N_API_URL` / `N8N_API_KEY`）

---

## 兩個 JSON 的差別

### `_starter-blank.json` — 完全空白
便利貼內 `content = ""`。匯入後雙擊，整段都歸你寫。畫布看起來：

```
┌───────────────────────────┐
│                           │  ← 空白黃色便利貼，等你填字
│                           │
└───────────────────────────┘
```

### `_starter-template.json` — 雙語提示模板
便利貼預載 5 段填空（中英並列）+ 自然語言範例。畫布看起來：

```
┌──────────────────────────────────────┐
│ ## 寫你的需求 / Describe your need     │
│                                       │
│ 範例：每天早上 9 點抓銷售資料寄報表... │
│ Example: Every day at 9 AM fetch...   │
│                                       │
│ 什麼時候跑 / When to run: ____        │
│ 要做什麼 / What to do:                │
│   1. ____                             │
│   2. ____                             │
│ 結果送哪 / Where output goes: ____    │
│ 失敗怎辦 / On failure: ____           │
└──────────────────────────────────────┘
```

---

## 後續

匯入並填好需求後，你就走進了 [`02-USAGE-MODES.md`](../02-USAGE-MODES.md) 的「**Cookbook 照抄**」流程。其餘步驟同 [`03-FIRST-WORKFLOW.md`](../03-FIRST-WORKFLOW.md) 的 Step 3 起。
