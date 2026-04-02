import { Camera, RotateCcw, Upload, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { compressImage } from '../utils/imageCompression';
import { logger } from '../utils/logger';

interface ImageCaptureProps {
  image: string | null;
  onImageReady: (base64: string) => void;
  onClear: () => void;
}

export const ImageCapture = ({ image, onImageReady, onClear }: ImageCaptureProps) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { t } = useTranslation();

  // Paste handler — allows Ctrl+V image input
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.includes('image')) {
          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = async event => {
              try {
                const compressed = await compressImage(event.target?.result as string);
                onImageReady(compressed);
              } catch {
                onImageReady(event.target?.result as string);
              }
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };

    globalThis.addEventListener('paste', handlePaste);
    return () => globalThis.removeEventListener('paste', handlePaste);
  }, [onImageReady]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          onImageReady(compressed);
        } catch {
          onImageReady(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async (mode?: 'environment' | 'user') => {
    const resolvedMode: 'environment' | 'user' = mode ?? facingMode;
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(t('imageCapture.noCameraSupport'));
        setIsCameraOpen(true);
        return;
      }
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: resolvedMode } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      logger.error({ component: 'ImageCapture', action: 'startCamera' }, err);
      setCameraError(t('imageCapture.cameraAccessDenied'));
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOpen(false);
    setCameraError(null);
  };

  const switchCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newMode } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      logger.error({ component: 'ImageCapture', action: 'switchCamera' }, err);
      setCameraError(t('imageCapture.cameraAccessDenied'));
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        try {
          const compressed = await compressImage(dataUrl);
          onImageReady(compressed);
        } catch {
          onImageReady(dataUrl);
        }
        stopCamera();
      }
    }
  };

  return (
    <div data-testid="image-capture">
      {isCameraOpen ? (
        <div
          className="pt-safe pb-safe fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
          data-testid="camera-overlay"
        >
          {cameraError ? (
            <div className="max-w-xs p-6 text-center">
              <div className="bg-destructive/20 text-destructive mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
                <X className="h-6 w-6" />
              </div>
              <p className="mb-6 font-medium text-white">{cameraError}</p>
              <button
                onClick={stopCamera}
                className="bg-card text-foreground hover:bg-accent rounded-xl px-6 py-2 font-bold transition-all"
              >
                {t('imageCapture.closeCamera')}
              </button>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover">
                <track kind="captions" />
              </video>
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute bottom-10 flex items-center gap-6">
                <button
                  onClick={stopCamera}
                  aria-label={t('imageCapture.closeCamera')}
                  className="focus-visible:ring-ring bg-card/20 hover:bg-card/30 flex min-h-12 min-w-12 items-center justify-center rounded-full p-3 text-white backdrop-blur transition-all focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <X className="h-6 w-6" />
                </button>
                <button
                  onClick={capturePhoto}
                  aria-label={t('imageCapture.takePhoto')}
                  className="focus-visible:ring-ring hover:bg-primary-subtle bg-card text-primary flex min-h-12 min-w-12 items-center justify-center rounded-full p-5 shadow-2xl transition-all focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <Camera className="h-9 w-9" />
                </button>
                <button
                  onClick={switchCamera}
                  aria-label={t('imageCapture.switchCamera')}
                  className="focus-visible:ring-ring bg-card/20 hover:bg-card/30 flex min-h-12 min-w-12 items-center justify-center rounded-full p-3 text-white backdrop-blur transition-all focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <RotateCcw className="h-6 w-6" />
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div
          className={`group relative overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
            image ? 'border-primary/20' : 'border-border hover:bg-primary-subtle hover:border-primary'
          }`}
        >
          {image ? (
            <div className="relative aspect-video">
              <img src={image} alt={t('imageCapture.uploadedDishAlt')} className="h-full w-full object-cover" />
              <button
                onClick={onClear}
                className="bg-card/90 text-foreground hover:bg-card absolute top-4 right-4 rounded-xl px-4 py-2 text-sm font-bold shadow-sm backdrop-blur transition-all"
              >
                {t('imageCapture.chooseAnother')}
              </button>
            </div>
          ) : (
            <div className="text-muted-foreground flex aspect-video w-full flex-col items-center justify-center gap-4 p-8">
              <div className="flex gap-4">
                {typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function' && (
                  <>
                    <button
                      onClick={() => startCamera()}
                      className="hover:bg-primary-subtle flex flex-col items-center gap-2 rounded-xl p-4 transition-all"
                    >
                      <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-full shadow-sm transition-all">
                        <Camera className="text-primary h-7 w-7" />
                      </div>
                      <span className="text-primary-emphasis text-sm font-bold">{t('imageCapture.takePhoto')}</span>
                    </button>
                    <div className="bg-muted h-20 w-px self-center dark:bg-slate-600"></div>
                  </>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="hover:bg-accent flex flex-col items-center gap-2 rounded-xl p-4 transition-all"
                >
                  <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full transition-all">
                    <Upload className="text-muted-foreground h-6 w-6" />
                  </div>
                  <span className="text-muted-foreground text-sm font-bold">{t('imageCapture.uploadImage')}</span>
                </button>
              </div>
              <p className="text-muted-foreground mt-2 text-center text-xs">
                <span className="hidden sm:inline">
                  {t('imageCapture.pasteHint')}
                  <br />
                </span>
                {t('imageCapture.supportedFormats')}
              </p>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            aria-label={t('imageCapture.uploadImage')}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};
