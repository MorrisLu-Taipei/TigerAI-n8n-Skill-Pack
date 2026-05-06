# Layer 1

```markdown
## 需求：HN 每日 AI 摘要

@flow: 每天早上抓 Hacker News，AI 摘要前 10 篇，寄信給 PM
@trigger: schedule cron "0 9 * * *"
@step: 抓 RSS https://news.ycombinator.com/rss
@step: 只留前 10 篇
@step: 每篇用 OpenAI gpt-4o-mini 產 50 字中文摘要
@step: 套 HTML 模板（含標題、摘要、連結）
@output: gmail to pm@example.com, subject "HN Daily {今日日期}"
@on-error: slack #ops "HN 摘要失敗: {error}"
```
