import { Bot } from "grammy";
import { fromTelegramMessage } from "../types/db-message";

export class TelegramBot {
  private bot: Bot;

  constructor() {
    if (!process.env.TELEGRAM_TOKEN) {
      throw new Error("TELEGRAM_TOKEN environment variable not set");
    }

    this.bot = new Bot(process.env.TELEGRAM_TOKEN);
    console.info("Bot inicialised");
  }

  public async initBot() {
    //handlers
    this.bot.on("message", async (ctx) => {
      const message = ctx.update.message;

      try {
        await this.printRawMessage(message);
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

  // Example database save function (implement according to your database choice)
  private async saveToDatabase(message: any) {
    console.log("Saving message to database:", fromTelegramMessage(message));
  }

  private async printRawMessage(message: any) {
    console.log("Raw message:", message);
  }
}
