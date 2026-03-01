import React, { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, Image as ImageIcon, Sparkles, Camera, X, Save } from 'lucide-react';
import { analyzeDishImage, suggestIngredientInfo } from '../services/geminiService';
import { AnalyzedDishResult, AnalyzedIngredient, SaveAnalyzedDishPayload, MealType } from '../types';
import { normalizeUnit, calculateIngredientNutrition } from '../utils/nutrition';
import { useNotification } from '../contexts/NotificationContext';
import { useModalBackHandler } from '../hooks/useModalBackHandler';
import { compressImage } from '../utils/imageCompression';

const AI_TAG_OPTIONS: { type: MealType; label: string; icon: string }[] = [
  { type: 'breakfast', label: 'Sáng', icon: '🌅' },
  { type: 'lunch', label: 'Trưa', icon: '🌤️' },
  { type: 'dinner', label: 'Tối', icon: '🌙' },
];

export const AIImageAnalyzer: React.FC<{ onAnalysisComplete: (result: AnalyzedDishResult) => void; onSave?: (result: SaveAnalyzedDishPayload) => void }> = ({ onAnalysisComplete, onSave }) => {
  const notify = useNotification();
  // Use a ref to track the latest callback to avoid stale closures in async functions
  const onAnalysisCompleteRef = useRef(onAnalysisComplete);
  
  useEffect(() => {
    onAnalysisCompleteRef.current = onAnalysisComplete;
  }, [onAnalysisComplete]);

  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzedDishResult | null>(null);
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
        if (item.type.includes('image')) {
          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = async (event) => {
              try {
                const compressed = await compressImage(event.target?.result as string);
                setImage(compressed);
              } catch {
                setImage(event.target?.result as string);
              }
              setResult(null);
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };

    globalThis.addEventListener('paste', handlePaste);
    return () => globalThis.removeEventListener('paste', handlePaste);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          setImage(compressed);
          setResult(null);
        } catch {
          setImage(reader.result as string);
          setResult(null);
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
      console.error("Error accessing camera:", err);
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
          setImage(compressed);
        } catch {
          setImage(dataUrl);
        }
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
      onAnalysisCompleteRef.current(analysis);
    } catch (error) {
      console.error("Failed to analyze image:", error);
      notify.error('Phân tích thất bại', 'Có lỗi xảy ra khi phân tích ảnh. Vui lòng thử lại.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [editedResult, setEditedResult] = useState<AnalyzedDishResult | null>(null);
  const [saveDish, setSaveDish] = useState(true);
  const [dishTags, setDishTags] = useState<MealType[]>([]);
  const [tagError, setTagError] = useState<string | null>(null);

  // Mobile back gesture handler
  useModalBackHandler(isSaveModalOpen, () => setIsSaveModalOpen(false));

  const toggleDishTag = (type: MealType) => {
    setDishTags(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    setTagError(null);
  };

  const [selectedIngredients, setSelectedIngredients] = useState<boolean[]>([]);
  const [researchingIngredientIndex, setResearchingIngredientIndex] = useState<number | null>(null);

  const handleOpenSaveModal = () => {
    if (result) {
      setEditedResult(structuredClone(result));
      setSaveDish(true);
      setDishTags([]);
      setTagError(null);
      setSelectedIngredients(new Array(result.ingredients.length).fill(true));
      setIsSaveModalOpen(true);
    }
  };

  const handleUpdateIngredient = (index: number, field: string, value: string | number) => {
    if (!editedResult) return;
    const newIngredients: AnalyzedIngredient[] = [...editedResult.ingredients];
    const current = newIngredients[index];

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'nutritionPerStandardUnit') {
        newIngredients[index] = {
          ...current,
          nutritionPerStandardUnit: {
            ...current.nutritionPerStandardUnit,
            [child]: value,
          },
        };
      }
    } else {
      newIngredients[index] = {
        ...current,
        [field]: value,
      } as AnalyzedIngredient;
    }
    setEditedResult({ ...editedResult, ingredients: newIngredients });
  };

  const handleConfirmSave = () => {
    if (onSave && editedResult) {
      // Validate tags when saving as dish
      if (saveDish && dishTags.length === 0) {
        setTagError('Vui lòng chọn ít nhất một bữa ăn phù hợp');
        return;
      }

      const finalIngredients = editedResult.ingredients.filter((_: AnalyzedIngredient, idx: number) => selectedIngredients[idx]);

      const payload: SaveAnalyzedDishPayload = {
        ...editedResult,
        ingredients: finalIngredients,
        shouldCreateDish: saveDish,
        tags: saveDish ? dishTags : undefined,
      };
      
      onSave(payload);
      setIsSaveModalOpen(false);
    }
  };

  const toggleIngredientSelection = (index: number) => {
    const newSelection = [...selectedIngredients];
    newSelection[index] = !newSelection[index];
    setSelectedIngredients(newSelection);
  };

  const toggleAllIngredients = () => {
    const allSelected = selectedIngredients.every(Boolean);
    setSelectedIngredients(new Array(selectedIngredients.length).fill(!allSelected));
  };

  const handleResearchIngredient = async (index: number) => {
    const ingredient = editedResult.ingredients[index];
    if (!ingredient.name) return;

    try {
      setResearchingIngredientIndex(index);
      const info = await suggestIngredientInfo(ingredient.name, ingredient.unit);
      
      // Update nutrition
      const newIngredients = [...editedResult.ingredients];
      newIngredients[index] = {
        ...newIngredients[index],
        nutritionPerStandardUnit: {
          calories: info.calories,
          protein: info.protein,
          carbs: info.carbs,
          fat: info.fat,
          fiber: info.fiber
        }
      };
      setEditedResult({ ...editedResult, ingredients: newIngredients });
      
    } catch (error) {
      console.error("Failed to research ingredient:", error);
      notify.error('Tra cứu thất bại', 'Không thể tìm thấy thông tin. Vui lòng thử lại.');
    } finally {
      setResearchingIngredientIndex(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
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
                image ? 'border-emerald-200 dark:border-emerald-700' : 'border-slate-200 dark:border-slate-600 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
              }`}
            >
              {image ? (
                <div className="relative aspect-video">
                  <img src={image} alt="Uploaded dish" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => {
                      setImage(null);
                      setResult(null);
                    }}
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

        <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-6 border border-slate-100 dark:border-slate-600">
          {isAnalyzing ? (
            <div className="space-y-6 animate-pulse">
              <div>
                <div className="h-7 bg-slate-200 rounded-lg w-2/3 mb-3" />
                <div className="h-4 bg-slate-200 rounded w-full mb-1.5" />
                <div className="h-4 bg-slate-200 rounded w-4/5" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm">
                    <div className="h-3 bg-slate-200 rounded w-16 mb-2" />
                    <div className="h-7 bg-slate-200 rounded w-20" />
                  </div>
                ))}
              </div>
              <div>
                <div className="h-5 bg-slate-200 rounded w-48 mb-3" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 dark:border-slate-600 flex justify-between">
                      <div className="h-4 bg-slate-200 rounded w-24" />
                      <div className="h-4 bg-slate-200 rounded w-16" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center text-sm text-slate-500 font-medium">
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                AI đang phân tích hình ảnh...
              </div>
            </div>
          ) : result ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{result.name}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{result.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Ước tính Calo</p>
                  <p className="text-2xl font-bold text-orange-500">{result.totalNutrition?.calories} <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">kcal</span></p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Ước tính Protein</p>
                  <p className="text-2xl font-bold text-blue-500">{result.totalNutrition?.protein} <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">g</span></p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Ước tính Carbs</p>
                  <p className="text-2xl font-bold text-amber-500">{result.totalNutrition?.carbs} <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">g</span></p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Ước tính Fat</p>
                  <p className="text-2xl font-bold text-rose-500">{result.totalNutrition?.fat} <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">g</span></p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-3">Chi tiết nguyên liệu & Dinh dưỡng:</h4>

                {/* Desktop: Table view */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800">
                      <tr>
                        <th className="px-3 py-2 rounded-l-lg">Nguyên liệu</th>
                        <th className="px-3 py-2">Định lượng</th>
                        <th className="px-3 py-2">Calo</th>
                        <th className="px-3 py-2">Đạm</th>
                        <th className="px-3 py-2">Carbs</th>
                        <th className="px-3 py-2 rounded-r-lg">Béo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-600">
                      {result.ingredients.map((ing: AnalyzedIngredient, idx: number) => {
                        const tempIngredient = {
                          id: '', name: ing.name, unit: normalizeUnit(ing.unit),
                          caloriesPer100: ing.nutritionPerStandardUnit.calories,
                          proteinPer100: ing.nutritionPerStandardUnit.protein,
                          carbsPer100: ing.nutritionPerStandardUnit.carbs,
                          fatPer100: ing.nutritionPerStandardUnit.fat,
                          fiberPer100: ing.nutritionPerStandardUnit.fiber,
                        };
                        const n = calculateIngredientNutrition(tempIngredient, ing.amount);
                        return (
                          <tr key={`desktop-${ing.name}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                            <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{ing.name}</td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{ing.amount} {ing.unit}</td>
                            <td className="px-3 py-2 font-medium text-orange-500">{Math.round(n.calories)}</td>
                            <td className="px-3 py-2 font-medium text-blue-500">{Math.round(n.protein)}</td>
                            <td className="px-3 py-2 font-medium text-amber-500">{Math.round(n.carbs)}</td>
                            <td className="px-3 py-2 font-medium text-rose-500">{Math.round(n.fat)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: Card list view */}
                <div className="sm:hidden space-y-3">
                  {result.ingredients.map((ing: AnalyzedIngredient, idx: number) => {
                    const tempIngredient = {
                      id: '', name: ing.name, unit: normalizeUnit(ing.unit),
                      caloriesPer100: ing.nutritionPerStandardUnit.calories,
                      proteinPer100: ing.nutritionPerStandardUnit.protein,
                      carbsPer100: ing.nutritionPerStandardUnit.carbs,
                      fatPer100: ing.nutritionPerStandardUnit.fat,
                      fiberPer100: ing.nutritionPerStandardUnit.fiber,
                    };
                    const n = calculateIngredientNutrition(tempIngredient, ing.amount);
                    return (
                      <div key={`mobile-${ing.name}-${idx}`} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{ing.name}</p>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{ing.amount} {ing.unit}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Calo</p>
                            <p className="text-sm font-bold text-orange-500">{Math.round(n.calories)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Đạm</p>
                            <p className="text-sm font-bold text-blue-500">{Math.round(n.protein)}g</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Carbs</p>
                            <p className="text-sm font-bold text-amber-500">{Math.round(n.carbs)}g</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Béo</p>
                            <p className="text-sm font-bold text-rose-500">{Math.round(n.fat)}g</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800 text-sm text-indigo-800 dark:text-indigo-300">
                <p className="font-bold mb-1">Lưu ý:</p>
                <p className="opacity-80">Kết quả phân tích chỉ mang tính chất tham khảo. Bạn có thể sử dụng thông tin này để thêm món ăn mới vào thư viện.</p>
              </div>

              {onSave && (
                <button 
                  onClick={handleOpenSaveModal}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Lưu vào thư viện món ăn
                </button>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center space-y-4">
              <ImageIcon className="w-16 h-16 opacity-20" />
              <p>Tải ảnh lên và nhấn "Phân tích món ăn"<br/>để xem thông tin dinh dưỡng</p>
            </div>
          )}
        </div>
      </div>

      {isSaveModalOpen && editedResult && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-70">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-4xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col sm:mx-4">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Xác nhận lưu món ăn</h4>
              <button onClick={() => setIsSaveModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Dish Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                  <h5 className="font-bold text-slate-800 dark:text-slate-100">Thông tin món ăn</h5>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={saveDish}
                      onChange={(e) => setSaveDish(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Lưu món ăn này</span>
                  </label>
                </div>
                
                {saveDish && (
                  <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <label htmlFor="ai-dish-name" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Tên món ăn</label>
                      <input
                        id="ai-dish-name"
                        value={editedResult.name}
                        onChange={e => setEditedResult({ ...editedResult, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none transition-all text-base sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label htmlFor="ai-dish-desc" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Mô tả</label>
                      <textarea
                        id="ai-dish-desc"
                        value={editedResult.description}
                        onChange={e => setEditedResult({ ...editedResult, description: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none transition-all text-base sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                        rows={2}
                      />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                        Bữa ăn phù hợp <span className="text-rose-500">*</span>
                      </span>
                      <div className="flex gap-2">
                        {AI_TAG_OPTIONS.map(opt => {
                          const isActive = dishTags.includes(opt.type);
                          return (
                            <button
                              key={opt.type}
                              type="button"
                              onClick={() => toggleDishTag(opt.type)}
                              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all min-h-11 ${
                                isActive
                                  ? 'bg-emerald-500 text-white shadow-sm'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300'
                              }`}
                            >
                              {opt.icon} {opt.label}
                            </button>
                          );
                        })}
                      </div>
                      {tagError && (
                        <p className="text-xs text-rose-500 mt-1.5 font-medium">{tagError}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Ingredients List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                  <h5 className="font-bold text-slate-800 dark:text-slate-100">Chi tiết nguyên liệu</h5>
                  <button
                    onClick={toggleAllIngredients}
                    className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors"
                  >
                    {selectedIngredients.every(Boolean) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>
                
                <div className="space-y-4">
                  {editedResult.ingredients.map((ing: AnalyzedIngredient, idx: number) => (
                    <div key={`edit-${ing.name}-${idx}`} className={`p-4 rounded-xl border transition-all ${selectedIngredients[idx] ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 opacity-60'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={selectedIngredients[idx]}
                            onChange={() => toggleIngredientSelection(idx)}
                            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Nguyên liệu #{idx + 1}</span>
                        </div>
                        <button
                          onClick={() => handleResearchIngredient(idx)}
                          disabled={researchingIngredientIndex === idx || !selectedIngredients[idx]}
                          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all disabled:opacity-50"
                        >
                          {researchingIngredientIndex === idx ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          AI Research
                        </button>
                      </div>
                      
                      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${!selectedIngredients[idx] && 'pointer-events-none grayscale'}`}>
                        <div className="md:col-span-1">
                          <label htmlFor={`ai-ing-name-${idx}`} className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tên</label>
                          <input
                            id={`ai-ing-name-${idx}`}
                            value={ing.name}
                            onChange={e => handleUpdateIngredient(idx, 'name', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label htmlFor={`ai-ing-amount-${idx}`} className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Số lượng</label>
                          <input
                            id={`ai-ing-amount-${idx}`}
                            type="number"
                            min="0"
                            value={ing.amount}
                            onChange={e => handleUpdateIngredient(idx, 'amount', Math.max(0, Number(e.target.value)))}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label htmlFor={`ai-ing-unit-${idx}`} className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Đơn vị</label>
                          <input
                            id={`ai-ing-unit-${idx}`}
                            value={ing.unit}
                            onChange={e => handleUpdateIngredient(idx, 'unit', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                          />
                        </div>
                      </div>
                      
                      <div className={`mt-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-600 ${!selectedIngredients[idx] && 'pointer-events-none grayscale opacity-50'}`}>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Dinh dưỡng (cho 100g/ml hoặc 1 đơn vị)</p>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div>
                            <label htmlFor={`ai-ing-cal-${idx}`} className="text-[10px] text-slate-400 dark:text-slate-500 block mb-0.5">Calo</label>
                            <input
                              id={`ai-ing-cal-${idx}`}
                              type="number" min="0"
                              value={ing.nutritionPerStandardUnit.calories}
                              onChange={e => handleUpdateIngredient(idx, 'nutritionPerStandardUnit.calories', Math.max(0, Number(e.target.value)))}
                              className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label htmlFor={`ai-ing-pro-${idx}`} className="text-[10px] text-slate-400 dark:text-slate-500 block mb-0.5">Protein</label>
                            <input
                              id={`ai-ing-pro-${idx}`}
                              type="number" min="0"
                              value={ing.nutritionPerStandardUnit.protein}
                              onChange={e => handleUpdateIngredient(idx, 'nutritionPerStandardUnit.protein', Math.max(0, Number(e.target.value)))}
                              className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label htmlFor={`ai-ing-carbs-${idx}`} className="text-[10px] text-slate-400 dark:text-slate-500 block mb-0.5">Carbs</label>
                            <input
                              id={`ai-ing-carbs-${idx}`}
                              type="number" min="0"
                              value={ing.nutritionPerStandardUnit.carbs}
                              onChange={e => handleUpdateIngredient(idx, 'nutritionPerStandardUnit.carbs', Math.max(0, Number(e.target.value)))}
                              className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label htmlFor={`ai-ing-fat-${idx}`} className="text-[10px] text-slate-400 dark:text-slate-500 block mb-0.5">Fat</label>
                            <input
                              id={`ai-ing-fat-${idx}`}
                              type="number" min="0"
                              value={ing.nutritionPerStandardUnit.fat}
                              onChange={e => handleUpdateIngredient(idx, 'nutritionPerStandardUnit.fat', Math.max(0, Number(e.target.value)))}
                              className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label htmlFor={`ai-ing-fiber-${idx}`} className="text-[10px] text-slate-400 dark:text-slate-500 block mb-0.5">Fiber</label>
                            <input
                              id={`ai-ing-fiber-${idx}`}
                              type="number" min="0"
                              value={ing.nutritionPerStandardUnit.fiber}
                              onChange={e => handleUpdateIngredient(idx, 'nutritionPerStandardUnit.fiber', Math.max(0, Number(e.target.value)))}
                              className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleConfirmSave}
                className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold shadow-sm shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Xác nhận lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
