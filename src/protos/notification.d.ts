import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "lupyd.notification";
export interface NotificationType {
    follow?: FollowType | undefined;
    comment?: CommentType | undefined;
    like?: LikeType | undefined;
}
export interface FollowType {
    uname: string;
}
export interface CommentType {
    postId: string;
    commentedBy: string;
}
export interface LikeType {
    postId: string;
    likedBy: string;
}
export interface Notification {
    id: Uint8Array;
    seen: boolean;
    notificationType: NotificationType | undefined;
}
export interface Notifications {
    notifications: Notification[];
}
export declare const NotificationType: MessageFns<NotificationType>;
export declare const FollowType: MessageFns<FollowType>;
export declare const CommentType: MessageFns<CommentType>;
export declare const LikeType: MessageFns<LikeType>;
export declare const Notification: MessageFns<Notification>;
export declare const Notifications: MessageFns<Notifications>;
type Builtin = Date | Function | Uint8Array | string | number | boolean | bigint | undefined;
export type DeepPartial<T> = T extends Builtin ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P : P & {
    [K in keyof P]: Exact<P[K], I[K]>;
} & {
    [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
};
export interface MessageFns<T> {
    encode(message: T, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): T;
    fromJSON(object: any): T;
    toJSON(message: T): unknown;
    create<I extends Exact<DeepPartial<T>, I>>(base?: I): T;
    fromPartial<I extends Exact<DeepPartial<T>, I>>(object: I): T;
}
export {};
