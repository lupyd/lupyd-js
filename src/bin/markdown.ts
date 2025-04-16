import { micromark } from "micromark";
import { Extension, HtmlExtension } from "micromark-util-types";
import {
  gfmStrikethrough,
  gfmStrikethroughHtml,
} from "micromark-extension-gfm-strikethrough";
import van from "vanjs-core";
import { UiIcon, PickedFileUrl } from "./utils";

const { link, span, div, audio, video } = van.tags;

const mediaObserver = new IntersectionObserver(
  (e) => {
    e.forEach((v) => {
      const media = v.target as
        | HTMLVideoElement
        | HTMLAudioElement
        | HTMLImageElement;
      if (
        v.intersectionRatio !== 1 &&
        (media.tagName == "VIDEO" || media.tagName == "AUDIO") &&
        !(media as HTMLAudioElement | HTMLVideoElement).paused
      ) {
        (media as HTMLAudioElement | HTMLVideoElement).pause();
      }

      if (v.isIntersecting) {
        const src = media.getAttribute("data-src");
        if (src && media.src != src) {
          media.src = src;
        }
      }
    });
  },
  { threshold: 0.2 },
);

const micromarkExtensions = new Map<
  string,
  [() => Extension, () => HtmlExtension]
>();

micromarkExtensions.set("strike-through", [
  gfmStrikethrough,
  gfmStrikethroughHtml,
]);

export const syncMarkdownToHTMLElement = (
  markdown: string,
  pickedFileUrls: PickedFileUrl[],
) => {
  let modifiedMarkdown = markdown;

  for (const f of pickedFileUrls) {
    modifiedMarkdown = modifiedMarkdown.replaceAll(f.blobUrl, f.cdnUrl);
  }

  let extensions: Extension[] = [];
  let htmlExtensions: HtmlExtension[] = [];

  for (const [ext, htmlExt] of micromarkExtensions.values()) {
    extensions.push(ext());
    htmlExtensions.push(htmlExt());
  }

  const outputHTML = micromark(modifiedMarkdown, {
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
    (i as any as HTMLImageElement).loading = "lazy";
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
      mediaObserver.observe(videoEl);
    } else if (anchor.textContent && anchor.textContent.startsWith("|Audio|")) {
      const title = (anchor.textContent ?? "").replace("|Audio|", "");
      const audioEl = audio({
        title,
        controls: true,
        preload: "metadata",
      });
      audioEl.setAttribute("data-src", src);
      anchor.replaceWith(div({ class: "center" }, audioEl));
      mediaObserver.observe(audioEl);
    } else if (anchor.textContent && anchor.textContent.startsWith("|File|")) {
      let title = (anchor.textContent ?? "").replace("|File|", "");
      let size = "";
      const nextIndex = title.indexOf("|");
      if (nextIndex > 0) {
        size = title.slice(0, nextIndex);
        if (new RegExp(/[0-9]+(\.[0-9]+)?[KMGTP]?B/).test(size)) {
          title = title.slice(nextIndex + 1);
        } else {
          size = "";
        }
      }
      anchor.download = title;
      anchor.target = "_blank";
      anchor.classList.add("theme-anchor");
      anchor.replaceChildren(span(title), UiIcon("download"), span(size));
    } else {
      anchor.classList.add("theme-anchor");
      anchor.target = "_blank";
    }
  });

  return el;
};

const getMarkdownAsyncDependencies = (markdown: string) => {
  const promises = [];

  if (markdown.includes(" | ")) {
    const key = "gfm-table";
    if (!micromarkExtensions.has(key)) {
      promises.push(
        import("micromark-extension-gfm-table").then(
          ({ gfmTable, gfmTableHtml }) => {
            micromarkExtensions.set(key, [gfmTable, gfmTableHtml]);
          },
        ),
      );
    }
  }

  if (markdown.includes("$$")) {
    if (!document.body.querySelector("#katex-css")) {
      document.body.insertAdjacentElement(
        "afterbegin",
        link({
          rel: "stylesheet",
          href: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css",
          integrity:
            "sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+",
          crossOrigin: "anonymous",
          id: "katex-css",
        }),
      );
    }
    const key = "math";
    if (!micromarkExtensions.has(key)) {
      promises.push(
        import("micromark-extension-math").then(({ math, mathHtml }) => {
          micromarkExtensions.set(key, [math, mathHtml]);
        }),
      );
    }
  }
  return Promise.all(promises);
};

const asyncMarkdownToHTMLElement = (
  markdown: string,
  pickedFileUrls: PickedFileUrl[] = [],
): HTMLElement => {
  const el = van.state(syncMarkdownToHTMLElement(markdown, pickedFileUrls));
  getMarkdownAsyncDependencies(markdown).then((_) => {
    if (_.length > 0) {
      el.val = syncMarkdownToHTMLElement(markdown, pickedFileUrls);
    }
  });
  return div(() => el.val);
};

export const markdownToHtmlElement = (
  markdown: string,
  pickedFileUrls: PickedFileUrl[] = [],
): HTMLElement => {
  if (process.env.JS_ENV_MARKDOWN_MATH == "true") {
    return asyncMarkdownToHTMLElement(markdown, pickedFileUrls);
  } else {
    return syncMarkdownToHTMLElement(markdown, pickedFileUrls);
  }
};

export const ImagePreviewElement = (image: HTMLImageElement) => {
  const previewImageElement = image.cloneNode();

  const overlay = div({ class: "overlay show" }, previewImageElement);
  document.querySelector(".overlays")!.append(overlay);

  overlay.addEventListener("click", (_) => {
    overlay.remove();
  });
};
