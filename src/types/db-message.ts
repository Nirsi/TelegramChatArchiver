import type { Message } from "grammy/types";

/**
 * Type representing Notion Database datatype which is used for storing messages
 */
export type DbMessage = {
  messageId: number;
  from: {
    isBot: boolean;
    firstName?: string;
    lastName?: string;
    username: string;
  };
  //Chat object contains info about the room/group where the message was send
  chat: {
    //name of the room/group
    groupName: string;
  };
  //Date when the message was send in the format of a Date object (2010-10-10T10:00:00.000Z)
  date: Date;
  //Text send by user
  text: string;
};

/**
 * Convert Telegram message object to Notino Database message object
 * @param { Message } message
 * @returns { DbMessage } Notino Database message object
 */
export function fromTelegramMessage(message: Message): DbMessage {
  return {
    messageId: message.message_id,
    from: {
      isBot: message.from!.is_bot,
      firstName: message.from!.first_name,
      lastName: message.from!.last_name,
      username: message.from!.username!,
    },
    chat: {
      groupName: message.chat.title!,
    },
    date: new Date(message.date * 1000),
    text: message.text!,
  };
}
