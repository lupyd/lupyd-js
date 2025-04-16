import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { File, PostBody } from "./post";
export declare const protobufPackage = "lupyd.user";
export interface BoolValue {
    val: boolean;
}
export interface FullUser {
    uname: string;
    bio: Uint8Array;
    pfp: boolean;
    uid: string;
    credits: number;
    chats: boolean;
}
export interface FullUserWithProfile {
    user: FullUser | undefined;
    pfp: File | undefined;
}
export interface FullUsers {
    users: FullUser[];
}
export interface Users {
    users: User[];
}
export interface UpdateUserInfo {
    bio: PostBody | undefined;
    pfp: BoolValue | undefined;
    chats: BoolValue | undefined;
}
export interface User {
    uname: string;
    bio: Uint8Array;
    pfp: boolean;
    chats: boolean;
}
export declare const BoolValue: MessageFns<BoolValue>;
export declare const FullUser: MessageFns<FullUser>;
export declare const FullUserWithProfile: MessageFns<FullUserWithProfile>;
export declare const FullUsers: MessageFns<FullUsers>;
export declare const Users: MessageFns<Users>;
export declare const UpdateUserInfo: MessageFns<UpdateUserInfo>;
export declare const User: MessageFns<User>;
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
