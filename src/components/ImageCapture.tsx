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
                className="rounded-xl bg-white px-6 py-2 font-bold text-slate-900 transition-all hover:bg-slate-100"
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
                  className="focus-visible:ring-ring flex min-h-12 min-w-12 items-center justify-center rounded-full bg-white/20 p-3 text-white backdrop-blur transition-all hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <X className="h-6 w-6" />
                </button>
                <button
                  onClick={capturePhoto}
                  aria-label={t('imageCapture.takePhoto')}
                  className="focus-visible:ring-ring flex min-h-12 min-w-12 items-center justify-center rounded-full bg-white p-5 text-emerald-600 shadow-2xl transition-all hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <Camera className="h-9 w-9" />
                </button>
                <button
                  onClick={switchCamera}
                  aria-label={t('imageCapture.switchCamera')}
                  className="focus-visible:ring-ring flex min-h-12 min-w-12 items-center justify-center rounded-full bg-white/20 p-3 text-white backdrop-blur transition-all hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-offset-2"
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
            image
              ? 'border-emerald-200 dark:border-emerald-700'
              : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 dark:border-slate-600 dark:hover:bg-emerald-900/20'
          }`}
        >
          {image ? (
            <div className="relative aspect-video">
              <img src={image} alt={t('imageCapture.uploadedDishAlt')} className="h-full w-full object-cover" />
              <button
                onClick={onClear}
                className="bg-card/90 absolute top-4 right-4 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition-all hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
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
                      className="flex flex-col items-center gap-2 rounded-xl p-4 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 shadow-sm transition-all dark:bg-emerald-900/30">
                        <Camera className="text-primary h-7 w-7" />
                      </div>
                      <span className="text-sm font-bold text-emerald-700">{t('imageCapture.takePhoto')}</span>
                    </button>
                    <div className="h-20 w-px self-center bg-slate-200 dark:bg-slate-600"></div>
                  </>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 rounded-xl p-4 transition-all hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 transition-all dark:bg-slate-700">
                    <Upload className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                  </div>
                  <span className="text-muted-foreground text-sm font-bold">{t('imageCapture.uploadImage')}</span>
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
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
