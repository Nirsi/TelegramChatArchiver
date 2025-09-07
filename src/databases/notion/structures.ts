import type { DbMessage } from "../../types/db-message";

export class Structures {
  
  // Note: uses generic "title" property; NotionConnector maps it to the actual DB title property name at runtime
  public static MessageDbToProperties(dbMessage: DbMessage) { 
    return {
      title: {
        title: [
          {
            text: {
              content: dbMessage.chat.groupName,
            },
          },
        ],
      },
      messageId: {
        number: dbMessage.messageId,
      },
      isBot: {
        checkbox: dbMessage.from.isBot,
      },
      firstName: {
        rich_text: [
          {
            text: {
              content: dbMessage.from.firstName || "",
            },
          },
        ],
      },
      lastName: {
        rich_text: [
          {
            text: {
              content: dbMessage.from.lastName || "",
            },
          },
        ],
      },
      username: {
        rich_text: [
          {
            text: {
              content: dbMessage.from.username,
            },
          },
        ],
      },
      date: {
        date: {
          start: dbMessage.date.toISOString(),
        },
      },
      text: {
        rich_text: [
          {
            text: {
              content: dbMessage.text,
            },
          },
        ],
      },
    }
  }
}
