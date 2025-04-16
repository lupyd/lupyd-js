import { Unsubscribe } from "firebase/database";
export interface ChatMessage {
    id: string;
    ts: Date;
    msg: string;
    by: string;
}
export declare const generateMessageId: (ts?: number) => string;
export declare const getTimestampFromMsgKeys: (id: string) => Date;
export declare class ChatSession {
    sender: string;
    receiver: string;
    unsubscribe?: Unsubscribe;
    lastMsg: ChatMessage;
    get senderRef(): string;
    get receiverRef(): string;
    constructor(sender: string, receiver: string, onMsgCallback: (msg: ChatMessage) => void, onError: (error: any) => void, onLoaded: () => void, lastMessage?: ChatMessage);
    sendMessage(text: string): Promise<ChatMessage>;
    updateMessage(id: string, text: string): Promise<ChatMessage>;
    updateLastMsg(id: string, msg: string, by: string): Promise<void>;
    getPreviousChunk(lastRootMsgId: string, limit?: number): Promise<ChatMessage[]>;
    close(): void;
}
