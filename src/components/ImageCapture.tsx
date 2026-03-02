import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, X } from 'lucide-react';
import { compressImage } from '../utils/imageCompression';
import { logger } from '../utils/logger';

interface ImageCaptureProps {
  image: string | null;
  onImageReady: (base64: string) => void;
  onClear: () => void;
}

export const ImageCapture: React.FC<ImageCaptureProps> = ({ image, onImageReady, onClear }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
            reader.onload = async (event) => {
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

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Thiết bị không hỗ trợ camera. Vui lòng sử dụng tính năng Tải ảnh lên.");
        setIsCameraOpen(true);
        return;
      }
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      logger.error({ component: 'ImageCapture', action: 'startCamera' }, err);
      setCameraError("Không thể truy cập camera. Trên Android, hãy vào Cài đặt > Ứng dụng > Smart Meal Planner > Quyền > bật Camera. Trên trình duyệt, kiểm tra biểu tượng ổ khóa trên thanh địa chỉ.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setCameraError(null);
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
    <>
      {isCameraOpen ? (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
          {cameraError ? (
            <div className="text-center p-6 max-w-xs">
              <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6" />
              </div>
              <p className="text-white font-medium mb-6">{cameraError}</p>
              <button 
                onClick={stopCamera}
                className="bg-white text-slate-900 px-6 py-2 rounded-xl font-bold hover:bg-slate-100 transition-all"
              >
                Đóng camera
              </button>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover">
                <track kind="captions" />
              </video>
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute bottom-4 flex gap-4">
                <button 
                  onClick={stopCamera}
                  aria-label="Đóng camera"
                  className="bg-white/20 backdrop-blur text-white p-3 rounded-full hover:bg-white/30 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
                <button 
                  onClick={capturePhoto}
                  aria-label="Chụp ảnh"
                  className="bg-white text-emerald-600 p-4 rounded-full hover:bg-emerald-50 transition-all shadow-lg"
                >
                  <Camera className="w-8 h-8" />
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div 
          className={`border-2 border-dashed rounded-2xl overflow-hidden transition-all relative group ${
            image ? 'border-emerald-200 dark:border-emerald-700' : 'border-slate-200 dark:border-slate-600 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
          }`}
        >
          {image ? (
            <div className="relative aspect-video">
              <img src={image} alt="Uploaded dish" className="w-full h-full object-cover" />
              <button 
                onClick={onClear}
                className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-all"
              >
                Chọn ảnh khác
              </button>
            </div>
          ) : (
            <div className="w-full aspect-video flex flex-col items-center justify-center gap-4 text-slate-500 dark:text-slate-400 p-8">
              <div className="flex gap-4">
                <button 
                  onClick={startCamera}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                >
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center shadow-sm transition-all">
                    <Camera className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Chụp ảnh</span>
                </button>
                <div className="w-px bg-slate-200 dark:bg-slate-600 h-20 self-center"></div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center transition-all">
                    <Upload className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Tải ảnh lên</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">
                <span className="hidden sm:inline">Hoặc dán ảnh (Ctrl+V) trực tiếp vào đây<br/></span>Hỗ trợ JPG, PNG
              </p>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      )}
    </>
  );
};
