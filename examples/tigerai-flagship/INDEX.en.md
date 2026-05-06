# TigerAI Flagship Examples — Index

> 🌐 **English** | [繁體中文](INDEX.md)

> Three battle-tested workflows from TigerAI's internal workflow library that embody the four pillars, with SDD docs and reproduction steps.
> (Unrelated to MCP; the upstream folder name `n8n-mcp-json` is purely historical.)
> Different from `cookbook/` (educational): these are **production-grade examples** with credential templates, Worker deploy needs, and SDD specs.

---

## Examples

| # | Example | Pillars | Nodes | Best for |
|---|---|---|---|---|
| 1 | [splitPDF-orchestrated](splitPDF-orchestrated/) | 1 Atomic + 2 Universal Worker | 6 | PDF chapter split, contract processing |
| 2 | [splitMP3-API-Orchestrated](splitMP3-API-Orchestrated/) | 1 + 2 (validates pattern transfers across media) | 6 | Audio segment splitting, meeting recordings |
| 3 | [openwebui-bridge-v2](openwebui-bridge-v2/) | 3 Skill-Driven + 4 Security | 5 | OpenWebUI ↔ n8n system integration |

---

## Common structure

Each flagship folder contains:

```text
<example-name>/
├── workflow.json     # ready to import to n8n
├── spec.md           # SDD spec (per enterprise-patterns Skill §3 template)
└── README.md         # deployment steps, credential setup, test cases
```

---

## Suggested learning order

1. Start with `splitPDF-orchestrated`: understand "Atomic + Universal Worker" core
2. Then `splitMP3-API-Orchestrated`: confirm "same pattern, swap media"
3. Finally `openwebui-bridge-v2`: see how this Skill Pack integrates with OpenWebUI

---

## Differences from cookbook

| Dimension | cookbook | flagship |
|---|---|---|
| Purpose | Teach users how to write stickies | Show engineers production deploy reference |
| Content | Layer 1 + expected Layer 2/3 description | Full workflow.json + SDD + README |
| Credentials | Describe purpose | List requirements + setup steps |
| External deps | Mentioned in text | Worker container, API key acquisition listed |
| Ready-to-use | Yes after editing | Yes once credentials are set |
