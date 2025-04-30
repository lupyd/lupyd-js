"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertImageToWebp = exports.readFileAsDataUrl = void 0;
const vanjs_core_1 = __importDefault(require("vanjs-core"));
const { canvas } = vanjs_core_1.default.tags;
const readFileAsDataUrl = (blob) => {
    return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result;
            if (result && typeof result === "string") {
                res(result);
            }
            else {
                rej(`Invalid result type or failed to load image`);
            }
        };
        reader.readAsDataURL(blob);
    });
};
exports.readFileAsDataUrl = readFileAsDataUrl;
const convertImageToWebp = (src, maxWidth = Number.MAX_SAFE_INTEGER, maxHeight = Number.MAX_SAFE_INTEGER) => {
    return new Promise((res, rej) => {
        const image = new Image();
        image.onerror = (err) => {
            rej(err);
        };
        image.onload = () => {
            let width = image.width;
            let height = image.height;
            if (width > maxWidth || height > maxHeight) {
                const aspectRatio = width / height;
                if (width > height) {
                    width = maxWidth;
                    height = width / aspectRatio;
                }
                else {
                    height = maxHeight;
                    width = height * aspectRatio;
                }
            }
            const imageCanvas = canvas({ width, height });
            const ctx = imageCanvas.getContext("2d");
            if (ctx === null) {
                rej(new Error("Canvas Context is null"));
                return;
            }
            ctx.drawImage(image, 0, 0, width, height);
            imageCanvas.toBlob((blob) => {
                if (blob === null) {
                    rej(new Error("Blob is null"));
                }
                else {
                    res(blob);
                }
            }, "image/webp");
        };
        image.src = src;
    });
};
exports.convertImageToWebp = convertImageToWebp;
