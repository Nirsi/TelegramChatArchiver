# TelegramChatArchiver
Simple Telegram bot to take every message sent in the group/room and send it to the Notion database.

This project was more of a learning project for me, even though it works just fine. I wanted to learn about programing telegram bots
As well as how to use the Notion API. So I merged those intentions to a single project. So if you want to use it or just have it as an example.
Mind that this project might change drasticly as I found new ways to use the Telegram API or the Notion API.


### How to use
1. Create a Telegram bot using BotFather and use the token you get from it as `TELEGRAM_TOKEN`
2. Create a Notion integration and share a database with it. Use the integration token as `NOTION_TOKEN` and the database ID as `NOTION_DATABASE_ID`
3. Start the bot and it will verify that the Database has the correct structure, modify it if needed.


### Common problems and solutions.
1. The database ID is somehow wrong.
   - Make sure you copy the database ID from the URL when you have the database open in Notion. It should look something like this:`https://www.notion.so/1234aa167890cd821234df567890gh13?v=1234ad167871cd821234df567111gh13`
   - The part after the last `/` and before the `?` is your database ID. In this example, it is `1234aa167890cd821234df567890gh13`.
2. I have the correct ID and the notion integration is added to the workspace, but still the bot says it cannot find the database.
   - The integration must be added to the database as well, adding it to the workspace is not enough.
   - Open the database in Notion. Click the triple dot menu "..." and under "Connections" select you integraiton to grant it aceess to the database.
