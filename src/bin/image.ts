import van from "vanjs-core";

const { canvas } = van.tags;

export const readFileAsDataUrl = (blob: File | Blob): Promise<string> => {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (result && typeof result === "string") {
        res(result);
      } else {
        rej(`Invalid result type or failed to load image`);
      }
    };
    reader.readAsDataURL(blob);
  });
};

export const convertImageToWebp = (
  src: string,
  maxWidth: number = Number.MAX_SAFE_INTEGER,
  maxHeight: number = Number.MAX_SAFE_INTEGER,
): Promise<Blob> => {
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
        } else {
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

      imageCanvas.toBlob((blob: Blob | null) => {
        if (blob === null) {
          rej(new Error("Blob is null"));
        } else {
          res(blob);
        }
      }, "image/webp");
    };
    image.src = src;
  });
};
