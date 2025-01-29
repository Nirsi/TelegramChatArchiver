import { NotionConnector } from "./databases/notion-connector";
import { TelegramBot } from "./telegram/telegram-bot";

const bot = new TelegramBot();
bot.initBot();
