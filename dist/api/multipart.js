"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileMultipart = exports.abortMultipartUpload = exports.completeMultipartUpload = exports.uploadPart = exports.createMultipartUpload = void 0;
const api_1 = require("./api");
const error_1 = require("../error");
const createMultipartUpload = async (apiCdnUrl, fileName, contentType, totalSize, token, key) => {
    if (!token || !(0, api_1.usernameExistsInToken)(token)) {
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
        return (await response.json());
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
};
exports.createMultipartUpload = createMultipartUpload;
const uploadPart = async (apiCdnUrl, key, uploadId, partNumber, body, token) => {
    if (!token || !(0, api_1.usernameExistsInToken)(token)) {
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
        return (await response.json());
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
};
exports.uploadPart = uploadPart;
const completeMultipartUpload = async (apiCdnUrl, key, uploadId, parts, token) => {
    if (!token || !(0, api_1.usernameExistsInToken)(token)) {
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
        return (await response.json());
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
};
exports.completeMultipartUpload = completeMultipartUpload;
const abortMultipartUpload = async (apiCdnUrl, key, uploadId, token) => {
    if (!token || !(0, api_1.usernameExistsInToken)(token)) {
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
        return (await response.json());
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
};
exports.abortMultipartUpload = abortMultipartUpload;
const uploadFileMultipart = async (apiCdnUrl, fileName, mimeType, data, token, partSize = 5 * 1024 * 1024, progressCallback) => {
    const totalSize = data instanceof Blob ? data.size : data.byteLength;
    const initRes = await (0, exports.createMultipartUpload)(apiCdnUrl, fileName, mimeType, totalSize, token);
    const key = initRes.key;
    const uploadId = initRes.uploadId;
    const parts = [];
    let bytesUploaded = 0;
    let partNumber = 1;
    try {
        while (bytesUploaded < totalSize) {
            const end = Math.min(bytesUploaded + partSize, totalSize);
            const chunk = data instanceof Blob
                ? data.slice(bytesUploaded, end)
                : data.subarray(bytesUploaded, end);
            const partRes = await (0, exports.uploadPart)(apiCdnUrl, key, uploadId, partNumber, chunk, token);
            parts.push(partRes);
            bytesUploaded = end;
            partNumber++;
            if (progressCallback) {
                progressCallback(totalSize, bytesUploaded);
            }
        }
        return await (0, exports.completeMultipartUpload)(apiCdnUrl, key, uploadId, parts, token);
    }
    catch (err) {
        try {
            await (0, exports.abortMultipartUpload)(apiCdnUrl, key, uploadId, token);
        }
        catch (abortErr) {
            console.error("Failed to abort multipart upload:", abortErr);
        }
        throw err;
    }
};
exports.uploadFileMultipart = uploadFileMultipart;
