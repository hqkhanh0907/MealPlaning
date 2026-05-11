import { Injectable, InjectionToken, inject } from '@angular/core';
import { Camera, CameraResultType, CameraSource, type Photo } from '@capacitor/camera';

export interface CapturedImage {
  readonly data: string;
  readonly mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface CameraPluginLike {
  getPhoto(options: {
    quality: number;
    allowEditing: boolean;
    resultType: CameraResultType.Base64;
    source: CameraSource.Camera;
    width: number;
    height: number;
  }): Promise<Photo>;
}

export const CAMERA_PLUGIN = new InjectionToken<CameraPluginLike>('CAMERA_PLUGIN', {
  providedIn: 'root',
  factory: () => Camera,
});

@Injectable({ providedIn: 'root' })
export class CameraCapture {
  private readonly camera = inject(CAMERA_PLUGIN);

  async captureMealPhoto(): Promise<CapturedImage> {
    const photo = await this.camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      width: 1024,
      height: 1024,
    });
    if (!photo.base64String) {
      throw new Error('CameraCapture: camera returned no image data.');
    }
    return {
      data: photo.base64String,
      mimeType: mimeFromFormat(photo.format),
    };
  }
}

function mimeFromFormat(format: string | undefined): CapturedImage['mimeType'] {
  switch (format) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}
