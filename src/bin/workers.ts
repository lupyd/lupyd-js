import { MultiFilePart } from "./multifile";

export const createWorker = <T, E = T>(javascript: string): [(input: T, transferables?: Transferable[]) => Promise<E>, () => void] => {
    const worker = new Worker(URL.createObjectURL(new Blob([javascript], { type: "application/javascript" })));
    let working = false;

    const createJob = (input: T, transferables: Transferable[] = []): Promise<E> => new Promise((res, rej) => {
        const onerror = (m: any) => {
            removeListeners();
            rej(m);
        }

        worker.addEventListener("error", onerror);
        worker.addEventListener("messageerror", onerror);

        let borrowed = false;
        const tryToBorrow = () => {
            if (!working) {
                worker.postMessage(input, transferables);
                working = true;
                borrowed = true;
            }
        }
        const removeListeners = () => {
            worker.removeEventListener("message", listener);
            worker.removeEventListener("error", onerror);
            worker.removeEventListener("messageerror", onerror);
        }
        tryToBorrow();
        const listener = (m: MessageEvent) => {
            if (working) {
                if (borrowed) {
                    working = false;
                    removeListeners();
                    res(m.data);
                }
            } else {
                tryToBorrow();
            }
        }
        worker.addEventListener("message", listener)
    });
    return [createJob, worker.terminate];
}


export namespace BLOBS {

    const [createJob] = createWorker<MultiFilePart[], string[]>(
        `onmessage=m=>{const u=m.data.map(e=>URL.createObjectURL(new Blob([e.data],{type:e.metaData})));postMessage(u)}`)

    export function getBlobUrls(files: MultiFilePart[]) {
        return createJob(files, files.map(e => e.data));
    }
}
