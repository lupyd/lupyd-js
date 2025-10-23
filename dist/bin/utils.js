"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateToRelativeString = exports.sanitizeFilename = exports.fetchWithProgress = exports.tryCatchIfUndefine = exports.cacheBuster = exports.ulidFromString = exports.ulidStringify = exports._getTimeZoneOffsetInMs = exports.timestampToDatetimeInputString = exports.generateUlidAsBase77 = exports.getTimestampFromUlid = exports.generateUlid = exports.base32 = exports.base58 = exports.base77 = exports.setQueryParams = exports.random = exports.Random = exports.Utils = exports.base64EncodeURL = exports.base64DecodeURL = exports.base64UrlDecode = exports.arrayBufferToString = exports.isValidUsername = exports.launchDeepLink = exports.areListsEqual = void 0;
const id128_1 = require("id128");
const base_x_1 = __importDefault(require("base-x"));
const constants_1 = require("../constants");
const chars = "0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ\\^_`abcdefghijklmnopqrstuvwxyz{|}~";
const codeUnits = Array.from(new TextEncoder().encode(chars));
function areListsEqual(a, b) {
    if (a === b)
        return true;
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
exports.areListsEqual = areListsEqual;
const launchDeepLink = (src) => {
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.style.display = "none";
    document.body.append(iframe);
};
exports.launchDeepLink = launchDeepLink;
function isValidUsername(uname) {
    const matches = uname.match(new RegExp(constants_1.rawUsernameRegex));
    return matches != null && matches.length === 1 && matches[0] === uname;
}
exports.isValidUsername = isValidUsername;
function arrayBufferToString(buffer) {
    try {
        return new TextDecoder().decode(buffer);
    }
    catch (err) {
        return `ERROR DECODING: ${err}`;
    }
}
exports.arrayBufferToString = arrayBufferToString;
const base64UrlDecode = (input) => {
    // Replace non-url compatible chars with base64 standard chars
    input = input.replace(/-/g, "+").replace(/_/g, "/");
    // Pad out with standard base64 required padding characters
    var pad = input.length % 4;
    if (pad) {
        if (pad === 1) {
            throw new Error("InvalidLengthError: Input base64url string is the wrong length to determine padding");
        }
        input += new Array(5 - pad).join("=");
    }
    return atob(input);
};
exports.base64UrlDecode = base64UrlDecode;
function base64DecodeURL(b64urlstring) {
    return new Uint8Array(atob(b64urlstring.replace(/-/g, "+").replace(/_/g, "/"))
        .split("")
        .map((val) => {
        return val.charCodeAt(0);
    }));
}
exports.base64DecodeURL = base64DecodeURL;
function base64EncodeURL(byteArray) {
    return btoa(Array.from(byteArray)
        .map((val) => {
        return String.fromCharCode(val);
    })
        .join(""))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/\=/g, "");
}
exports.base64EncodeURL = base64EncodeURL;
var Utils;
(function (Utils) {
    Utils.shareUrl = (url) => {
        throw new Error(`Not implemented, Can't share ${url}`);
    };
    // Returns a function to dispose Snackbar
    function showSnackBar(text, delay = 1000) {
        console.log("Showing snackbar ", text);
        const snackbarContainer = document.getElementById("snackbar");
        if (!snackbarContainer)
            console.warn("Snackbar container #snackbar does not exist");
        const snackbar = document.createElement("div");
        snackbar.classList.add("snackbar");
        snackbar.innerText = text;
        snackbarContainer.appendChild(snackbar);
        Utils.delay(200).finally(() => snackbar.classList.add("show"));
        const dispose = () => {
            snackbar.classList.remove("show");
            snackbar.onclick = null;
            Utils.delay(1000).finally(() => snackbar.remove());
        };
        const timeOut = setTimeout(dispose, delay);
        return () => {
            dispose(), clearTimeout(timeOut);
        };
    }
    Utils.showSnackBar = showSnackBar;
    // export function showOverlay(child: HTMLElement) {
    //   const overlay = document.createElement("div")
    //   // const overlay = div({ class: "overlay show no-events" }, child);
    //   overlay.classList.add("overlay", "show", "no-events")
    //   overlay.append(child)
    //   document.querySelector(".overlays")!.append(overlay);
    //   return () => overlay.remove();
    // }
    // export function showDialog(
    //   title: HTMLElement,
    //   buttons: { text: string; onClick: () => void; class: string }[],
    //   onDismissed: () => void,
    // ) {
    //   const overlay = div({ class: "overlay show" });
    //   const dismissOverlay = () => {
    //     overlay.remove();
    //   };
    //   overlay.replaceChildren(
    //     div(
    //       { class: "dialog" },
    //       title,
    //       div(
    //         { class: "row" },
    //         ...buttons.map((e) =>
    //           button(
    //             {
    //               class: e.class,
    //               onclick: () => {
    //                 e.onClick();
    //                 dismissOverlay();
    //               },
    //             },
    //             e.text,
    //           ),
    //         ),
    //       ),
    //     ),
    //   );
    //   overlay.addEventListener(
    //     "click",
    //     (event: Event) => {
    //       if (event.target && event.target == overlay) {
    //         dismissOverlay();
    //         onDismissed();
    //       }
    //     },
    //     { once: true },
    //   );
    //   document.querySelector(".overlays")!.append(overlay);
    // }
    function bytesToNumber(bytes) {
        let val = 0;
        for (var i of bytes) {
            val = (val << 8) + (i & 255);
        }
        return val;
    }
    Utils.bytesToNumber = bytesToNumber;
    function numberToBytes(n) {
        const _ = (i) => (n >> (i * 8)) & 255;
        return [_(3), _(2), _(1), _(0)];
    }
    Utils.numberToBytes = numberToBytes;
    Utils.bigintToBigEndian8Bytes = (n) => {
        const byteArray = new Uint8Array(8); // 8 bytes for 64-bit
        new DataView(byteArray.buffer).setBigUint64(0, n, false);
        return byteArray;
    };
    function formatNumber(num, digits = 2) {
        const lookup = [
            { value: 1, symbol: "" },
            { value: 1e3, symbol: "k" },
            { value: 1e6, symbol: "M" },
            { value: 1e9, symbol: "B" },
        ];
        const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        const item = lookup
            .slice()
            .reverse()
            .find((item) => num >= item.value);
        return item
            ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol
            : "0";
    }
    Utils.formatNumber = formatNumber;
    Utils.dateToString = (ts) => new Date(ts).toString().substring(0, 24);
    Utils.delay = (ms) => new Promise((res, _) => setTimeout(() => res(0), ms));
    Utils.binarySearch = (buffer, x) => {
        var start = 0, end = buffer.length - 1;
        while (start <= end) {
            var mid = (start + end) >> 1;
            if (buffer[mid] == x) {
                return mid;
            }
            else if (buffer[mid] < x) {
                start = mid + 1;
            }
            else {
                end = mid - 1;
            }
        }
        return -1;
    };
    Utils.numberToString = (n) => {
        if (n == 0) {
            return "-";
        }
        const _chars = [];
        while (n > 0) {
            _chars.push(codeUnits[n % codeUnits.length]);
            n = Math.floor(n / codeUnits.length);
        }
        return String.fromCharCode(..._chars.reverse());
    };
    Utils.stringToNumber = (str) => {
        let n = 0;
        for (var i = 0; i < str.length; i++) {
            n +=
                Math.pow(codeUnits.length, i) *
                    Utils.binarySearch(codeUnits, str.charCodeAt(str.length - 1 - i));
        }
        return n;
    };
    Utils.currentGroupMessageQuota = () => {
        const now = Date.now();
        const enc = Utils.numberToString(now);
        const buf = new TextEncoder().encode(enc);
        for (var i = 3; i < enc.length; i++) {
            buf[i] = 45; //"-"
        }
        const lowerLimit = String.fromCharCode(...buf);
        buf[2] = chars.charCodeAt((1 + Utils.binarySearch(codeUnits, buf[2])) % chars.length);
        const upperLimit = String.fromCharCode(...buf);
        return [lowerLimit, upperLimit];
    };
})(Utils || (exports.Utils = Utils = {}));
class Random {
    seed;
    constructor(seed = Math.random()) {
        this.seed = seed;
    }
    nextInt(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
        return Math.floor(this.nextFloat(min, max));
    }
    nextFloat(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
        return (max - min) * this.next() + min;
    }
    nextBool(probabilityOfTrue = 0.5) {
        return this.nextFloat() < probabilityOfTrue;
    }
    nextString(length = 24) {
        let str = "";
        str += chars.charAt(11 + this.nextInt(0, chars.length - 11));
        for (var i = 0; i < length; i++) {
            str += chars.charAt(this.nextInt(0, chars.length));
        }
        return str;
    }
    nextElement(array) {
        return array[this.nextInt(0, array.length)];
    }
    generateArray(length, generator) {
        return Array.from({ length }, (_, index) => generator(index, this));
    }
    next() {
        if (process.env.JS_ENV_CUSTOM_RANDOM == "true") {
            let x = Math.sin(this.seed) * 99999;
            this.seed = x;
            x = x - Math.floor(x);
            return x;
        }
        else {
            return Math.random();
        }
    }
    skip(n) {
        for (let i = 0; i < n; i++) {
            this.next();
        }
    }
}
exports.Random = Random;
exports.random = new Random(1);
const setQueryParams = (params, url = new URL(location.href)) => {
    for (const k in params) {
        const v = params[k];
        url.searchParams.set(k, v);
    }
    return url;
};
exports.setQueryParams = setQueryParams;
exports.base77 = (0, base_x_1.default)(chars); // compatible with firebase realtime database
exports.base58 = (0, base_x_1.default)("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");
exports.base32 = (0, base_x_1.default)("0123456789ABCDEFGHJKMNPQRSTVWXYZ");
const generateUlid = () => id128_1.Ulid.generate().bytes;
exports.generateUlid = generateUlid;
const getTimestampFromUlid = (ulid) => Number(id128_1.Ulid.construct(ulid).time);
exports.getTimestampFromUlid = getTimestampFromUlid;
const generateUlidAsBase77 = () => exports.base77.encode((0, exports.generateUlid)());
exports.generateUlidAsBase77 = generateUlidAsBase77;
const timestampToDatetimeInputString = (timestamp) => new Date(timestamp + (0, exports._getTimeZoneOffsetInMs)()).toISOString().slice(0, 19);
exports.timestampToDatetimeInputString = timestampToDatetimeInputString;
const _getTimeZoneOffsetInMs = () => new Date().getTimezoneOffset() * -60 * 1000;
exports._getTimeZoneOffsetInMs = _getTimeZoneOffsetInMs;
const ulidStringify = (ulid) => id128_1.Ulid.construct(ulid).toCanonical();
exports.ulidStringify = ulidStringify;
const ulidFromString = (s) => id128_1.Ulid.fromCanonical(s).bytes;
exports.ulidFromString = ulidFromString;
const cacheBuster = (durationInSeconds) => Math.floor(Date.now() / (durationInSeconds * 1000)) *
    (durationInSeconds * 1000);
exports.cacheBuster = cacheBuster;
// export class DisposableWebComponent extends HTMLElement {
//   private readonly onConnected?: () => void;
//   private readonly onDisconnected?: () => void;
//   constructor(
//     onConnected?: () => void,
//     onDisconnected?: () => void,
//     ...children: HTMLElement[]
//   ) {
//     super();
//     this.onConnected = onConnected;
//     this.onDisconnected = onDisconnected;
//     this.replaceChildren(...children);
//   }
//   connectedCallback() {
//     if (this.onConnected) {
//       this.onConnected();
//     }
//   }
//   disconnectedCallback() {
//     if (this.onDisconnected) {
//       this.onDisconnected();
//     }
//   }
// }
// customElements.define("same-as-div", DisposableWebComponent);
const tryCatchIfUndefine = (f) => {
    try {
        return f();
    }
    catch (err) {
        console.warn(err);
    }
};
exports.tryCatchIfUndefine = tryCatchIfUndefine;
const fetchWithProgress = (url, method, headers = {}, body, onUploadProgress, onDownloadProgress) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = "arraybuffer";
    return new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
            onUploadProgress(event.loaded, event.total);
        });
        xhr.addEventListener("progress", (event) => {
            onDownloadProgress(event.loaded, event.total);
        });
        xhr.addEventListener("loadend", (_) => {
            if (xhr.readyState == 4) {
                resolve({
                    status: xhr.status,
                    statusText: xhr.statusText,
                    headers: {
                        get(s) {
                            return xhr.getResponseHeader(s);
                        },
                    },
                    body: new Uint8Array(xhr.response),
                });
            }
        });
        xhr.addEventListener("error", (err) => {
            reject(err);
        });
        xhr.open(method, url);
        for (const headerName in headers) {
            xhr.setRequestHeader(headerName, headers[headerName]);
        }
        xhr.send(body);
    });
};
exports.fetchWithProgress = fetchWithProgress;
const sanitizeFilename = (input) => input.replace(/[^a-zA-Z0-9-_.]/g, "_");
exports.sanitizeFilename = sanitizeFilename;
const dateToRelativeString = (date) => {
    const difference = Date.now() - Number(date);
    const ONE_SECOND = 1000;
    const ONE_MINUTE = ONE_SECOND * 60;
    const ONE_HOUR = ONE_MINUTE * 60;
    const ONE_DAY = ONE_HOUR * 24;
    const ONE_YEAR = ONE_DAY * 365;
    if (difference < ONE_MINUTE) {
        return `just now`;
    }
    if (difference > 0) {
        const years = Math.floor(difference / ONE_YEAR);
        if (years > 0) {
            return `${years}y ago`;
        }
        const days = Math.floor(difference / ONE_DAY);
        if (days > 0) {
            return `${days}d ago`;
        }
        const hours = Math.floor(difference / ONE_HOUR);
        if (hours > 0) {
            return `${hours}h ago`;
        }
        const minutes = Math.floor(difference / ONE_MINUTE);
        if (minutes > 0) {
            return `${minutes}m ago`;
        }
        const seconds = Math.floor(difference / ONE_SECOND);
        return `${seconds}s ago`;
    }
    return `too long ago`;
};
exports.dateToRelativeString = dateToRelativeString;
