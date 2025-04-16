export declare enum MessageType {
    none = 0,
    img = 1,
    imgs = 2,
    vid = 3,
    file = 4,
    link = 5,
    call = 6,
    vcall = 7
}
export interface MessageOptions {
    id: string;
    txt: string;
    by: string;
    link?: string;
    type?: MessageType;
}
export declare const randomMessages: (length: number) => MessageOptions[];
export declare const getDateFromString: (id: string) => Date;
export type MessageSubmitOptions = MessageOptions & {
    files: File[];
};
export declare const sendMessageToUser: (to: string, message: MessageSubmitOptions) => Promise<MessageOptions>;
export declare const sendMessageToGroup: (grpId: string, message: MessageSubmitOptions) => Promise<MessageOptions>;
export declare const sendMessageToUsersAndGroup: (users: string[], grps: string[], message: MessageSubmitOptions) => Promise<void>;
