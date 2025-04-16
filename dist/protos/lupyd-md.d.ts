import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "lupyd.markdown";
export declare enum ElementType {
    Normal = 0,
    Bold = 1,
    Italic = 2,
    Header = 4,
    UnderLine = 8,
    Code = 16,
    Quote = 32,
    Spoiler = 64,
    UNRECOGNIZED = -1
}
export declare function elementTypeFromJSON(object: any): ElementType;
export declare function elementTypeToJSON(object: ElementType): string;
export declare enum HyperElementType {
    Mention = 0,
    HashTag = 1,
    Post = 2,
    Group = 3,
    Link = 4,
    UNRECOGNIZED = -1
}
export declare function hyperElementTypeFromJSON(object: any): HyperElementType;
export declare function hyperElementTypeToJSON(object: HyperElementType): string;
export interface HyperCustomElement {
    tag: string;
    body: string;
}
export interface HyperElement {
    tag: HyperElementType;
    body: string;
}
export interface FileElement {
    filename: string;
    url: string;
    mimeType: string;
}
export interface PrimitiveElement {
    elementType: number;
    text: string;
}
export interface Element {
    primitiveElement?: PrimitiveElement | undefined;
    hyperElement?: HyperElement | undefined;
    hyperCustomElement?: HyperCustomElement | undefined;
    fileElement?: FileElement | undefined;
}
export interface Elements {
    elements: Element[];
}
export interface Markdown {
    elements: Elements | undefined;
}
export declare const HyperCustomElement: MessageFns<HyperCustomElement>;
export declare const HyperElement: MessageFns<HyperElement>;
export declare const FileElement: MessageFns<FileElement>;
export declare const PrimitiveElement: MessageFns<PrimitiveElement>;
export declare const Element: MessageFns<Element>;
export declare const Elements: MessageFns<Elements>;
export declare const Markdown: MessageFns<Markdown>;
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
