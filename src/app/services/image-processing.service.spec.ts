import { TestBed } from '@angular/core/testing';
import { ImageProcessingService, scaledImageDimensions } from './image-processing.service';

describe('ImageProcessingService', () => {
  it('rejects unsupported image formats before decoding them', async () => {
    const service = TestBed.inject(ImageProcessingService);
    const file = new File(['image'], 'prize.gif', { type: 'image/gif' });
    await expect(service.toUploadableWebp(file)).rejects.toThrow('JPEG, PNG o WebP');
  });

  it('preserves proportions while limiting the largest dimension to 2400 pixels', () => {
    expect(scaledImageDimensions(4800, 3200)).toEqual({ width: 2400, height: 1600 });
    expect(scaledImageDimensions(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
