import { Ulid } from "id128";
import base from "base-x";
import { rawUsernameRegex } from "../constants";
import van from "vanjs-core";
import { createElement, IconNode } from "lucide";
import { getIcon } from "./icons";

import { File as PostFile } from "../protos/post";

const chars =
  "0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ\\^_`abcdefghijklmnopqrstuvwxyz{|}~";
const codeUnits = Array.from(new TextEncoder().encode(chars));

export interface PickedFileUrl {
  blobUrl: string;
  cdnUrl: string;
  file: PostFile;
}

export function areListsEqual<T>(a: T[], b: T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

export const launchDeepLink = (src: string) => {
  const iframe = document.createElement("iframe");
  iframe.src = src;

  iframe.style.display = "none";
  document.body.append(iframe);
};

export function isValidUsername(uname: string) {
  const matches = uname.match(new RegExp(rawUsernameRegex));
  return matches != null && matches.length === 1 && matches[0] === uname;
}

export function arrayBufferToString(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder().decode(buffer);
  } catch (err) {
    return `ERROR DECODING: ${err}`;
  }
}

export const base64UrlDecode = (input: string) => {
  // Replace non-url compatible chars with base64 standard chars
  input = input.replace(/-/g, "+").replace(/_/g, "/");

  // Pad out with standard base64 required padding characters
  var pad = input.length % 4;
  if (pad) {
    if (pad === 1) {
      throw new Error(
        "InvalidLengthError: Input base64url string is the wrong length to determine padding",
      );
    }
    input += new Array(5 - pad).join("=");
  }

  return atob(input);
};

export function base64DecodeURL(b64urlstring: string) {
  return new Uint8Array(
    atob(b64urlstring.replace(/-/g, "+").replace(/_/g, "/"))
      .split("")
      .map((val) => {
        return val.charCodeAt(0);
      }),
  );
}

export function base64EncodeURL(byteArray: Uint8Array) {
  return btoa(
    Array.from(byteArray)
      .map((val) => {
        return String.fromCharCode(val);
      })
      .join(""),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/\=/g, "");
}

export namespace Utils {
  export const shareUrl = (url: string) => {
    throw new Error(`Not implemented, Can't share ${url}`);
  };

  // Returns a function to dispose Snackbar
  export function showSnackBar(text: string, delay = 1000) {
    console.log("Showing snackbar ", text);
    const snackbarContainer = document.getElementById("snackbar");

    if (!snackbarContainer)
      console.warn("Snackbar container #snackbar does not exist");

    const snackbar = document.createElement("div");
    snackbar.classList.add("snackbar");
    snackbar.innerText = text;
    snackbarContainer!.appendChild(snackbar);
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

  export function bytesToNumber(bytes: Uint8Array) {
    let val = 0;
    for (var i of bytes) {
      val = (val << 8) + (i & 255);
    }
    return val;
  }

  export function numberToBytes(n: number) {
    const _ = (i: number) => (n >> (i * 8)) & 255;
    return [_(3), _(2), _(1), _(0)];
  }

  export const bigintToBigEndian8Bytes = (n: bigint) => {
    const byteArray = new Uint8Array(8); // 8 bytes for 64-bit
    new DataView(byteArray.buffer).setBigUint64(0, n, false);
    return byteArray;
  };

  export function formatNumber(num: number, digits = 2) {
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

  export const dateToString = (ts: number) =>
    new Date(ts).toString().substring(0, 24);

  export const delay = (ms: number) =>
    new Promise((res, _) => setTimeout(() => res(0), ms));

  export const binarySearch = <T,>(buffer: T[], x: T) => {
    var start = 0,
      end = buffer.length - 1;
    while (start <= end) {
      var mid = (start + end) >> 1;
      if (buffer[mid] == x) {
        return mid;
      } else if (buffer[mid] < x) {
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }
    return -1;
  };

  export const numberToString = (n: number) => {
    if (n == 0) {
      return "-";
    }
    const _chars: number[] = [];

    while (n > 0) {
      _chars.push(codeUnits[n % codeUnits.length]);
      n = Math.floor(n / codeUnits.length);
    }

    return String.fromCharCode(..._chars.reverse());
  };

  export const stringToNumber = (str: string) => {
    let n = 0;
    for (var i = 0; i < str.length; i++) {
      n +=
        Math.pow(codeUnits.length, i) *
        binarySearch(codeUnits, str.charCodeAt(str.length - 1 - i));
    }

    return n;
  };

  export const currentGroupMessageQuota = () => {
    const now = Date.now();

    const enc = Utils.numberToString(now);
    const buf = new TextEncoder().encode(enc);
    for (var i = 3; i < enc.length; i++) {
      buf[i] = 45; //"-"
    }

    const lowerLimit = String.fromCharCode(...buf);
    buf[2] = chars.charCodeAt(
      (1 + binarySearch(codeUnits, buf[2])) % chars.length,
    );

    const upperLimit = String.fromCharCode(...buf);

    return [lowerLimit, upperLimit];
  };
}

export class Random {
  private seed: number;

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

  nextElement<T>(array: T[]) {
    return array[this.nextInt(0, array.length)];
  }

  generateArray<T>(
    length: number,
    generator: (index: number, rng: Random) => T,
  ) {
    return Array.from({ length }, (_, index) => generator(index, this));
  }

  private next() {
    if (process.env.JS_ENV_CUSTOM_RANDOM == "true") {
      let x = Math.sin(this.seed) * 99999;
      this.seed = x;
      x = x - Math.floor(x);
      return x;
    } else {
      return Math.random();
    }
  }

  skip(n: number) {
    for (let i = 0; i < n; i++) {
      this.next();
    }
  }
}

export const random = new Random(1);

export const setQueryParams = (
  params: Record<string, string>,
  url: URL = new URL(location.href),
) => {
  for (const k in params) {
    const v = params[k];
    url.searchParams.set(k, v);
  }
  return url;
};

export const base77 = base(chars); // compatible with firebase realtime database
export const base58 = base(
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
);
export const base32 = base("0123456789ABCDEFGHJKMNPQRSTVWXYZ");

export const generateUlid = () => Ulid.generate().bytes;

export const getTimestampFromUlid = (ulid: Uint8Array) =>
  Number(Ulid.construct(ulid).time);

export const generateUlidAsBase77 = () => base77.encode(generateUlid());

export const timestampToDatetimeInputString = (timestamp: number) =>
  new Date(timestamp + _getTimeZoneOffsetInMs()).toISOString().slice(0, 19);

export const _getTimeZoneOffsetInMs = () =>
  new Date().getTimezoneOffset() * -60 * 1000;

export const ulidStringify = (ulid: Uint8Array) =>
  Ulid.construct(ulid).toCanonical();

export const ulidFromString = (s: string) => Ulid.fromCanonical(s).bytes;

export const cacheBuster = (durationInSeconds: number) =>
  Math.floor(Date.now() / (durationInSeconds * 1000)) *
  (durationInSeconds * 1000);

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

export const tryCatchIfUndefine = <T,>(f: () => T) => {
  try {
    return f();
  } catch (err) {
    console.warn(err);
  }
};

// export const isDarkMode = van.state(store.get("darkMode") ?? false);

// van.derive(() => {
//   (document.getElementById("icon")! as HTMLLinkElement).href = isDarkMode.val
//     ? "/favicon-dark.svg"
//     : "/favicon.svg";

//   store.set("darkMode", isDarkMode.val);

//   const LIGHTMODE: Record<string, string> = {
//     "--primary-color": "white",
//     "--opposite-color": "black",
//     "--accent-color": "rgb(231, 231, 231)",
//     "--selected-color": "rgb(67, 67, 67);",
//     "--primary-accent-color": "rgb(245, 245, 245)",
//   } as const;

//   const DARKMODE: Record<string, string> = {
//     "--primary-color": "black",
//     "--opposite-color": "white",
//     "--accent-color": "rgb(67, 67, 67)",
//     "--selected-color": "rgb(67, 67, 67);",
//     "--primary-accent-color": "rgb(10, 10, 10)",
//   } as const;

//   for (const [key, value] of Object.entries(
//     isDarkMode.val ? DARKMODE : LIGHTMODE,
//   )) {
//     document.documentElement.style.setProperty(key, value);
//   }
//   console.log({ darkMode: isDarkMode.val });
// });

// export function ToggleDarkModeButton() {
//   return button(
//     {
//       class: "theme-button",
//       onclick: () => (isDarkMode.val = !isDarkMode.val),
//     },
//     () => (isDarkMode.val ? UiIcon("sun") : UiIcon("moon")),
//   );
// }

export function UiIcon(i: string | IconNode) {
  let icon: SVGElement;
  let className = "";
  if (typeof i == "string") {
    icon = getIcon(i)!;
    className = `lucid-${i}`;
  } else {
    icon = createElement(i as IconNode);
  }
  return van.tags.span({ class: className }, icon);
}

// export const windowSize = vanX.reactive({
//   width: window.innerWidth,
//   height: window.innerHeight,
// });

// export const isMobileResolution = van.derive(
//   () => windowSize.width <= MOBILE_MAX_WIDTH_PX,
// );

// window.addEventListener("resize", (_) => {
//   windowSize.height = window.innerHeight;
//   windowSize.width = window.innerWidth;
// });

export interface ResponseInit {
  status: number;
  statusText: string;
  body: Uint8Array;
  headers: {
    get(_: string): string | null;
  };
}

export const fetchWithProgress = (
  url: string | URL,
  method: string,
  headers: Record<string, string> = {},
  body: Blob | BufferSource | FormData | URLSearchParams | string | undefined,
  onUploadProgress: (sent: number, total: number) => void,
  onDownloadProgress: (received: number, total: number) => void,
): Promise<ResponseInit> => {
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
            get(s: string) {
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

export const sanitizeFilename = (input: string) =>
  input.replace(/[^a-zA-Z0-9-_.]/g, "_");

export const dateToRelativeString = (date: Date) => {
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
