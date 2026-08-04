export interface MultipartCreateResponse {
    key: string;
    uploadId: string;
}
export interface MultipartPart {
    partNumber: number;
    etag: string;
}
export interface MultipartCompleteResponse {
    key: string;
    etag: string;
}
export interface MultipartAbortResponse {
    success: boolean;
}
export declare const createMultipartUpload: (apiCdnUrl: string, fileName: string, contentType: string, totalSize: number, token: string, key?: string) => Promise<MultipartCreateResponse>;
export declare const uploadPart: (apiCdnUrl: string, key: string, uploadId: string, partNumber: number, body: BodyInit, token: string) => Promise<MultipartPart>;
export declare const completeMultipartUpload: (apiCdnUrl: string, key: string, uploadId: string, parts: MultipartPart[], token: string) => Promise<MultipartCompleteResponse>;
export declare const abortMultipartUpload: (apiCdnUrl: string, key: string, uploadId: string, token: string) => Promise<MultipartAbortResponse>;
export declare const uploadFileMultipart: (apiCdnUrl: string, fileName: string, mimeType: string, data: Blob | Uint8Array, token: string, partSize?: number, progressCallback?: (totalBytes: number, bytesSent: number) => void) => Promise<MultipartCompleteResponse>;
