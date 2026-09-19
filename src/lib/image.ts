export async function fileToJpeg(
  file: File,
  maxSize = 1400,
  quality = 0.82
): Promise<{ blob: Blob; dataUrl: string; thumbnail: string }> {
  const bitmap = await loadImage(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nicht verfügbar.");
  ctx.fillStyle = "#f6f1e4";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, quality);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);

  const thumbScale = Math.min(1, 280 / Math.max(width, height));
  const thumb = document.createElement("canvas");
  thumb.width = Math.max(1, Math.round(width * thumbScale));
  thumb.height = Math.max(1, Math.round(height * thumbScale));
  const tctx = thumb.getContext("2d");
  if (!tctx) throw new Error("Canvas nicht verfügbar.");
  tctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
  const thumbnail = thumb.toDataURL("image/jpeg", 0.7);

  return { blob, dataUrl, thumbnail };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    const timer = window.setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error("Das Bild hat zu lange zum Laden gebraucht."));
    }, 8000);
    image.onload = () => {
      window.clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      URL.revokeObjectURL(url);
      reject(new Error("Das Bild konnte nicht gelesen werden."));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Bild konnte nicht komprimiert werden."));
      },
      "image/jpeg",
      quality
    );
  });
}
