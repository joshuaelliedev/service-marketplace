export type CompressImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  maxBytes?: number;
  initialQuality?: number;
  minQuality?: number;
};

const DEFAULTS = {
  maxWidth: 1600,
  maxHeight: 1600,
  maxBytes: 900_000,
  initialQuality: 0.82,
  minQuality: 0.55,
};

function fitInside(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not compress image"))),
      "image/jpeg",
      quality,
    );
  });
}

/** Resize and compress a photo before KYC upload (browser only). */
export async function compressImageForUpload(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files can be uploaded");
  }

  const opts = { ...DEFAULTS, ...options };
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const target = fitInside(bitmap.width, bitmap.height, opts.maxWidth, opts.maxHeight);

  const alreadySmall =
    file.size <= opts.maxBytes &&
    target.width === bitmap.width &&
    target.height === bitmap.height &&
    file.type === "image/jpeg";
  if (alreadySmall) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not process image");
  }
  ctx.drawImage(bitmap, 0, 0, target.width, target.height);
  bitmap.close();

  let quality = opts.initialQuality;
  let blob = await canvasToJpegBlob(canvas, quality);
  while (blob.size > opts.maxBytes && quality > opts.minQuality) {
    quality = Math.max(opts.minQuality, quality - 0.08);
    blob = await canvasToJpegBlob(canvas, quality);
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "kyc-image";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
