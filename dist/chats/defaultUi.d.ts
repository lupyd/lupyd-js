import { ChatMessage } from "./default";
export declare class DefaultUiChatElement extends HTMLElement {
    private session;
    private msgs;
    private _callSession;
    sessionStartLastMessage: ChatMessage | undefined;
    isOnCall: import("vanjs-core").State<boolean>;
    msgIdOfCall: string;
    private callState;
    errorText: import("vanjs-core").State<string>;
    loadedAllOldMessages: boolean;
    constructor(receiver: string, lastMessage: ChatMessage | undefined);
    disconnectedCallback(): void;
    connectedCallback(): void;
    get receiver(): string;
    get sender(): string;
    onCallButtonClick(): void;
    render(): void;
    startSession(): Promise<void>;
    onAnswer(callId: string, msgId: string): void;
    onReject(callId: string, msgId: string): void;
    onCancel(callId: string, msgId: string): void;
    onClosed(callId: string, msgId: string): void;
    addMessageElement(msg: ChatMessage): void;
    getOlderMessages(): Promise<void>;
    sendMessage(msg: string): Promise<ChatMessage>;
    updateMessage(id: string, msg: string): Promise<ChatMessage>;
    submitMessage(): void;
}
