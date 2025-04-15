export interface MultiFilePart {
    data: ArrayBuffer,
    metaData: string,
}

export namespace MultiFiles {
    
    export const getExtension = (file:File) => {
        const indexOfFirstDot = file.name.indexOf('.')
        if (indexOfFirstDot == -1) {
            return ''
        }
        return file.name.slice(indexOfFirstDot + 1)
    }
    const metaDataConstructor = (file: File) => {
        return `${file.size}:${getExtension(file)}`
    }    

    export async function fetchMultiFile(fetchUrl: string,metas:  {ext: string, size: number}[], onFile?: (data: Uint8Array, type: string) => any, onDone?: () => any) {

        const response = await fetch(fetchUrl);
        if (response.status != 200) {
            throw "fetch failed"
        }

        
        const metaHeader = response.headers.get("meta")!;
        if (!metaHeader) {
            throw "no meta found :("
        }

        let currentBuffer: Uint8Array = new Uint8Array(metas[0].size);
        let currentBufferFilledTill = 0;
        let currentFile = 0;
        
        const size = () => metas[currentFile].size;
        
        const setCurrentBuffer = (buf: Uint8Array) => {
            currentBuffer.set(buf, currentBufferFilledTill);
            currentBufferFilledTill += buf.length;
        }
        
        const resetCurrentBuffer = () => {
            if (onFile) onFile(currentBuffer, metas[currentFile].ext)
            currentFile++;
            if (currentFile != metas.length) {
                if (currentBuffer.length < size()) {
                    currentBuffer = new Uint8Array(size());
                } else {
                    currentBuffer = currentBuffer.slice(0, size())
                }
            }
            currentBufferFilledTill = 0;
        }
        
        const reader = response.body!.getReader();
        const read = () => reader.read().then(processData);
        const processData = (s: ReadableStreamReadResult<Uint8Array>): any => {

            if (s.done) {
                if (currentBuffer) {
                    resetCurrentBuffer();
                }
                if (onDone) {
                    onDone();
                }
            } else {
                const buffer = s.value!;

                const parseCurrentBuffer = () => {
                    let cursor = 0;

                    while (currentFile < 8 && currentFile < metas.length) {
                        const endOfFile = (size() - currentBufferFilledTill + cursor);
                        if (endOfFile < buffer.length) {
                            const _buffer = buffer.subarray(cursor, endOfFile);

                            cursor += _buffer.length;

                            setCurrentBuffer(_buffer);

                            resetCurrentBuffer();

                        } else {
                            setCurrentBuffer(buffer.subarray(cursor));
                            break;
                        }
                    }
                }

                parseCurrentBuffer();
                read();
            }
        }
        read();
    }

    export async function getBodyFromFiles(files: File[]): Promise<[Uint8Array, string]> {

        const totalSize =
            files.map(e => e.size).reduce((a, b) => a + b);

        const buffer = new Uint8Array(totalSize);

        let lastFileEndedAt = 0;
        const promises: Promise<void>[] = [];

        for (let file of files) {
            const _start = lastFileEndedAt;

            const promise = async () => buffer.set(new Uint8Array(await file.arrayBuffer()), _start);
            promises.push(promise());
            
            lastFileEndedAt += file.size;
        }

        await Promise.all(promises);

        return [buffer, files.map(metaDataConstructor).join(",") ];
    }
}


export const readStream = <T>(reader: ReadableStreamDefaultReader<T>, onValue: (value: T) => any, onDone: () => any) => {
    const read = () => reader.read().then(process)
    const process = (s: ReadableStreamReadResult<T>): void => {
        if (s.done) {
            onDone()
        } else {
            onValue(s.value!)
            read();
        }
    }
    read();
}
export const mergeStreams = async <T>(readables: ReadableStream<T>[], writable: WritableStream<T>) => {
    const writer = writable.getWriter();

    for (const readable of readables) {
        const reader = readable.getReader();
        await new Promise((res) => { readStream(reader, writer.write, () => res(0)) })
    }
    writer.close();
}
