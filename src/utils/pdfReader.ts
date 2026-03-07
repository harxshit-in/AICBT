import * as pdfjsLib from 'pdfjs-dist';

// Use the standard worker from the same package version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface PDFPageImage {
  base64: string;
  mimeType: string;
  pageNum: number;
}

export async function renderPDFToImages(
  file: File,
  onProgress?: (percent: number, current: number, total: number) => void
): Promise<PDFPageImage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images: PDFPageImage[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      images.push({
        base64: dataUrl.split(',')[1],
        mimeType: 'image/jpeg',
        pageNum: p,
      });
    }

    onProgress?.(Math.round((p / pdf.numPages) * 100), p, pdf.numPages);
  }

  return images;
}
