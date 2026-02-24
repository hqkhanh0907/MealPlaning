import React, { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, Image as ImageIcon, Sparkles, Camera, X, Save } from 'lucide-react';
import { analyzeDishImage } from '../services/geminiService';

export const AIImageAnalyzer: React.FC<{ onAnalysisComplete: (result: any) => void; onSave?: (result: any) => void }> = ({ onAnalysisComplete, onSave }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setImage(event.target?.result as string);
              setResult(null);
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập trên trình duyệt (biểu tượng ổ khóa/camera trên thanh địa chỉ) hoặc thử lại trên thiết bị khác.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setImage(dataUrl);
        setResult(null);
        stopCamera();
      }
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;

    try {
      setIsAnalyzing(true);
      
      // Extract base64 data and mime type
      const [header, base64Data] = image.split(',');
      const mimeType = header.split(':')[1].split(';')[0];

      const analysis = await analyzeDishImage(base64Data, mimeType);
      setResult(analysis);
      onAnalysisComplete(analysis);
    } catch (error: any) {
      console.error("Failed to analyze image:", error);
      alert("Có lỗi xảy ra khi phân tích ảnh. Vui lòng thử lại.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {isCameraOpen ? (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square sm:aspect-video flex items-center justify-center">
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
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute bottom-4 flex gap-4">
                    <button 
                      onClick={stopCamera}
                      className="bg-white/20 backdrop-blur text-white p-3 rounded-full hover:bg-white/30 transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={capturePhoto}
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
                image ? 'border-emerald-200' : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50'
              }`}
            >
              {image ? (
                <div className="relative aspect-square sm:aspect-video">
                  <img src={image} alt="Uploaded dish" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => {
                      setImage(null);
                      setResult(null);
                    }}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur text-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-white transition-all"
                  >
                    Chọn ảnh khác
                  </button>
                </div>
              ) : (
                <div className="w-full aspect-square sm:aspect-video flex flex-col items-center justify-center gap-4 text-slate-500 p-8">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-100 transition-all"
                    >
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-500" />
                      </div>
                      <span className="text-sm font-bold">Tải ảnh lên</span>
                    </button>
                    <div className="w-px bg-slate-200 h-20 self-center"></div>
                    <button 
                      onClick={startCamera}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-100 transition-all"
                    >
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                        <Camera className="w-6 h-6 text-slate-400 group-hover:text-emerald-500" />
                      </div>
                      <span className="text-sm font-bold">Chụp ảnh</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 text-center mt-2">
                    Hoặc dán ảnh (Ctrl+V) trực tiếp vào đây<br/>Hỗ trợ JPG, PNG
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

          <button
            onClick={handleAnalyze}
            disabled={!image || isAnalyzing || isCameraOpen}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white px-6 py-4 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang phân tích...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Phân tích món ăn
              </>
            )}
          </button>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
          {result ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">{result.name}</h3>
                <p className="text-slate-600 leading-relaxed">{result.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Ước tính Calo</p>
                  <p className="text-2xl font-bold text-orange-500">{result.totalNutrition?.calories} <span className="text-sm text-slate-500 font-medium">kcal</span></p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Ước tính Protein</p>
                  <p className="text-2xl font-bold text-blue-500">{result.totalNutrition?.protein} <span className="text-sm text-slate-500 font-medium">g</span></p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Ước tính Carbs</p>
                  <p className="text-2xl font-bold text-amber-500">{result.totalNutrition?.carbs} <span className="text-sm text-slate-500 font-medium">g</span></p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Ước tính Fat</p>
                  <p className="text-2xl font-bold text-rose-500">{result.totalNutrition?.fat} <span className="text-sm text-slate-500 font-medium">g</span></p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-3">Nguyên liệu chính nhận diện được:</h4>
                <div className="flex flex-wrap gap-2">
                  {result.ingredients.map((ing: any, idx: number) => (
                    <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                      {ing.name} <span className="text-slate-400 text-xs ml-1">({ing.amount} {ing.unit})</span>
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-sm text-indigo-800">
                <p className="font-bold mb-1">Lưu ý:</p>
                <p className="opacity-80">Kết quả phân tích chỉ mang tính chất tham khảo. Bạn có thể sử dụng thông tin này để thêm món ăn mới vào thư viện.</p>
              </div>

              {onSave && (
                <button 
                  onClick={() => onSave(result)}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Lưu vào thư viện món ăn
                </button>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-4">
              <ImageIcon className="w-16 h-16 opacity-20" />
              <p>Tải ảnh lên và nhấn "Phân tích món ăn"<br/>để xem thông tin dinh dưỡng</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
