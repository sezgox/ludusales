import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxDimension = 2400;
const maxBytes = 2 * 1024 * 1024;
const webpQualities = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35];

export const scaledImageDimensions = (width: number, height: number): { width: number; height: number } => {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

@Injectable({ providedIn: 'root' })
export class ImageProcessingService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  async toUploadableWebp(file: File): Promise<Blob> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('La conversión de imágenes solo está disponible en el navegador.');
    }
    if (!allowedImageTypes.has(file.type)) {
      throw new Error('Selecciona una imagen JPEG, PNG o WebP.');
    }

    const sourceUrl = globalThis.URL.createObjectURL(file);

    try {
      const image = await this.loadImage(sourceUrl);
      const { width, height } = scaledImageDimensions(image.naturalWidth, image.naturalHeight);
      const canvas = this.document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('No se pudo preparar la imagen.');
      }

      context.drawImage(image, 0, 0, width, height);

      for (const quality of webpQualities) {
        const blob = await this.canvasToBlob(canvas, quality);

        if (blob.size <= maxBytes) {
          return blob;
        }
      }

      throw new Error('La imagen no puede reducirse por debajo de 2 MB.');
    } finally {
      globalThis.URL.revokeObjectURL(sourceUrl);
    }
  }

  private loadImage(sourceUrl: string): Promise<HTMLImageElement> {
    const image = this.document.createElement('img');

    return new Promise((resolve, reject) => {
      image.addEventListener('load', () => resolve(image), { once: true });
      image.addEventListener('error', () => reject(new Error('No se pudo leer la imagen seleccionada.')), { once: true });
      image.src = sourceUrl;
    });
  }

  private canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error('El navegador no pudo convertir la imagen a WebP.'));
      }, 'image/webp', quality);
    });
  }
}
