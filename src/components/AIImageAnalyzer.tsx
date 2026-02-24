import React, { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, Image as ImageIcon, Sparkles, Camera, X, Save } from 'lucide-react';
import { analyzeDishImage, suggestIngredientInfo } from '../services/geminiService';
import { AnalyzedDishResult, AnalyzedIngredient, SaveAnalyzedDishPayload } from '../types';
import { normalizeUnit, calculateIngredientNutrition } from '../utils/nutrition';

export const AIImageAnalyzer: React.FC<{ onAnalysisComplete: (result: AnalyzedDishResult) => void; onSave?: (result: SaveAnalyzedDishPayload) => void }> = ({ onAnalysisComplete, onSave }) => {
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

    globalThis.addEventListener('paste', handlePaste);
    return () => globalThis.removeEventListener('paste', handlePaste);
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
    if (videoRef.current?.srcObject) {
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
      onAnalysisCompleteRef.current(analysis);
    } catch (error) {
      console.error("Failed to analyze image:", error);
      alert("Có lỗi xảy ra khi phân tích ảnh. Vui lòng thử lại.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [editedResult, setEditedResult] = useState<AnalyzedDishResult | null>(null);
  const [saveDish, setSaveDish] = useState(true);
  const [selectedIngredients, setSelectedIngredients] = useState<boolean[]>([]);
  const [researchingIngredientIndex, setResearchingIngredientIndex] = useState<number | null>(null);

  const handleOpenSaveModal = () => {
    if (result) {
      setEditedResult(structuredClone(result));
      setSaveDish(true);
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
      const finalIngredients = editedResult.ingredients.filter((_: AnalyzedIngredient, idx: number) => selectedIngredients[idx]);

      const payload = {
        ...editedResult,
        ingredients: finalIngredients,
        shouldCreateDish: saveDish
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
      alert("Không thể tìm thấy thông tin. Vui lòng thử lại.");
    } finally {
      setResearchingIngredientIndex(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
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
                image ? 'border-emerald-200' : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50'
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
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur text-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-white transition-all"
                  >
                    Chọn ảnh khác
                  </button>
                </div>
              ) : (
                <div className="w-full aspect-video flex flex-col items-center justify-center gap-4 text-slate-500 p-8">
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
                <h4 className="font-bold text-slate-800 mb-3">Chi tiết nguyên liệu & Dinh dưỡng:</h4>

                {/* Desktop: Table view */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-100">
                      <tr>
                        <th className="px-3 py-2 rounded-l-lg">Nguyên liệu</th>
                        <th className="px-3 py-2">Định lượng</th>
                        <th className="px-3 py-2">Calo</th>
                        <th className="px-3 py-2">Đạm</th>
                        <th className="px-3 py-2">Carbs</th>
                        <th className="px-3 py-2 rounded-r-lg">Béo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
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
                          <tr key={`desktop-${ing.name}-${idx}`} className="hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-2 font-medium text-slate-800">{ing.name}</td>
                            <td className="px-3 py-2 text-slate-600">{ing.amount} {ing.unit}</td>
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
                      <div key={`mobile-${ing.name}-${idx}`} className="bg-white p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-bold text-slate-800 text-sm">{ing.name}</p>
                          <span className="text-xs text-slate-500 font-medium">{ing.amount} {ing.unit}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Calo</p>
                            <p className="text-sm font-bold text-orange-500">{Math.round(n.calories)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Đạm</p>
                            <p className="text-sm font-bold text-blue-500">{Math.round(n.protein)}g</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Carbs</p>
                            <p className="text-sm font-bold text-amber-500">{Math.round(n.carbs)}g</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Béo</p>
                            <p className="text-sm font-bold text-rose-500">{Math.round(n.fat)}g</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-sm text-indigo-800">
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
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-4">
              <ImageIcon className="w-16 h-16 opacity-20" />
              <p>Tải ảnh lên và nhấn "Phân tích món ăn"<br/>để xem thông tin dinh dưỡng</p>
            </div>
          )}
        </div>
      </div>

      {isSaveModalOpen && editedResult && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-70">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-4xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col sm:mx-4">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-lg">Xác nhận lưu món ăn</h4>
              <button onClick={() => setIsSaveModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Dish Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h5 className="font-bold text-slate-800">Thông tin món ăn</h5>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={saveDish}
                      onChange={(e) => setSaveDish(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-slate-600">Lưu món ăn này</span>
                  </label>
                </div>
                
                {saveDish && (
                  <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <label htmlFor="ai-dish-name" className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tên món ăn</label>
                      <input
                        id="ai-dish-name"
                        value={editedResult.name}
                        onChange={e => setEditedResult({ ...editedResult, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all text-base sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="ai-dish-desc" className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Mô tả</label>
                      <textarea
                        id="ai-dish-desc"
                        value={editedResult.description}
                        onChange={e => setEditedResult({ ...editedResult, description: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all text-base sm:text-sm"
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Ingredients List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h5 className="font-bold text-slate-800">Chi tiết nguyên liệu</h5>
                  <button 
                    onClick={toggleAllIngredients}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    {selectedIngredients.every(Boolean) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>
                
                <div className="space-y-4">
                  {editedResult.ingredients.map((ing: AnalyzedIngredient, idx: number) => (
                    <div key={`edit-${ing.name}-${idx}`} className={`p-4 rounded-xl border transition-all ${selectedIngredients[idx] ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 opacity-60'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={selectedIngredients[idx]}
                            onChange={() => toggleIngredientSelection(idx)}
                            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-xs font-bold text-slate-400 uppercase">Nguyên liệu #{idx + 1}</span>
                        </div>
                        <button
                          onClick={() => handleResearchIngredient(idx)}
                          disabled={researchingIngredientIndex === idx || !selectedIngredients[idx]}
                          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all disabled:opacity-50"
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
                          <label htmlFor={`ai-ing-name-${idx}`} className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên</label>
                          <input
                            id={`ai-ing-name-${idx}`}
                            value={ing.name}
                            onChange={e => handleUpdateIngredient(idx, 'name', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none text-sm"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label htmlFor={`ai-ing-amount-${idx}`} className="block text-xs font-bold text-slate-500 uppercase mb-1">Số lượng</label>
                          <input
                            id={`ai-ing-amount-${idx}`}
                            type="number"
                            min="0"
                            value={ing.amount}
                            onChange={e => handleUpdateIngredient(idx, 'amount', Math.max(0, Number(e.target.value)))}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none text-sm"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label htmlFor={`ai-ing-unit-${idx}`} className="block text-xs font-bold text-slate-500 uppercase mb-1">Đơn vị</label>
                          <input
                            id={`ai-ing-unit-${idx}`}
                            value={ing.unit}
                            onChange={e => handleUpdateIngredient(idx, 'unit', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className={`mt-3 bg-white p-3 rounded-lg border border-slate-100 ${!selectedIngredients[idx] && 'pointer-events-none grayscale opacity-50'}`}>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Dinh dưỡng (cho 100g/ml hoặc 1 đơn vị)</p>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div>
                            <label htmlFor={`ai-ing-cal-${idx}`} className="text-[10px] text-slate-400 block mb-0.5">Calo</label>
                            <input
                              id={`ai-ing-cal-${idx}`}
                              type="number" min="0"
                              value={ing.nutritionPerStandardUnit.calories}
                              onChange={e => handleUpdateIngredient(idx, 'nutritionPerStandardUnit.calories', Math.max(0, Number(e.target.value)))}
                              className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor={`ai-ing-pro-${idx}`} className="text-[10px] text-slate-400 block mb-0.5">Protein</label>
                            <input
                              id={`ai-ing-pro-${idx}`}
                              type="number" min="0"
                              value={ing.nutritionPerStandardUnit.protein}
                              onChange={e => handleUpdateIngredient(idx, 'nutritionPerStandardUnit.protein', Math.max(0, Number(e.target.value)))}
                              className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor={`ai-ing-carbs-${idx}`} className="text-[10px] text-slate-400 block mb-0.5">Carbs</label>
                            <input
                              id={`ai-ing-carbs-${idx}`}
                              type="number" min="0"
                              value={ing.nutritionPerStandardUnit.carbs}
                              onChange={e => handleUpdateIngredient(idx, 'nutritionPerStandardUnit.carbs', Math.max(0, Number(e.target.value)))}
                              className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor={`ai-ing-fat-${idx}`} className="text-[10px] text-slate-400 block mb-0.5">Fat</label>
                            <input
                              id={`ai-ing-fat-${idx}`}
                              type="number" min="0"
                              value={ing.nutritionPerStandardUnit.fat}
                              onChange={e => handleUpdateIngredient(idx, 'nutritionPerStandardUnit.fat', Math.max(0, Number(e.target.value)))}
                              className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor={`ai-ing-fiber-${idx}`} className="text-[10px] text-slate-400 block mb-0.5">Fiber</label>
                            <input
                              id={`ai-ing-fiber-${idx}`}
                              type="number" min="0"
                              value={ing.nutritionPerStandardUnit.fiber}
                              onChange={e => handleUpdateIngredient(idx, 'nutritionPerStandardUnit.fiber', Math.max(0, Number(e.target.value)))}
                              className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsSaveModalOpen(false)}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-all"
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
