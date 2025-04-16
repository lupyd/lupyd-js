// import { Utils } from "./utils";
// export function findArray(buffer: Uint8Array, array: Uint8Array, start = 0, end = buffer.length) {
//     for (let i = start; i < end; i++) {
//         let found = true;
//         for (let j = array.length - 1; j >= 0; j--) {
//             if (array[j] != buffer[i + j]) {
//                 found = false;
//                 break;
//             }
//         }
//         if (found) {
//             return i;
//         }
//     }
//     return -1;
// }
// export namespace MultiFile {
//     export function parseMultiFileFormat(buffer: Uint8Array) {
//         try {
//             const start = performance.now();
//             const openBracket = '['.charCodeAt(0);
//             const closedBracket = ']'.charCodeAt(0);
//             if (buffer[0] != openBracket) {
//                 throw "Invalid start format";
//             }
//             let i = 1;
//             while (i < buffer.length) {
//                 if (buffer[i] == closedBracket) {
//                     break;
//                 }
//                 i++;
//             }
//             if (i == buffer.length) {
//                 throw "failed to find ]";
//             }
//             const contentTypeArray: string[] = String.fromCharCode(...buffer.subarray(1, i)).split(',');
//             if (contentTypeArray.length > 8) {
//                 throw "too many files";
//             }
//             i++; // move forward
//             const eachFileStart: number[] = [];
//             for (var j = 0; j < contentTypeArray.length; j++) {
//                 const $4bytes = buffer.subarray(i + (j * 4), i + 4 + (j * 4));
//                 eachFileStart.push(Utils.bytesToNumber($4bytes));
//             }
//             console.log("positions", eachFileStart);
//             const files :{type: string, body: Uint8Array}[] = [];
//             for (var j = 0; j < eachFileStart.length; j++) {
//                 const end = () => (j + 1 == eachFileStart.length) ? buffer.length : eachFileStart[j + 1];
//                 const data = buffer.subarray(eachFileStart[j], end());
//                 console.info({
//                     start: data.subarray(0, 10),
//                     end: data.subarray(data.length - 10),
//                     length: data.length,
//                 })
//                 files.push({type: contentTypeArray[j], body: data});
//             }
//             const end = performance.now();
//             console.log("parsing took ", end - start);
//             return files;
//         } catch (err) {
//             console.error("Error parsing multifle ", err);
//         }
//     }
//     export async function makeMultiFile(files: File[]) {
//         const getContentTypes = () => {
//             let types = "[";
//             for (var j = 0; j < files.length; j++) {
//                 types += files[j].type + (j + 1 == files.length ? "]" : ",")
//             }
//             return types;
//         }
//         const contentTypes = getContentTypes();
//         const getTotalSize = () => {
//             let totalSize = 0;
//             for (var file of files) {
//                 totalSize += file.size;
//             }
//             return totalSize + contentTypes.length + 4 * files.length;
//         }
//         const body = new Uint8Array(getTotalSize());
//         const enc = new TextEncoder();
//         body.set(enc.encode(contentTypes), 0);
//         let lastFileEndedAt = contentTypes.length + 4 * files.length;
//         let lastFileEndedPositionAt = contentTypes.length;
//         for (var file of files) {
//             console.log("feeding file ", file.name)
//             const _buffer = new Uint8Array(await file.arrayBuffer());
//             body.set(_buffer, lastFileEndedAt);
//             console.info({
//                 start: body.subarray(lastFileEndedAt - 5, lastFileEndedAt + 5),
//                 end: body.subarray(body.length - 10)
//             })
//             body.set(Utils.numberToBytes(lastFileEndedAt), lastFileEndedPositionAt);
//             lastFileEndedAt += _buffer.length;
//             lastFileEndedPositionAt += 4;
//         }
//         console.info({
//             positions: body.subarray(contentTypes.length, contentTypes.length + 4 * files.length)
//         })
//         return body;
//     }
//     export async function parseMultipartToSwiperImages(url: string) {
//         try {
//             const response = await fetch(url);
//             const encoder = new TextEncoder();
//             const getBoundary = () => {
//                 const contentType = response.headers.get("content-type");
//                 const splitIndex = contentType?.indexOf("=") ?? -1;
//                 if (splitIndex == -1) {
//                     throw "Content Type is invalid";
//                 }
//                 const boundaryString = contentType!.substring(splitIndex + 1);
//                 const boundary = encoder.encode(boundaryString);
//                 console.log(`boundary '${boundaryString}'`);
//                 return boundary;
//             }
//             const boundary = getBoundary();
//             const rawData = new Uint8Array(await response.arrayBuffer());
//             if (rawData == null) {
//                 return;
//             }
//             const startIdentifer = encoder.encode("\r\n\r\n");
//             const contenttypeSpecifier = encoder.encode("Content-Type: ");
//             const imageUrls: string[] = [];
//             let currentIndex = boundary.length;
//             while (imageUrls.length < 4 && currentIndex < (rawData.length - 10)) {
//                 currentIndex = findArray(rawData, contenttypeSpecifier, currentIndex) + contenttypeSpecifier.length;
//                 const contentTypeStart = currentIndex;
//                 const start = findArray(rawData, startIdentifer, currentIndex) + 4;
//                 console.log(`starts at ${start}`);
//                 const contentType = String.fromCharCode(...rawData.subarray(contentTypeStart, start - 4));
//                 console.log("content type end")
//                 console.log("content type start ", contentTypeStart)
//                 console.log(`content type '${contentType}'`)
//                 currentIndex = findArray(rawData, boundary, currentIndex) - 2;
//                 console.log(`ends at ${currentIndex}`)
//                 const imageData = rawData.subarray(start, currentIndex);
//                 currentIndex = currentIndex + boundary.length + 2;
//                 console.log([imageData.length, currentIndex]);
//                 const base64Url = URL.createObjectURL(new Blob([imageData]));
//                 imageUrls.push(base64Url);
//             }
//             return imageUrls;
//         } catch (err) {
//             console.error("Error parsing multipart files", err);
//         }
//     }
// }
