import { Bot } from "grammy";
import { fromTelegramMessage, type DbMessage } from "../types/db-message";
import { NotionConnector } from "../databases/notion-connector";

export class TelegramBot {
  private bot: Bot;
  private notion_connector: NotionConnector;

  constructor() {
    if (!process.env.TELEGRAM_TOKEN) {
      throw new Error("TELEGRAM_TOKEN environment variable not set");
    }

    this.bot = new Bot(process.env.TELEGRAM_TOKEN);
    this.notion_connector = new NotionConnector();
    console.info("Bot inicialised");
  }

  public async initBot() {
    //handlers
    this.bot.on("message", async (ctx) => {
      const message = ctx.update.message;

      try {
        await this.saveToDatabase(message);
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });
    this.bot.catch((err) => {
      console.error("Bot error:", err);
    });

    //Start the bot
    await this.bot.start();
  }

  /**
   * Save message to database
   * @param message object from telegram bot
   */
  private async saveToDatabase(message: any) {
    const dbMessage: DbMessage = fromTelegramMessage(message);
    this.notion_connector.createDatabasePageFromMessageDb(dbMessage);
  }

  /**
   * testing fucntion to output raw object from telegram bot to console
   * @param message object from telegram bot
   */
  private async printRawMessage(message: any) {
    console.log("Raw message:", message);
  }
}
