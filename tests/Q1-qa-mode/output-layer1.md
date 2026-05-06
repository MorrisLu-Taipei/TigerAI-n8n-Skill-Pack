# Q1 產出的 Layer 1（使用者確認版）

```markdown
## 補習班繳費提醒

@flow: 每天早上自動提醒一週內要繳費的學員
@trigger: schedule cron "0 9 * * *"
@input: Google Sheet "補習班學員" / 分頁 "繳費紀錄"
  - A: 姓名 (string)
  - B: 手機 (string)
  - C: 下次繳費日 (date)
@step: 讀取整張分頁
@step: 過濾 下次繳費日 <= 今天+7 天
@step: 彙總成單一訊息（每行：姓名/電話/日期）
@output: gmail to tina@cram.com, subject "本週繳費提醒 - {today}"
@on-error: gmail to tina@cram.com + retry 3
```
