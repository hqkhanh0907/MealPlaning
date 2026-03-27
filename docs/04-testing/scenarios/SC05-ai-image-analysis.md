# Scenario 5: AI Image Analysis

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 210

---

## Mô tả tổng quan

AI Image Analysis cho phép user chụp ảnh hoặc upload ảnh món ăn → AI (Gemini 2.0 Flash) phân tích → trả về: tên món, danh sách nguyên liệu ước tính, nutrition estimate. User có thể save kết quả thành dish mới trong hệ thống. Sub-tab thứ 2 trong AI Analysis tab.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| AIImageAnalysis | AIImageAnalysis.tsx | Main image analysis UI |
| SaveAnalyzedDishModal | SaveAnalyzedDishModal.tsx | Save result as dish |
| geminiService | services/geminiService.ts | Vision API call |
| useImageAnalysis | hooks/useImageAnalysis.ts | State & logic |

## Luồng nghiệp vụ

1. User opens AI tab → switches to Image Analysis sub-tab
2. User captures photo or selects from gallery
3. Image preview shown → user confirms
4. System sends image to Gemini Vision API
5. AI returns: dish name, ingredients (name, amount, unit), nutrition estimate
6. User reviews result → edits if needed
7. User saves as new dish → ingredients auto-created
8. Dish available in system for meal planning

## Quy tắc nghiệp vụ

1. Image max size: 10MB (configurable)
2. Supported formats: JPEG, PNG, WebP
3. Image compressed before API call (quality 0.8)
4. AI response validated before display
5. Save creates both dish and any new ingredients
6. Existing ingredient matched by name (case-insensitive)
7. User can edit AI result before saving

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_AIA_01 | Image Analysis sub-tab hiển thị | Positive | P1 |
| TC_AIA_02 | Camera capture button | Positive | P1 |
| TC_AIA_03 | Gallery upload button | Positive | P1 |
| TC_AIA_04 | Image preview after capture | Positive | P1 |
| TC_AIA_05 | Image preview after upload | Positive | P1 |
| TC_AIA_06 | Retake/re-select option | Positive | P1 |
| TC_AIA_07 | Analyze button enabled after image | Positive | P1 |
| TC_AIA_08 | Analyze button disabled without image | Negative | P1 |
| TC_AIA_09 | Loading state during analysis | Positive | P1 |
| TC_AIA_10 | AI returns dish name | Positive | P0 |
| TC_AIA_11 | AI returns ingredients list | Positive | P0 |
| TC_AIA_12 | AI returns nutrition estimate | Positive | P0 |
| TC_AIA_13 | Result display layout | Positive | P1 |
| TC_AIA_14 | Edit dish name before save | Positive | P1 |
| TC_AIA_15 | Edit ingredient before save | Positive | P1 |
| TC_AIA_16 | Add ingredient to result | Positive | P1 |
| TC_AIA_17 | Remove ingredient from result | Positive | P1 |
| TC_AIA_18 | Edit nutrition values | Positive | P2 |
| TC_AIA_19 | Save analyzed dish button | Positive | P0 |
| TC_AIA_20 | Save → dish created in system | Positive | P0 |
| TC_AIA_21 | Save → ingredients auto-created | Positive | P0 |
| TC_AIA_22 | Save → existing ingredient matched | Positive | P1 |
| TC_AIA_23 | SaveAnalyzedDishModal opens | Positive | P1 |
| TC_AIA_24 | Modal pre-filled with AI data | Positive | P1 |
| TC_AIA_25 | Modal edit fields | Positive | P1 |
| TC_AIA_26 | Modal save confirmation | Positive | P1 |
| TC_AIA_27 | Modal cancel | Positive | P1 |
| TC_AIA_28 | Success notification after save | Positive | P1 |
| TC_AIA_29 | JPEG image upload | Positive | P1 |
| TC_AIA_30 | PNG image upload | Positive | P1 |
| TC_AIA_31 | WebP image upload | Positive | P1 |
| TC_AIA_32 | GIF image rejected | Negative | P2 |
| TC_AIA_33 | SVG image rejected | Negative | P2 |
| TC_AIA_34 | Image < 100KB | Positive | P2 |
| TC_AIA_35 | Image = 5MB | Positive | P2 |
| TC_AIA_36 | Image = 10MB (max) | Boundary | P1 |
| TC_AIA_37 | Image > 10MB rejected | Negative | P1 |
| TC_AIA_38 | Image compression applied | Positive | P2 |
| TC_AIA_39 | Very small image (50x50px) | Edge | P2 |
| TC_AIA_40 | Very large image (8000x6000px) | Boundary | P2 |
| TC_AIA_41 | Portrait orientation | Positive | P2 |
| TC_AIA_42 | Landscape orientation | Positive | P2 |
| TC_AIA_43 | Square image | Positive | P2 |
| TC_AIA_44 | Rotated EXIF image | Edge | P2 |
| TC_AIA_45 | No API key → disabled | Negative | P0 |
| TC_AIA_46 | Invalid API key → error | Negative | P0 |
| TC_AIA_47 | Network error during analysis | Negative | P0 |
| TC_AIA_48 | API timeout | Negative | P1 |
| TC_AIA_49 | Rate limit exceeded | Negative | P1 |
| TC_AIA_50 | Invalid response from AI | Negative | P1 |
| TC_AIA_51 | Empty response | Edge | P1 |
| TC_AIA_52 | Partial response (name only) | Edge | P1 |
| TC_AIA_53 | Non-food image | Edge | P1 |
| TC_AIA_54 | Blurry image | Edge | P2 |
| TC_AIA_55 | Dark/underexposed image | Edge | P2 |
| TC_AIA_56 | Multiple dishes in one image | Edge | P2 |
| TC_AIA_57 | Text-heavy image (menu photo) | Edge | P2 |
| TC_AIA_58 | Empty plate image | Edge | P2 |
| TC_AIA_59 | Packaged food with label | Edge | P2 |
| TC_AIA_60 | Raw ingredients image | Edge | P2 |
| TC_AIA_61 | Dish name duplicate in system | Edge | P1 |
| TC_AIA_62 | Ingredient name case mismatch | Edge | P2 |
| TC_AIA_63 | Ingredient with accent marks | Edge | P2 |
| TC_AIA_64 | Save dish → appears in management tab | Positive | P0 |
| TC_AIA_65 | Save dish → available for meal planning | Positive | P0 |
| TC_AIA_66 | Save dish → nutrition calculated | Positive | P1 |
| TC_AIA_67 | Save dish → ingredients in ingredient list | Positive | P1 |
| TC_AIA_68 | Saved dish editable later | Positive | P1 |
| TC_AIA_69 | Multiple analyses without save | Positive | P2 |
| TC_AIA_70 | Analyze → discard → analyze new | Positive | P1 |
| TC_AIA_71 | Camera permission denied | Negative | P1 |
| TC_AIA_72 | Gallery permission denied | Negative | P1 |
| TC_AIA_73 | Camera not available (desktop) | Edge | P2 |
| TC_AIA_74 | File picker on desktop | Positive | P2 |
| TC_AIA_75 | Drag & drop image (desktop) | Positive | P3 |
| TC_AIA_76 | Paste image from clipboard | Positive | P3 |
| TC_AIA_77 | Dark mode image analysis UI | Positive | P2 |
| TC_AIA_78 | Mobile layout | Positive | P2 |
| TC_AIA_79 | Desktop layout | Positive | P2 |
| TC_AIA_80 | i18n labels | Positive | P2 |
| TC_AIA_81 | Loading progress indicator | Positive | P2 |
| TC_AIA_82 | Cancel analysis in progress | Positive | P1 |
| TC_AIA_83 | Retry failed analysis | Positive | P1 |
| TC_AIA_84 | Error message descriptive | Positive | P1 |
| TC_AIA_85 | Result card expandable | Positive | P2 |
| TC_AIA_86 | Nutrition badge on result | Positive | P2 |
| TC_AIA_87 | Image zoom on preview | Positive | P2 |
| TC_AIA_88 | Image crop before analysis | Positive | P3 |
| TC_AIA_89 | Analysis history | Positive | P3 |
| TC_AIA_90 | Quick save (no edit) | Positive | P2 |
| TC_AIA_91 | Save & add to plan directly | Positive | P2 |
| TC_AIA_92 | Analysis result share | Positive | P3 |
| TC_AIA_93 | Copy result text | Positive | P3 |
| TC_AIA_94 | Malicious image file | Security | P1 |
| TC_AIA_95 | XSS in AI response | Security | P0 |
| TC_AIA_96 | Memory cleanup after large image | Boundary | P2 |
| TC_AIA_97 | Consecutive analyses memory | Boundary | P2 |
| TC_AIA_98 | Screen reader for results | Positive | P3 |
| TC_AIA_99 | Keyboard navigation | Positive | P3 |
| TC_AIA_100 | Touch gestures on result | Positive | P3 |
| TC_AIA_101 | Undo save (delete saved dish) | Positive | P2 |
| TC_AIA_102 | AI confidence score display | Positive | P3 |
| TC_AIA_103 | Low confidence warning | Positive | P3 |
| TC_AIA_104 | Vietnamese dish recognition | Positive | P1 |
| TC_AIA_105 | International dish recognition | Positive | P2 |
| TC_AIA_106 | Initial state image=null result=null | Positive | P1 |
| TC_AIA_107 | Step indicators 1-2-3 no image | Positive | P2 |
| TC_AIA_108 | Step indicators ẩn khi có image | Positive | P2 |
| TC_AIA_109 | handleImageReady set image clear result | Positive | P1 |
| TC_AIA_110 | handleClearImage reset image result | Positive | P1 |
| TC_AIA_111 | handleAnalyze guard no image | Edge | P1 |
| TC_AIA_112 | handleAnalyze parse base64 mimeType | Positive | P1 |
| TC_AIA_113 | handleAnalyze isAnalyzing=true before | Positive | P1 |
| TC_AIA_114 | handleAnalyze isAnalyzing=false finally | Positive | P1 |
| TC_AIA_115 | handleAnalyze success setResult | Positive | P0 |
| TC_AIA_116 | handleAnalyze NotFoodImageError warn | Positive | P1 |
| TC_AIA_117 | handleAnalyze generic error notify | Positive | P1 |
| TC_AIA_118 | onAnalysisCompleteRef avoids stale | Positive | P2 |
| TC_AIA_119 | Analyze button disabled no image | Negative | P1 |
| TC_AIA_120 | Analyze button disabled isAnalyzing | Negative | P1 |
| TC_AIA_121 | Analyze button loading Loader2 | Positive | P1 |
| TC_AIA_122 | Analyze button normal Sparkles | Positive | P2 |
| TC_AIA_123 | Grid 1col mobile 2col desktop | Positive | P2 |
| TC_AIA_124 | data-testid ai-image-analyzer | Positive | P2 |
| TC_AIA_125 | Logger error khi analyze fails | Positive | P2 |
| TC_AIA_126 | SaveModal mở isSaveModalOpen=true | Positive | P0 |
| TC_AIA_127 | editedResult clone từ result | Positive | P1 |
| TC_AIA_128 | Edit dish name trong modal | Positive | P1 |
| TC_AIA_129 | Edit dish description trong modal | Positive | P1 |
| TC_AIA_130 | toggleDishTag thêm bỏ meal type | Positive | P1 |
| TC_AIA_131 | Tag breakfast toggle | Positive | P2 |
| TC_AIA_132 | Tag lunch toggle | Positive | P2 |
| TC_AIA_133 | Tag dinner toggle | Positive | P2 |
| TC_AIA_134 | saveDish=true require ≥1 tag | Positive | P1 |
| TC_AIA_135 | saveDish=false tags optional | Edge | P2 |
| TC_AIA_136 | tagError no tags + saveDish | Negative | P1 |
| TC_AIA_137 | tagError clear khi thêm tag | Positive | P1 |
| TC_AIA_138 | selectedIngredients boolean array | Positive | P1 |
| TC_AIA_139 | toggleIngredientSelection check | Positive | P1 |
| TC_AIA_140 | toggleAllIngredients select all | Positive | P1 |
| TC_AIA_141 | toggleAllIngredients deselect all | Positive | P1 |
| TC_AIA_142 | handleUpdateIngredient name | Positive | P2 |
| TC_AIA_143 | handleUpdateIngredient amount | Positive | P2 |
| TC_AIA_144 | handleUpdateIngredient unit | Positive | P2 |
| TC_AIA_145 | handleUpdateIngredient nutrition | Positive | P1 |
| TC_AIA_146 | handleResearchIngredient AI call | Positive | P1 |
| TC_AIA_147 | Research ingredient loading state | Positive | P2 |
| TC_AIA_148 | Research success fill nutrition | Positive | P1 |
| TC_AIA_149 | Research failure error notification | Negative | P1 |
| TC_AIA_150 | numericStrings prevent snap-back | Positive | P2 |
| TC_AIA_151 | handleConfirmSave validate tags | Positive | P1 |
| TC_AIA_152 | handleConfirmSave filter selected | Positive | P1 |
| TC_AIA_153 | handleConfirmSave call onSave | Positive | P0 |
| TC_AIA_154 | hasSubmittedRef prevent double | Edge | P1 |
| TC_AIA_155 | Display unit 100g for g/kg | Positive | P2 |
| TC_AIA_156 | Display unit 100ml for ml/l | Positive | P2 |
| TC_AIA_157 | Display unit 1 custom for others | Positive | P2 |
| TC_AIA_158 | Modal close callback | Positive | P1 |
| TC_AIA_159 | Modal dark mode styling | Positive | P2 |
| TC_AIA_160 | Modal scroll many ingredients | Positive | P2 |
| TC_AIA_161 | ImageCapture buttons render | Positive | P1 |
| TC_AIA_162 | Camera capture trigger device | Positive | P1 |
| TC_AIA_163 | Gallery upload file picker | Positive | P1 |
| TC_AIA_164 | Preview after capture | Positive | P1 |
| TC_AIA_165 | Preview after upload | Positive | P1 |
| TC_AIA_166 | Clear button xóa preview | Positive | P1 |
| TC_AIA_167 | onImageReady base64 callback | Positive | P1 |
| TC_AIA_168 | onClear callback trigger | Positive | P1 |
| TC_AIA_169 | Image compression before display | Positive | P2 |
| TC_AIA_170 | Base64 format data:image/jpeg | Positive | P2 |
| TC_AIA_171 | Multiple selection chỉ nhận 1 | Edge | P2 |
| TC_AIA_172 | Cancel file picker no action | Edge | P2 |
| TC_AIA_173 | File type validation | Positive | P1 |
| TC_AIA_174 | Camera not available hide button | Edge | P2 |
| TC_AIA_175 | File picker accept images only | Positive | P2 |
| TC_AIA_176 | Placeholder result=null not analyzing | Positive | P1 |
| TC_AIA_177 | Loading skeleton isAnalyzing | Positive | P1 |
| TC_AIA_178 | Result dish name display | Positive | P0 |
| TC_AIA_179 | Result description display | Positive | P1 |
| TC_AIA_180 | Result ingredients list | Positive | P0 |
| TC_AIA_181 | Result nutrition estimate | Positive | P0 |
| TC_AIA_182 | Save button khi result + onSave | Positive | P1 |
| TC_AIA_183 | Save button ẩn no onSave | Edge | P2 |
| TC_AIA_184 | Save button ẩn no result | Edge | P2 |
| TC_AIA_185 | Ingredient name amount unit | Positive | P1 |
| TC_AIA_186 | Nutrition badge per ingredient | Positive | P2 |
| TC_AIA_187 | Total nutrition summary | Positive | P1 |
| TC_AIA_188 | Result view dark mode | Positive | P2 |
| TC_AIA_189 | Result view responsive | Positive | P2 |
| TC_AIA_190 | onOpenSaveModal trigger | Positive | P1 |
| TC_AIA_191 | analyzeDishImage base64 mimeType | Positive | P1 |
| TC_AIA_192 | analyzeDishImage AnalyzedDishResult | Positive | P0 |
| TC_AIA_193 | isAnalyzedDishResult validator | Positive | P1 |
| TC_AIA_194 | isAnalyzedDishResult missing field | Negative | P1 |
| TC_AIA_195 | NotFoodImageError isFood=false | Positive | P1 |
| TC_AIA_196 | analyzeDishImage timeout | Negative | P1 |
| TC_AIA_197 | analyzeDishImage retry network | Positive | P1 |
| TC_AIA_198 | analyzeDishImage no retry validation | Positive | P2 |
| TC_AIA_199 | analyzeDishImage signal cancel | Positive | P1 |
| TC_AIA_200 | suggestIngredientInfo lookup | Positive | P1 |
| TC_AIA_201 | suggestIngredientInfo cache hit | Positive | P2 |
| TC_AIA_202 | suggestIngredientInfo cache miss | Positive | P2 |
| TC_AIA_203 | isIngredientSuggestion validator | Positive | P2 |
| TC_AIA_204 | Large image 5MB base64 | Boundary | P2 |
| TC_AIA_205 | Corrupted base64 error | Negative | P1 |
| TC_AIA_206 | Full flow capture analyze save | Positive | P0 |
| TC_AIA_207 | Full flow upload edit save plan | Positive | P0 |
| TC_AIA_208 | Analyze close reopen state reset | Positive | P1 |
| TC_AIA_209 | Save dish nutrition cascade | Positive | P1 |
| TC_AIA_210 | Concurrent analyses latest only | Edge | P1 |

---

## Chi tiết Test Cases

##### TC_AIA_01–08: Initial State & Image Input
- TC_AIA_01: Sub-tab visible and clickable
- TC_AIA_02-03: Camera and gallery buttons present and functional
- TC_AIA_04-05: Image preview correct after capture/upload
- TC_AIA_06: Can retake/re-select image
- TC_AIA_07-08: Analyze button enabled/disabled based on image
- **Kết quả test thực tế**: | — |


##### TC_AIA_09–28: Happy Path
- TC_AIA_09: Loading spinner during API call
- TC_AIA_10-12: AI returns complete result (name, ingredients, nutrition)
- TC_AIA_13: Result laid out cleanly
- TC_AIA_14-18: Edit capabilities (name, ingredient, add/remove, nutrition)
- TC_AIA_19-28: Save flow (modal, pre-fill, edit, confirm, cancel, notification)
- **Kết quả test thực tế**: | — |


##### TC_AIA_29–44: Image Format & Size
- TC_AIA_29-33: Supported/unsupported formats
- TC_AIA_34-40: Size boundaries
- TC_AIA_41-44: Orientations and EXIF
- **Kết quả test thực tế**: | — |


##### TC_AIA_45–60: Error Handling & Edge Cases
- TC_AIA_45-52: API errors (no key, invalid key, network, timeout, rate limit, invalid/empty/partial response)
- TC_AIA_53-60: Unusual images (non-food, blurry, dark, multiple dishes, text, empty plate, packaged, raw)
- **Kết quả test thực tế**: | — |


##### TC_AIA_61–70: Save Integration
- TC_AIA_61-63: Naming edge cases (duplicate, case, accents)
- TC_AIA_64-68: Post-save verification (management, planning, nutrition, ingredients, editable)
- TC_AIA_69-70: Multiple analyses flow
- **Kết quả test thực tế**: | — |


##### TC_AIA_71–76: Platform-Specific
- TC_AIA_71-72: Permission denied
- TC_AIA_73-76: Desktop alternatives (file picker, drag-drop, paste)
- **Kết quả test thực tế**: | — |


##### TC_AIA_77–93: UI/UX
- Dark mode, responsive, i18n, loading, cancel, retry, error messages, card interactions, zoom, crop, history, quick save, share, copy
- **Kết quả test thực tế**: | — |


##### TC_AIA_94–105: Security, Performance & Accessibility
- Malicious file, XSS, memory, screen reader, keyboard, touch, undo, confidence, Vietnamese/international recognition

---
- **Kết quả test thực tế**: | — |


##### TC_AIA_106–125: AIImageAnalyzer Component

##### TC_AIA_106: Initial state image=null result=null
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Initial state image=null result=null
  3. Verify kết quả đúng như expected
- **Expected Result**: Initial state image=null result=null — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_107: Step indicators 1-2-3 no image
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Step indicators 1-2-3 no image
  3. Verify kết quả đúng như expected
- **Expected Result**: Step indicators 1-2-3 no image — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_108: Step indicators ẩn khi có image
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Step indicators ẩn khi có image
  3. Verify kết quả đúng như expected
- **Expected Result**: Step indicators ẩn khi có image — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_109: handleImageReady set image clear result
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: handleImageReady set image clear result
  3. Verify kết quả đúng như expected
- **Expected Result**: handleImageReady set image clear result — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_110: handleClearImage reset image result
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: handleClearImage reset image result
  3. Verify kết quả đúng như expected
- **Expected Result**: handleClearImage reset image result — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_111: handleAnalyze guard no image
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: handleAnalyze guard no image
  3. Verify kết quả đúng như expected
- **Expected Result**: handleAnalyze guard no image — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_AIA_112: handleAnalyze parse base64 mimeType
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: handleAnalyze parse base64 mimeType
  3. Verify kết quả đúng như expected
- **Expected Result**: handleAnalyze parse base64 mimeType — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_113: handleAnalyze isAnalyzing=true before
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: handleAnalyze isAnalyzing=true before
  3. Verify kết quả đúng như expected
- **Expected Result**: handleAnalyze isAnalyzing=true before — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_114: handleAnalyze isAnalyzing=false finally
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: handleAnalyze isAnalyzing=false finally
  3. Verify kết quả đúng như expected
- **Expected Result**: handleAnalyze isAnalyzing=false finally — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_115: handleAnalyze success setResult
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: handleAnalyze success setResult
  3. Verify kết quả đúng như expected
- **Expected Result**: handleAnalyze success setResult — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_116: handleAnalyze NotFoodImageError warn
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Thiết lập điều kiện: handleAnalyze NotFoodImageError warn
  2. Thử thực hiện action bị restrict
  3. Verify action bị chặn/disabled đúng
- **Expected Result**: handleAnalyze NotFoodImageError warn — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_117: handleAnalyze generic error notify
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Thiết lập điều kiện: handleAnalyze generic error notify
  2. Thử thực hiện action bị restrict
  3. Verify action bị chặn/disabled đúng
- **Expected Result**: handleAnalyze generic error notify — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_118: onAnalysisCompleteRef avoids stale
- **Pre-conditions**: AI Image Analysis tab active
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: onAnalysisCompleteRef avoids stale
  3. Verify kết quả đúng như expected
- **Expected Result**: onAnalysisCompleteRef avoids stale — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_119: Analyze button disabled no image
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Thiết lập điều kiện: Analyze button disabled no image
  2. Thử thực hiện action bị restrict
  3. Verify action bị chặn/disabled đúng
- **Expected Result**: Analyze button disabled no image — element bị disabled, user không thể tương tác, UI feedback rõ ràng
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_AIA_120: Analyze button disabled isAnalyzing
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Thiết lập điều kiện: Analyze button disabled isAnalyzing
  2. Thử thực hiện action bị restrict
  3. Verify action bị chặn/disabled đúng
- **Expected Result**: Analyze button disabled isAnalyzing — element bị disabled, user không thể tương tác, UI feedback rõ ràng
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_AIA_121: Analyze button loading Loader2
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Analyze button loading Loader2
  3. Verify kết quả đúng như expected
- **Expected Result**: Analyze button loading Loader2 — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_122: Analyze button normal Sparkles
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Analyze button normal Sparkles
  3. Verify kết quả đúng như expected
- **Expected Result**: Analyze button normal Sparkles — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_123: Grid 1col mobile 2col desktop
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Điều chỉnh viewport/device cho phù hợp
  2. Quan sát layout và styling
  3. Verify layout đúng theo breakpoint
- **Expected Result**: Grid 1col mobile 2col desktop — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_124: data-testid ai-image-analyzer
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: data-testid ai-image-analyzer
  3. Verify kết quả đúng như expected
- **Expected Result**: data-testid ai-image-analyzer — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_125: Logger error khi analyze fails
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Thiết lập điều kiện lỗi/edge case
  2. Trigger action gây lỗi
  3. Verify app xử lý gracefully, không crash
- **Expected Result**: Logger error khi analyze fails — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |


##### TC_AIA_126–160: SaveAnalyzedDishModal Deep Tests

##### TC_AIA_126: SaveModal mở isSaveModalOpen=true
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Navigate đến component chứa element cần test
  2. Click/tap vào element: SaveModal mở isSaveModalOpen=true
  3. Verify action được thực thi đúng
- **Expected Result**: SaveModal mở isSaveModalOpen=true — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_127: editedResult clone từ result
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: editedResult clone từ result
  3. Verify kết quả đúng như expected
- **Expected Result**: editedResult clone từ result — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_128: Edit dish name trong modal
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Edit dish name trong modal
  3. Verify kết quả đúng như expected
- **Expected Result**: Edit dish name trong modal — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_129: Edit dish description trong modal
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Edit dish description trong modal
  3. Verify kết quả đúng như expected
- **Expected Result**: Edit dish description trong modal — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_130: toggleDishTag thêm bỏ meal type
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Quan sát trạng thái ban đầu
  2. Thực hiện toggle/switch action
  3. Verify trạng thái đã thay đổi đúng
- **Expected Result**: toggleDishTag thêm bỏ meal type — trạng thái chuyển đổi đúng, UI phản ánh state mới
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_131: Tag breakfast toggle
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Quan sát trạng thái ban đầu
  2. Thực hiện toggle/switch action
  3. Verify trạng thái đã thay đổi đúng
- **Expected Result**: Tag breakfast toggle — trạng thái chuyển đổi đúng, UI phản ánh state mới
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_132: Tag lunch toggle
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Quan sát trạng thái ban đầu
  2. Thực hiện toggle/switch action
  3. Verify trạng thái đã thay đổi đúng
- **Expected Result**: Tag lunch toggle — trạng thái chuyển đổi đúng, UI phản ánh state mới
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_133: Tag dinner toggle
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Quan sát trạng thái ban đầu
  2. Thực hiện toggle/switch action
  3. Verify trạng thái đã thay đổi đúng
- **Expected Result**: Tag dinner toggle — trạng thái chuyển đổi đúng, UI phản ánh state mới
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_134: saveDish=true require ≥1 tag
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: saveDish=true require ≥1 tag
  3. Verify kết quả đúng như expected
- **Expected Result**: saveDish=true require ≥1 tag — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_135: saveDish=false tags optional
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: saveDish=false tags optional
  3. Verify kết quả đúng như expected
- **Expected Result**: saveDish=false tags optional — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_AIA_136: tagError no tags + saveDish
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Thiết lập điều kiện lỗi/edge case
  2. Trigger action gây lỗi
  3. Verify app xử lý gracefully, không crash
- **Expected Result**: tagError no tags + saveDish — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_AIA_137: tagError clear khi thêm tag
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Thiết lập điều kiện lỗi/edge case
  2. Trigger action gây lỗi
  3. Verify app xử lý gracefully, không crash
- **Expected Result**: tagError clear khi thêm tag — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_138: selectedIngredients boolean array
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: selectedIngredients boolean array
  3. Verify kết quả đúng như expected
- **Expected Result**: selectedIngredients boolean array — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_139: toggleIngredientSelection check
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Quan sát trạng thái ban đầu
  2. Thực hiện toggle/switch action
  3. Verify trạng thái đã thay đổi đúng
- **Expected Result**: toggleIngredientSelection check — trạng thái chuyển đổi đúng, UI phản ánh state mới
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_140: toggleAllIngredients select all
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Quan sát trạng thái ban đầu
  2. Thực hiện toggle/switch action
  3. Verify trạng thái đã thay đổi đúng
- **Expected Result**: toggleAllIngredients select all — trạng thái chuyển đổi đúng, UI phản ánh state mới
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_141: toggleAllIngredients deselect all
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Quan sát trạng thái ban đầu
  2. Thực hiện toggle/switch action
  3. Verify trạng thái đã thay đổi đúng
- **Expected Result**: toggleAllIngredients deselect all — trạng thái chuyển đổi đúng, UI phản ánh state mới
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_142: handleUpdateIngredient name
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Ghi nhận giá trị hiện tại
  2. Thực hiện thay đổi trigger update
  3. Verify giá trị mới đúng sau update
- **Expected Result**: handleUpdateIngredient name — data/UI cập nhật ngay lập tức, đồng bộ chính xác
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_143: handleUpdateIngredient amount
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Ghi nhận giá trị hiện tại
  2. Thực hiện thay đổi trigger update
  3. Verify giá trị mới đúng sau update
- **Expected Result**: handleUpdateIngredient amount — data/UI cập nhật ngay lập tức, đồng bộ chính xác
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_144: handleUpdateIngredient unit
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Ghi nhận giá trị hiện tại
  2. Thực hiện thay đổi trigger update
  3. Verify giá trị mới đúng sau update
- **Expected Result**: handleUpdateIngredient unit — data/UI cập nhật ngay lập tức, đồng bộ chính xác
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_145: handleUpdateIngredient nutrition
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Ghi nhận giá trị hiện tại
  2. Thực hiện thay đổi trigger update
  3. Verify giá trị mới đúng sau update
- **Expected Result**: handleUpdateIngredient nutrition — data/UI cập nhật ngay lập tức, đồng bộ chính xác
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_146: handleResearchIngredient AI call
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: handleResearchIngredient AI call
  3. Verify kết quả đúng như expected
- **Expected Result**: handleResearchIngredient AI call — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_147: Research ingredient loading state
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Research ingredient loading state
  3. Verify kết quả đúng như expected
- **Expected Result**: Research ingredient loading state — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_148: Research success fill nutrition
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Research success fill nutrition
  3. Verify kết quả đúng như expected
- **Expected Result**: Research success fill nutrition — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_149: Research failure error notification
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Thiết lập điều kiện: Research failure error notification
  2. Thử thực hiện action bị restrict
  3. Verify action bị chặn/disabled đúng
- **Expected Result**: Research failure error notification — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_AIA_150: numericStrings prevent snap-back
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: numericStrings prevent snap-back
  3. Verify kết quả đúng như expected
- **Expected Result**: numericStrings prevent snap-back — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_151: handleConfirmSave validate tags
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: handleConfirmSave validate tags
  3. Verify kết quả đúng như expected
- **Expected Result**: handleConfirmSave validate tags — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_152: handleConfirmSave filter selected
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: handleConfirmSave filter selected
  3. Verify kết quả đúng như expected
- **Expected Result**: handleConfirmSave filter selected — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_153: handleConfirmSave call onSave
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: handleConfirmSave call onSave
  3. Verify kết quả đúng như expected
- **Expected Result**: handleConfirmSave call onSave — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_154: hasSubmittedRef prevent double
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: hasSubmittedRef prevent double
  3. Verify kết quả đúng như expected
- **Expected Result**: hasSubmittedRef prevent double — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_AIA_155: Display unit 100g for g/kg
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Display unit 100g for g/kg
  3. Verify element visible và nội dung đúng
- **Expected Result**: Display unit 100g for g/kg — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_156: Display unit 100ml for ml/l
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Display unit 100ml for ml/l
  3. Verify element visible và nội dung đúng
- **Expected Result**: Display unit 100ml for ml/l — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_157: Display unit 1 custom for others
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Display unit 1 custom for others
  3. Verify element visible và nội dung đúng
- **Expected Result**: Display unit 1 custom for others — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_158: Modal close callback
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Mount component với initial props
  2. Trigger re-render với props không thay đổi
  3. Verify component không re-render không cần thiết
- **Expected Result**: Modal close callback — component đóng đúng, state cleanup, không memory leak
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_159: Modal dark mode styling
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Bật chế độ dark mode (nếu applicable)
  2. Quan sát colors và contrast
  3. Verify styling đúng theo design spec
- **Expected Result**: Modal dark mode styling — colors/contrast đúng trong dark mode, đọc được rõ ràng
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_160: Modal scroll many ingredients
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Modal scroll many ingredients
  3. Verify kết quả đúng như expected
- **Expected Result**: Modal scroll many ingredients — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |


##### TC_AIA_161–175: ImageCapture Component

##### TC_AIA_161: ImageCapture buttons render
- **Pre-conditions**: ImageCapture component render, camera/gallery available
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: ImageCapture buttons render
  3. Verify element visible và nội dung đúng
- **Expected Result**: ImageCapture buttons render — UI element hiển thị đúng, đầy đủ thông tin, không lỗi visual
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_162: Camera capture trigger device
- **Pre-conditions**: ImageCapture component render, camera/gallery available
- **Steps**:
  1. Navigate đến component chứa element cần test
  2. Click/tap vào element: Camera capture trigger device
  3. Verify action được thực thi đúng
- **Expected Result**: Camera capture trigger device — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_163: Gallery upload file picker
- **Pre-conditions**: ImageCapture component render, camera/gallery available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Gallery upload file picker
  3. Verify kết quả đúng như expected
- **Expected Result**: Gallery upload file picker — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_164: Preview after capture
- **Pre-conditions**: ImageCapture component render, camera/gallery available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Preview after capture
  3. Verify kết quả đúng như expected
- **Expected Result**: Preview after capture — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_165: Preview after upload
- **Pre-conditions**: ImageCapture component render, camera/gallery available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Preview after upload
  3. Verify kết quả đúng như expected
- **Expected Result**: Preview after upload — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_166: Clear button xóa preview
- **Pre-conditions**: ImageCapture component render, camera/gallery available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Clear button xóa preview
  3. Verify kết quả đúng như expected
- **Expected Result**: Clear button xóa preview — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_167: onImageReady base64 callback
- **Pre-conditions**: ImageCapture component render, camera/gallery available
- **Steps**:
  1. Mount component với initial props
  2. Trigger re-render với props không thay đổi
  3. Verify component không re-render không cần thiết
- **Expected Result**: onImageReady base64 callback — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_168: onClear callback trigger
- **Pre-conditions**: ImageCapture component render, camera/gallery available
- **Steps**:
  1. Navigate đến component chứa element cần test
  2. Click/tap vào element: onClear callback trigger
  3. Verify action được thực thi đúng
- **Expected Result**: onClear callback trigger — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_169: Image compression before display
- **Pre-conditions**: ImageCapture component render, camera/gallery available
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Image compression before display
  3. Verify element visible và nội dung đúng
- **Expected Result**: Image compression before display — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_170: Base64 format data:image/jpeg
- **Pre-conditions**: ImageCapture component render, camera/gallery available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Base64 format data:image/jpeg
  3. Verify kết quả đúng như expected
- **Expected Result**: Base64 format data:image/jpeg — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_171: Multiple selection chỉ nhận 1
- **Pre-conditions**: ImageCapture component render, camera/gallery available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Multiple selection chỉ nhận 1
  3. Verify kết quả đúng như expected
- **Expected Result**: Multiple selection chỉ nhận 1 — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_AIA_172: Cancel file picker no action
- **Pre-conditions**: ImageCapture component render, camera/gallery available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Cancel file picker no action
  3. Verify kết quả đúng như expected
- **Expected Result**: Cancel file picker no action — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_AIA_173: File type validation
- **Pre-conditions**: ImageCapture component render, camera/gallery available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: File type validation
  3. Verify kết quả đúng như expected
- **Expected Result**: File type validation — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_174: Camera not available hide button
- **Pre-conditions**: ImageCapture component render, camera/gallery available
- **Steps**:
  1. Thiết lập điều kiện: Camera not available hide button
  2. Thử thực hiện action bị restrict
  3. Verify action bị chặn/disabled đúng
- **Expected Result**: Camera not available hide button — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_AIA_175: File picker accept images only
- **Pre-conditions**: ImageCapture component render, camera/gallery available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: File picker accept images only
  3. Verify kết quả đúng như expected
- **Expected Result**: File picker accept images only — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |


##### TC_AIA_176–190: AnalysisResultView Component

##### TC_AIA_176: Placeholder result=null not analyzing
- **Pre-conditions**: AnalysisResultView render với/không result data
- **Steps**:
  1. Thiết lập điều kiện: Placeholder result=null not analyzing
  2. Thử thực hiện action bị restrict
  3. Verify action bị chặn/disabled đúng
- **Expected Result**: Placeholder result=null not analyzing — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_177: Loading skeleton isAnalyzing
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Loading skeleton isAnalyzing
  3. Verify kết quả đúng như expected
- **Expected Result**: Loading skeleton isAnalyzing — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_178: Result dish name display
- **Pre-conditions**: AnalysisResultView render với/không result data
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Result dish name display
  3. Verify element visible và nội dung đúng
- **Expected Result**: Result dish name display — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_179: Result description display
- **Pre-conditions**: AnalysisResultView render với/không result data
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Result description display
  3. Verify element visible và nội dung đúng
- **Expected Result**: Result description display — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_180: Result ingredients list
- **Pre-conditions**: AnalysisResultView render với/không result data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Result ingredients list
  3. Verify kết quả đúng như expected
- **Expected Result**: Result ingredients list — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_181: Result nutrition estimate
- **Pre-conditions**: AnalysisResultView render với/không result data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Result nutrition estimate
  3. Verify kết quả đúng như expected
- **Expected Result**: Result nutrition estimate — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_182: Save button khi result + onSave
- **Pre-conditions**: AnalysisResultView render với/không result data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Save button khi result + onSave
  3. Verify kết quả đúng như expected
- **Expected Result**: Save button khi result + onSave — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_183: Save button ẩn no onSave
- **Pre-conditions**: AnalysisResultView render với/không result data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Save button ẩn no onSave
  3. Verify kết quả đúng như expected
- **Expected Result**: Save button ẩn no onSave — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_AIA_184: Save button ẩn no result
- **Pre-conditions**: AnalysisResultView render với/không result data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Save button ẩn no result
  3. Verify kết quả đúng như expected
- **Expected Result**: Save button ẩn no result — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_AIA_185: Ingredient name amount unit
- **Pre-conditions**: AI Image Analysis tab active
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Ingredient name amount unit
  3. Verify kết quả đúng như expected
- **Expected Result**: Ingredient name amount unit — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_186: Nutrition badge per ingredient
- **Pre-conditions**: AnalysisResultView render với/không result data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Nutrition badge per ingredient
  3. Verify kết quả đúng như expected
- **Expected Result**: Nutrition badge per ingredient — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_187: Total nutrition summary
- **Pre-conditions**: AnalysisResultView render với/không result data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Total nutrition summary
  3. Verify kết quả đúng như expected
- **Expected Result**: Total nutrition summary — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_188: Result view dark mode
- **Pre-conditions**: AnalysisResultView render với/không result data
- **Steps**:
  1. Bật chế độ dark mode (nếu applicable)
  2. Quan sát colors và contrast
  3. Verify styling đúng theo design spec
- **Expected Result**: Result view dark mode — colors/contrast đúng trong dark mode, đọc được rõ ràng
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_189: Result view responsive
- **Pre-conditions**: AnalysisResultView render với/không result data
- **Steps**:
  1. Điều chỉnh viewport/device cho phù hợp
  2. Quan sát layout và styling
  3. Verify layout đúng theo breakpoint
- **Expected Result**: Result view responsive — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_190: onOpenSaveModal trigger
- **Pre-conditions**: SaveAnalyzedDishModal mở với AnalyzedDishResult từ AI analysis
- **Steps**:
  1. Navigate đến component chứa element cần test
  2. Click/tap vào element: onOpenSaveModal trigger
  3. Verify action được thực thi đúng
- **Expected Result**: onOpenSaveModal trigger — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |


##### TC_AIA_191–205: geminiService.analyzeDishImage

##### TC_AIA_191: analyzeDishImage base64 mimeType
- **Pre-conditions**: ImageCapture component render, camera/gallery available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: analyzeDishImage base64 mimeType
  3. Verify kết quả đúng như expected
- **Expected Result**: analyzeDishImage base64 mimeType — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_192: analyzeDishImage AnalyzedDishResult
- **Pre-conditions**: Test unit cho geminiService.analyzeDishImage, mock API
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: analyzeDishImage AnalyzedDishResult
  3. Verify kết quả đúng như expected
- **Expected Result**: analyzeDishImage AnalyzedDishResult — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_193: isAnalyzedDishResult validator
- **Pre-conditions**: Test unit cho geminiService.analyzeDishImage, mock API
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: isAnalyzedDishResult validator
  3. Verify kết quả đúng như expected
- **Expected Result**: isAnalyzedDishResult validator — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_194: isAnalyzedDishResult missing field
- **Pre-conditions**: Test unit cho geminiService.analyzeDishImage, mock API
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: isAnalyzedDishResult missing field
  3. Verify kết quả đúng như expected
- **Expected Result**: isAnalyzedDishResult missing field — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_AIA_195: NotFoodImageError isFood=false
- **Pre-conditions**: AIImageAnalyzer component mounted, chưa có image
- **Steps**:
  1. Thiết lập điều kiện: NotFoodImageError isFood=false
  2. Thử thực hiện action bị restrict
  3. Verify action bị chặn/disabled đúng
- **Expected Result**: NotFoodImageError isFood=false — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_196: analyzeDishImage timeout
- **Pre-conditions**: Test unit cho geminiService.analyzeDishImage, mock API
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: analyzeDishImage timeout
  3. Verify kết quả đúng như expected
- **Expected Result**: analyzeDishImage timeout — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_AIA_197: analyzeDishImage retry network
- **Pre-conditions**: Test unit cho geminiService.analyzeDishImage, mock API
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: analyzeDishImage retry network
  3. Verify kết quả đúng như expected
- **Expected Result**: analyzeDishImage retry network — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_198: analyzeDishImage no retry validation
- **Pre-conditions**: Test unit cho geminiService.analyzeDishImage, mock API
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: analyzeDishImage no retry validation
  3. Verify kết quả đúng như expected
- **Expected Result**: analyzeDishImage no retry validation — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_199: analyzeDishImage signal cancel
- **Pre-conditions**: Test unit cho geminiService.analyzeDishImage, mock API
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: analyzeDishImage signal cancel
  3. Verify kết quả đúng như expected
- **Expected Result**: analyzeDishImage signal cancel — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_200: suggestIngredientInfo lookup
- **Pre-conditions**: Test unit cho geminiService.analyzeDishImage, mock API
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: suggestIngredientInfo lookup
  3. Verify kết quả đúng như expected
- **Expected Result**: suggestIngredientInfo lookup — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_201: suggestIngredientInfo cache hit
- **Pre-conditions**: Test unit cho geminiService.analyzeDishImage, mock API
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: suggestIngredientInfo cache hit
  3. Verify kết quả đúng như expected
- **Expected Result**: suggestIngredientInfo cache hit — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_202: suggestIngredientInfo cache miss
- **Pre-conditions**: Test unit cho geminiService.analyzeDishImage, mock API
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: suggestIngredientInfo cache miss
  3. Verify kết quả đúng như expected
- **Expected Result**: suggestIngredientInfo cache miss — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_203: isIngredientSuggestion validator
- **Pre-conditions**: Test unit cho geminiService.analyzeDishImage, mock API
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: isIngredientSuggestion validator
  3. Verify kết quả đúng như expected
- **Expected Result**: isIngredientSuggestion validator — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_204: Large image 5MB base64
- **Pre-conditions**: ImageCapture component render, camera/gallery available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Large image 5MB base64
  3. Verify kết quả đúng như expected
- **Expected Result**: Large image 5MB base64 — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_AIA_205: Corrupted base64 error
- **Pre-conditions**: ImageCapture component render, camera/gallery available
- **Steps**:
  1. Thiết lập điều kiện lỗi/edge case
  2. Trigger action gây lỗi
  3. Verify app xử lý gracefully, không crash
- **Expected Result**: Corrupted base64 error — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |


##### TC_AIA_206–210: Integration & Boundary

##### TC_AIA_206: Full flow capture analyze save
- **Pre-conditions**: Full integration test: AIImageAnalyzer → Analysis → Save → System
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Full flow capture analyze save
  3. Verify kết quả đúng như expected
- **Expected Result**: Full flow capture analyze save — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_207: Full flow upload edit save plan
- **Pre-conditions**: Full integration test: AIImageAnalyzer → Analysis → Save → System
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Full flow upload edit save plan
  3. Verify kết quả đúng như expected
- **Expected Result**: Full flow upload edit save plan — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_208: Analyze close reopen state reset
- **Pre-conditions**: Full integration test: AIImageAnalyzer → Analysis → Save → System
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Analyze close reopen state reset
  3. Verify kết quả đúng như expected
- **Expected Result**: Analyze close reopen state reset — component đóng đúng, state cleanup, không memory leak
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_209: Save dish nutrition cascade
- **Pre-conditions**: Full integration test: AIImageAnalyzer → Analysis → Save → System
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Save dish nutrition cascade
  3. Verify kết quả đúng như expected
- **Expected Result**: Save dish nutrition cascade — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIA_210: Concurrent analyses latest only
- **Pre-conditions**: Full integration test: AIImageAnalyzer → Analysis → Save → System
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Concurrent analyses latest only
  3. Verify kết quả đúng như expected
- **Expected Result**: Concurrent analyses latest only — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

---

## Đề xuất Cải tiến

### Đề xuất 1: Real-time Camera Analysis
- **Vấn đề hiện tại**: Phải chụp ảnh → confirm → analyze. 3 bước.
- **Giải pháp đề xuất**: Live camera preview với real-time object detection overlay. Khi detect food → auto-suggest "Analyze this dish?".
- **Lý do chi tiết**: Giảm friction từ 3 bước xuống 1. Tăng wow-factor. Similar to Google Lens UX.
- **Phần trăm cải thiện**: User effort -60%, Feature engagement +50%
- **Mức độ ưu tiên**: Medium | **Effort**: L

### Đề xuất 2: Multi-Dish Detection
- **Vấn đề hiện tại**: Chỉ phân tích 1 món/ảnh. Bàn ăn nhiều món phải chụp từng món.
- **Giải pháp đề xuất**: AI detect multiple dishes trong 1 ảnh, hiển thị bounding boxes, user chọn từng món.
- **Lý do chi tiết**: Real-world usage: bàn ăn có 3-5 món. Single photo = 80% less effort.
- **Phần trăm cải thiện**: Photos needed -70%, Analysis time -60%
- **Mức độ ưu tiên**: High | **Effort**: L

### Đề xuất 3: Nutrition Accuracy Rating
- **Vấn đề hiện tại**: User không biết AI estimate chính xác bao nhiêu %.
- **Giải pháp đề xuất**: Hiện confidence score (High/Medium/Low) cho mỗi field. Highlight uncertain values in orange.
- **Lý do chi tiết**: Transparency builds trust. User có thể focus edit vào uncertain fields.
- **Phần trăm cải thiện**: User trust +40%, Edit accuracy +30%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 4: Barcode/Label Scanner
- **Vấn đề hiện tại**: Packaged food with nutrition label → AI estimates instead of reading label.
- **Giải pháp đề xuất**: Auto-detect nutrition labels/barcodes → OCR extract exact values. Switch modes: "Dish Photo" vs "Label Scan".
- **Lý do chi tiết**: Packaged food = 40% of diet. Label data 100% accurate vs AI estimate ~70%.
- **Phần trăm cải thiện**: Nutrition accuracy +30%, Packaged food tracking +50%
- **Mức độ ưu tiên**: Medium | **Effort**: L

### Đề xuất 5: Quick Add from Analysis
- **Vấn đề hiện tại**: Analyze → Save → go to Calendar → add to plan. Too many steps.
- **Giải pháp đề xuất**: After analysis: "Add to today's lunch?" button. One tap = save dish + add to plan.
- **Lý do chi tiết**: 80% of image analysis is for immediate meal logging. Shortcut saves 4 steps.
- **Phần trăm cải thiện**: Meal logging time -70%, Feature completion rate +45%
- **Mức độ ưu tiên**: High | **Effort**: S
