type DecodeAsNumberOptions = {
    asNumber: true;
};
type DecodeAsBufferOptions = {
    asNumber: false;
};
/**
 * An implementation of the Crockford Base32 algorithm.
 *
 * Spec: https://www.crockford.com/base32.html
 */
export declare class CrockfordBase32 {
    static encode(input: Uint8Array | number | bigint): string;
    static decode(input: string, options: DecodeAsNumberOptions): bigint;
    static decode(input: string, options?: DecodeAsBufferOptions): Uint8Array;
    private static createBuffer;
    private static asNumber;
    private static asBuffer;
}
export {};
