import { ChatMessage } from "../chats/default";
import { ChatSession } from "../protos/chats";
export declare const createUserChat: (other: string) => Promise<void>;
export declare const getChats: () => Promise<ChatSession[]>;
export interface LastChatMessagePair {
    lastMessageSeenByMe: ChatMessage;
    lastMessageSeenByOther: ChatMessage;
    other: string;
}
export declare const getLastMessagesForEachUser: () => Promise<LastChatMessagePair[]>;
export declare const deleteChat: (other: string) => Promise<void>;
