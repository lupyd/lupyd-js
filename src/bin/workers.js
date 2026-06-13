"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOBS = exports.createWorker = void 0;
const createWorker = (javascript) => {
    const worker = new Worker(URL.createObjectURL(new Blob([javascript], { type: "application/javascript" })));
    let working = false;
    const createJob = (input, transferables = []) => new Promise((res, rej) => {
        const onerror = (m) => {
            removeListeners();
            rej(m);
        };
        worker.addEventListener("error", onerror);
        worker.addEventListener("messageerror", onerror);
        let borrowed = false;
        const tryToBorrow = () => {
            if (!working) {
                worker.postMessage(input, transferables);
                working = true;
                borrowed = true;
            }
        };
        const removeListeners = () => {
            worker.removeEventListener("message", listener);
            worker.removeEventListener("error", onerror);
            worker.removeEventListener("messageerror", onerror);
        };
        tryToBorrow();
        const listener = (m) => {
            if (working) {
                if (borrowed) {
                    working = false;
                    removeListeners();
                    res(m.data);
                }
            }
            else {
                tryToBorrow();
            }
        };
        worker.addEventListener("message", listener);
    });
    return [createJob, worker.terminate];
};
exports.createWorker = createWorker;
var BLOBS;
(function (BLOBS) {
    const [createJob] = (0, exports.createWorker)(`onmessage=m=>{const u=m.data.map(e=>URL.createObjectURL(new Blob([e.data],{type:e.metaData})));postMessage(u)}`);
    function getBlobUrls(files) {
        return createJob(files, files.map(e => e.data));
    }
    BLOBS.getBlobUrls = getBlobUrls;
})(BLOBS || (exports.BLOBS = BLOBS = {}));
