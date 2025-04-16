"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeStreams = exports.readStream = exports.MultiFiles = void 0;
var MultiFiles;
(function (MultiFiles) {
    MultiFiles.getExtension = (file) => {
        const indexOfFirstDot = file.name.indexOf('.');
        if (indexOfFirstDot == -1) {
            return '';
        }
        return file.name.slice(indexOfFirstDot + 1);
    };
    const metaDataConstructor = (file) => {
        return `${file.size}:${MultiFiles.getExtension(file)}`;
    };
    async function fetchMultiFile(fetchUrl, metas, onFile, onDone) {
        const response = await fetch(fetchUrl);
        if (response.status != 200) {
            throw "fetch failed";
        }
        const metaHeader = response.headers.get("meta");
        if (!metaHeader) {
            throw "no meta found :(";
        }
        let currentBuffer = new Uint8Array(metas[0].size);
        let currentBufferFilledTill = 0;
        let currentFile = 0;
        const size = () => metas[currentFile].size;
        const setCurrentBuffer = (buf) => {
            currentBuffer.set(buf, currentBufferFilledTill);
            currentBufferFilledTill += buf.length;
        };
        const resetCurrentBuffer = () => {
            if (onFile)
                onFile(currentBuffer, metas[currentFile].ext);
            currentFile++;
            if (currentFile != metas.length) {
                if (currentBuffer.length < size()) {
                    currentBuffer = new Uint8Array(size());
                }
                else {
                    currentBuffer = currentBuffer.slice(0, size());
                }
            }
            currentBufferFilledTill = 0;
        };
        const reader = response.body.getReader();
        const read = () => reader.read().then(processData);
        const processData = (s) => {
            if (s.done) {
                if (currentBuffer) {
                    resetCurrentBuffer();
                }
                if (onDone) {
                    onDone();
                }
            }
            else {
                const buffer = s.value;
                const parseCurrentBuffer = () => {
                    let cursor = 0;
                    while (currentFile < 8 && currentFile < metas.length) {
                        const endOfFile = (size() - currentBufferFilledTill + cursor);
                        if (endOfFile < buffer.length) {
                            const _buffer = buffer.subarray(cursor, endOfFile);
                            cursor += _buffer.length;
                            setCurrentBuffer(_buffer);
                            resetCurrentBuffer();
                        }
                        else {
                            setCurrentBuffer(buffer.subarray(cursor));
                            break;
                        }
                    }
                };
                parseCurrentBuffer();
                read();
            }
        };
        read();
    }
    MultiFiles.fetchMultiFile = fetchMultiFile;
    async function getBodyFromFiles(files) {
        const totalSize = files.map(e => e.size).reduce((a, b) => a + b);
        const buffer = new Uint8Array(totalSize);
        let lastFileEndedAt = 0;
        const promises = [];
        for (let file of files) {
            const _start = lastFileEndedAt;
            const promise = async () => buffer.set(new Uint8Array(await file.arrayBuffer()), _start);
            promises.push(promise());
            lastFileEndedAt += file.size;
        }
        await Promise.all(promises);
        return [buffer, files.map(metaDataConstructor).join(",")];
    }
    MultiFiles.getBodyFromFiles = getBodyFromFiles;
})(MultiFiles || (exports.MultiFiles = MultiFiles = {}));
const readStream = (reader, onValue, onDone) => {
    const read = () => reader.read().then(process);
    const process = (s) => {
        if (s.done) {
            onDone();
        }
        else {
            onValue(s.value);
            read();
        }
    };
    read();
};
exports.readStream = readStream;
const mergeStreams = async (readables, writable) => {
    const writer = writable.getWriter();
    for (const readable of readables) {
        const reader = readable.getReader();
        await new Promise((res) => { (0, exports.readStream)(reader, writer.write, () => res(0)); });
    }
    writer.close();
};
exports.mergeStreams = mergeStreams;
