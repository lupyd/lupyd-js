import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "lupyd.chat";
export interface ChatSession {
    ts: bigint;
    version: number;
    user1: string;
    user2: string;
}
export interface ChatSessions {
    sessions: ChatSession[];
}
export interface ChatKeys {
    keys: Uint8Array[];
}
export interface ChatKey {
    key: Uint8Array;
}
export declare const ChatSession: MessageFns<ChatSession>;
export declare const ChatSessions: MessageFns<ChatSessions>;
export declare const ChatKeys: MessageFns<ChatKeys>;
export declare const ChatKey: MessageFns<ChatKey>;
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
