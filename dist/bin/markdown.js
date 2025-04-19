"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImagePreviewElement = exports.markdownToHtmlElement = exports.syncMarkdownToHTMLElement = void 0;
const micromark_1 = require("micromark");
const micromark_extension_gfm_strikethrough_1 = require("micromark-extension-gfm-strikethrough");
const vanjs_core_1 = require("vanjs-core");
const utils_1 = require("./utils");
const { link, span, div, audio, video } = vanjs_core_1.default.tags;
let _mediaObserver = null;
if (typeof window != undefined && "IntersectionObserver" in window) {
    _mediaObserver = new IntersectionObserver((e) => {
        e.forEach((v) => {
            const media = v.target;
            if (v.intersectionRatio !== 1 &&
                (media.tagName == "VIDEO" || media.tagName == "AUDIO") &&
                !media.paused) {
                media.pause();
            }
            if (v.isIntersecting) {
                const src = media.getAttribute("data-src");
                if (src && media.src != src) {
                    media.src = src;
                }
            }
        });
    }, { threshold: 0.2 });
}
const micromarkExtensions = new Map();
micromarkExtensions.set("strike-through", [
    micromark_extension_gfm_strikethrough_1.gfmStrikethrough,
    micromark_extension_gfm_strikethrough_1.gfmStrikethroughHtml,
]);
const syncMarkdownToHTMLElement = (markdown, pickedFileUrls) => {
    let modifiedMarkdown = markdown;
    for (const f of pickedFileUrls) {
        modifiedMarkdown = modifiedMarkdown.replaceAll(f.blobUrl, f.cdnUrl);
    }
    let extensions = [];
    let htmlExtensions = [];
    for (const [ext, htmlExt] of micromarkExtensions.values()) {
        extensions.push(ext());
        htmlExtensions.push(htmlExt());
    }
    const outputHTML = (0, micromark_1.micromark)(modifiedMarkdown, {
        allowDangerousHtml: false,
        allowDangerousProtocol: false,
        extensions,
        htmlExtensions,
    });
    let finalHtml = outputHTML;
    for (const f of pickedFileUrls) {
        finalHtml = finalHtml.replaceAll(f.cdnUrl, f.blobUrl);
    }
    const el = div({ innerHTML: finalHtml, class: "lupyd-markdown" });
    Array.from(el.querySelectorAll("img")).forEach((i) => {
        i.loading = "lazy";
        i.replaceWith(div({ class: "center" }, i.cloneNode()));
    });
    el.querySelectorAll("a").forEach((anchor) => {
        const src = anchor.href;
        if (anchor.textContent && anchor.textContent.startsWith("|Video|")) {
            const title = (anchor.textContent ?? "").replace("|Video|", "");
            const videoEl = video({
                preload: "metadata",
                controls: true,
                title,
            });
            videoEl.setAttribute("data-src", src);
            anchor.replaceWith(div({ class: "center" }, videoEl));
            _mediaObserver?.observe(videoEl);
        }
        else if (anchor.textContent && anchor.textContent.startsWith("|Audio|")) {
            const title = (anchor.textContent ?? "").replace("|Audio|", "");
            const audioEl = audio({
                title,
                controls: true,
                preload: "metadata",
            });
            audioEl.setAttribute("data-src", src);
            anchor.replaceWith(div({ class: "center" }, audioEl));
            _mediaObserver?.observe(audioEl);
        }
        else if (anchor.textContent && anchor.textContent.startsWith("|File|")) {
            let title = (anchor.textContent ?? "").replace("|File|", "");
            let size = "";
            const nextIndex = title.indexOf("|");
            if (nextIndex > 0) {
                size = title.slice(0, nextIndex);
                if (new RegExp(/[0-9]+(\.[0-9]+)?[KMGTP]?B/).test(size)) {
                    title = title.slice(nextIndex + 1);
                }
                else {
                    size = "";
                }
            }
            anchor.download = title;
            anchor.target = "_blank";
            anchor.classList.add("theme-anchor");
            anchor.replaceChildren(span(title), (0, utils_1.UiIcon)("download"), span(size));
        }
        else {
            anchor.classList.add("theme-anchor");
            anchor.target = "_blank";
        }
    });
    return el;
};
exports.syncMarkdownToHTMLElement = syncMarkdownToHTMLElement;
const getMarkdownAsyncDependencies = (markdown) => {
    const promises = [];
    if (markdown.includes(" | ")) {
        const key = "gfm-table";
        if (!micromarkExtensions.has(key)) {
            promises.push(Promise.resolve().then(() => require("micromark-extension-gfm-table")).then(({ gfmTable, gfmTableHtml }) => {
                micromarkExtensions.set(key, [gfmTable, gfmTableHtml]);
            }));
        }
    }
    if (markdown.includes("$$")) {
        if (!document.body.querySelector("#katex-css")) {
            document.body.insertAdjacentElement("afterbegin", link({
                rel: "stylesheet",
                href: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css",
                integrity: "sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+",
                crossOrigin: "anonymous",
                id: "katex-css",
            }));
        }
        const key = "math";
        if (!micromarkExtensions.has(key)) {
            promises.push(Promise.resolve().then(() => require("micromark-extension-math")).then(({ math, mathHtml }) => {
                micromarkExtensions.set(key, [math, mathHtml]);
            }));
        }
    }
    return Promise.all(promises);
};
const asyncMarkdownToHTMLElement = (markdown, pickedFileUrls = []) => {
    const el = vanjs_core_1.default.state((0, exports.syncMarkdownToHTMLElement)(markdown, pickedFileUrls));
    getMarkdownAsyncDependencies(markdown).then((_) => {
        if (_.length > 0) {
            el.val = (0, exports.syncMarkdownToHTMLElement)(markdown, pickedFileUrls);
        }
    });
    return div(() => el.val);
};
const markdownToHtmlElement = (markdown, pickedFileUrls = []) => {
    if (process.env.JS_ENV_MARKDOWN_MATH == "true") {
        return asyncMarkdownToHTMLElement(markdown, pickedFileUrls);
    }
    else {
        return (0, exports.syncMarkdownToHTMLElement)(markdown, pickedFileUrls);
    }
};
exports.markdownToHtmlElement = markdownToHtmlElement;
const ImagePreviewElement = (image) => {
    const previewImageElement = image.cloneNode();
    const overlay = div({ class: "overlay show" }, previewImageElement);
    document.querySelector(".overlays").append(overlay);
    overlay.addEventListener("click", (_) => {
        overlay.remove();
    });
};
exports.ImagePreviewElement = ImagePreviewElement;
