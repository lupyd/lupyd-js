import { MultiFilePart } from "./multifile";
export declare const createWorker: <T, E = T>(javascript: string) => [(input: T, transferables?: Transferable[]) => Promise<E>, () => void];
export declare namespace BLOBS {
    function getBlobUrls(files: MultiFilePart[]): Promise<string[]>;
}
