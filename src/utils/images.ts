// Tiny shared image-loading helpers for stamping institutional logos onto
// generated reports/snapshots (PDF cover page, PNG map export) — both
// consumers need a real HTMLImageElement (for canvas drawImage) or a
// re-encoded PNG data URL (jsPDF.addImage doesn't reliably accept .webp),
// so this lives here instead of being duplicated in each report composable.
export function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

export async function loadImageAsPngDataUrl(url: string): Promise<{ dataUrl: string; width: number; height: number }> {
  const img = await loadImageElement(url);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');
  ctx.drawImage(img, 0, 0);
  return { dataUrl: canvas.toDataURL('image/png'), width: img.naturalWidth, height: img.naturalHeight };
}
