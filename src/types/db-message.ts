import type { Message } from "grammy/types";

export type DbMessage = {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name?: string;
    last_name?: string;
    username: string;
  };
  chat: {
    id: number;
    title: string;
  };
  date: Date;
  text: string;
};

export function fromTelegramMessage(message: Message): DbMessage {
  return {
    message_id: message.message_id,
    from: {
      id: message.from!.id,
      is_bot: message.from!.is_bot,
      first_name: message.from!.first_name,
      last_name: message.from!.last_name,
      username: message.from!.username!,
    },
    chat: {
      id: message.chat.id,
      title: message.chat.title!,
    },
    //Date when the message was send in the format of a Date object (2010-10-10T10:00:00.000Z)
    date: new Date(message.date * 1000),
    //Text send by user
    text: message.text!,
  };
}
