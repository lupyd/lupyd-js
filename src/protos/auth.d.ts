import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "lupyd.auth";
export interface UserTokens {
    accessToken: string;
    refreshToken: string;
}
export interface TokenRequest {
    appId: string;
    permissions: number;
    refreshToken: string;
}
export interface NewAppRequest {
    appId: string;
    contactEmail: string;
    appLink?: string | undefined;
    permisisons?: number | undefined;
}
export interface NewLoginThirdPartyRequest {
    app: string;
    tpAppId: string;
}
export interface ThirdPartyLoginResponse {
    lupydTokens: UserTokens | undefined;
    appTokens: UserTokens | undefined;
}
export interface LoggedInApp {
    app: string;
    aud: string;
    loggedInSince: bigint;
    lastTokenRefresh: bigint;
}
export interface LoggedInApps {
    apps: LoggedInApp[];
}
export interface LogoutToken {
    token: string;
}
export interface LogoutTokens {
    tokens: LogoutToken[];
}
export declare const UserTokens: MessageFns<UserTokens>;
export declare const TokenRequest: MessageFns<TokenRequest>;
export declare const NewAppRequest: MessageFns<NewAppRequest>;
export declare const NewLoginThirdPartyRequest: MessageFns<NewLoginThirdPartyRequest>;
export declare const ThirdPartyLoginResponse: MessageFns<ThirdPartyLoginResponse>;
export declare const LoggedInApp: MessageFns<LoggedInApp>;
export declare const LoggedInApps: MessageFns<LoggedInApps>;
export declare const LogoutToken: MessageFns<LogoutToken>;
export declare const LogoutTokens: MessageFns<LogoutTokens>;
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
