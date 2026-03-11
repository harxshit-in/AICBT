import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Use the standard worker from the same package version
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface PDFPageImage {
  base64: string;
  mimeType: string;
  pageNum: number;
}

export async function renderPDFToImages(
  file: File,
  onProgress?: (percent: number, current: number, total: number) => void
): Promise<PDFPageImage[]> {
  const url = URL.createObjectURL(file);
  try {
    const pdf = await pdfjsLib.getDocument(url).promise;
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
  } finally {
    URL.revokeObjectURL(url);
  }
}
