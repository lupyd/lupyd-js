export interface MultiFilePart {
    data: ArrayBuffer;
    metaData: string;
}
export declare namespace MultiFiles {
    const getExtension: (file: File) => string;
    function fetchMultiFile(fetchUrl: string, metas: {
        ext: string;
        size: number;
    }[], onFile?: (data: Uint8Array, type: string) => any, onDone?: () => any): Promise<void>;
    function getBodyFromFiles(files: File[]): Promise<[Uint8Array, string]>;
}
export declare const readStream: <T>(reader: ReadableStreamDefaultReader<T>, onValue: (value: T) => any, onDone: () => any) => void;
export declare const mergeStreams: <T>(readables: ReadableStream<T>[], writable: WritableStream<T>) => Promise<void>;
