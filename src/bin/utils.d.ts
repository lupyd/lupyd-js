import base from "base-x";
import { File as PostFile } from "../protos/post";
export interface PickedFileUrl {
    blobUrl: string;
    cdnUrl: string;
    file: PostFile;
}
export declare function areListsEqual<T>(a: T[], b: T[]): boolean;
export declare const launchDeepLink: (src: string) => void;
export declare function isValidUsername(uname: string): boolean;
export declare function arrayBufferToString(buffer: ArrayBuffer): string;
export declare const base64UrlDecode: (input: string) => string;
export declare function base64DecodeURL(b64urlstring: string): Uint8Array<ArrayBuffer>;
export declare function base64EncodeURL(byteArray: Uint8Array): string;
export declare namespace Utils {
    const shareUrl: (url: string) => never;
    function showSnackBar(text: string, delay?: number): () => void;
    function bytesToNumber(bytes: Uint8Array): number;
    function numberToBytes(n: number): number[];
    const bigintToBigEndian8Bytes: (n: bigint) => Uint8Array<ArrayBuffer>;
    function formatNumber(num: number, digits?: number): string;
    const dateToString: (ts: number) => string;
    const delay: (ms: number) => Promise<unknown>;
    const binarySearch: <T>(buffer: T[], x: T) => number;
    const numberToString: (n: number) => string;
    const stringToNumber: (str: string) => number;
    const currentGroupMessageQuota: () => string[];
}
export declare class Random {
    private seed;
    constructor(seed?: number);
    nextInt(min?: number, max?: number): number;
    nextFloat(min?: number, max?: number): number;
    nextBool(probabilityOfTrue?: number): boolean;
    nextString(length?: number): string;
    nextElement<T>(array: T[]): T;
    generateArray<T>(length: number, generator: (index: number, rng: Random) => T): T[];
    private next;
    skip(n: number): void;
}
export declare const random: Random;
export declare const setQueryParams: (params: Record<string, string>, url?: URL) => URL;
export declare const base77: base.BaseConverter;
export declare const base58: base.BaseConverter;
export declare const base32: base.BaseConverter;
export declare const generateUlid: () => Uint8Array<ArrayBufferLike>;
export declare const getTimestampFromUlid: (ulid: Uint8Array) => number;
export declare const generateUlidAsBase77: () => string;
export declare const timestampToDatetimeInputString: (timestamp: number) => string;
export declare const _getTimeZoneOffsetInMs: () => number;
export declare const ulidStringify: (ulid: Uint8Array) => string;
export declare const ulidFromString: (s: string) => Uint8Array<ArrayBufferLike>;
export declare const cacheBuster: (durationInSeconds: number) => number;
export declare const tryCatchIfUndefine: <T>(f: () => T) => T | undefined;
export interface ResponseInit {
    status: number;
    statusText: string;
    body: Uint8Array;
    headers: {
        get(_: string): string | null;
    };
}
export declare const fetchWithProgress: (url: string | URL, method: string, headers: Record<string, string> | undefined, body: Blob | BufferSource | FormData | URLSearchParams | string | undefined, onUploadProgress: (sent: number, total: number) => void, onDownloadProgress: (received: number, total: number) => void) => Promise<ResponseInit>;
export declare const sanitizeFilename: (input: string) => string;
export declare const dateToRelativeString: (date: Date) => string;
