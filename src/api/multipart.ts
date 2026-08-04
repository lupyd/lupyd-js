import { usernameExistsInToken } from "./api";
import { throwStatusError } from "../error";

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

export const createMultipartUpload = async (
  apiCdnUrl: string,
  fileName: string,
  contentType: string,
  totalSize: number,
  token: string,
  key?: string,
): Promise<MultipartCreateResponse> => {
  if (!token || !usernameExistsInToken(token)) {
    throw new Error("User Not Authenticated");
  }

  const url = `${apiCdnUrl}/multipart/create`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      fileName,
      contentType,
      totalSize,
      key,
    }),
  });

  if (response.status === 200) {
    return (await response.json()) as MultipartCreateResponse;
  }

  throwStatusError(response.status, await response.text());
};

export const uploadPart = async (
  apiCdnUrl: string,
  key: string,
  uploadId: string,
  partNumber: number,
  body: BodyInit,
  token: string,
): Promise<MultipartPart> => {
  if (!token || !usernameExistsInToken(token)) {
    throw new Error("User Not Authenticated");
  }

  const url = new URL(`${apiCdnUrl}/multipart/upload-part`);
  url.searchParams.append("key", key);
  url.searchParams.append("uploadId", uploadId);
  url.searchParams.append("partNumber", partNumber.toString());

  const response = await fetch(url.toString(), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/octet-stream",
    },
    body,
  });

  if (response.status === 200) {
    return (await response.json()) as MultipartPart;
  }

  throwStatusError(response.status, await response.text());
};

export const completeMultipartUpload = async (
  apiCdnUrl: string,
  key: string,
  uploadId: string,
  parts: MultipartPart[],
  token: string,
): Promise<MultipartCompleteResponse> => {
  if (!token || !usernameExistsInToken(token)) {
    throw new Error("User Not Authenticated");
  }

  const url = `${apiCdnUrl}/multipart/complete`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      key,
      uploadId,
      parts,
    }),
  });

  if (response.status === 200) {
    return (await response.json()) as MultipartCompleteResponse;
  }

  throwStatusError(response.status, await response.text());
};

export const abortMultipartUpload = async (
  apiCdnUrl: string,
  key: string,
  uploadId: string,
  token: string,
): Promise<MultipartAbortResponse> => {
  if (!token || !usernameExistsInToken(token)) {
    throw new Error("User Not Authenticated");
  }

  const url = `${apiCdnUrl}/multipart/abort`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      key,
      uploadId,
    }),
  });

  if (response.status === 200) {
    return (await response.json()) as MultipartAbortResponse;
  }

  throwStatusError(response.status, await response.text());
};

export const uploadFileMultipart = async (
  apiCdnUrl: string,
  fileName: string,
  mimeType: string,
  data: Blob | Uint8Array,
  token: string,
  partSize: number = 5 * 1024 * 1024,
  progressCallback?: (totalBytes: number, bytesSent: number) => void,
): Promise<MultipartCompleteResponse> => {
  const totalSize = data instanceof Blob ? data.size : data.byteLength;

  const initRes = await createMultipartUpload(
    apiCdnUrl,
    fileName,
    mimeType,
    totalSize,
    token,
  );

  const key = initRes.key;
  const uploadId = initRes.uploadId;
  const parts: MultipartPart[] = [];

  let bytesUploaded = 0;
  let partNumber = 1;

  try {
    while (bytesUploaded < totalSize) {
      const end = Math.min(bytesUploaded + partSize, totalSize);
      const chunk =
        data instanceof Blob
          ? data.slice(bytesUploaded, end)
          : data.subarray(bytesUploaded, end);

      const partRes = await uploadPart(
        apiCdnUrl,
        key,
        uploadId,
        partNumber,
        chunk as BodyInit,
        token,
      );

      parts.push(partRes);
      bytesUploaded = end;
      partNumber++;

      if (progressCallback) {
        progressCallback(totalSize, bytesUploaded);
      }
    }

    return await completeMultipartUpload(
      apiCdnUrl,
      key,
      uploadId,
      parts,
      token,
    );
  } catch (err) {
    try {
      await abortMultipartUpload(apiCdnUrl, key, uploadId, token);
    } catch (abortErr) {
      console.error("Failed to abort multipart upload:", abortErr);
    }
    throw err;
  }
};
