# Scenario 5: AI Image Analysis

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

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

## Test Cases (105 TCs)

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

---

## Chi tiết Test Cases

##### TC_AIA_01–08: Initial State & Image Input
- TC_AIA_01: Sub-tab visible and clickable
- TC_AIA_02-03: Camera and gallery buttons present and functional
- TC_AIA_04-05: Image preview correct after capture/upload
- TC_AIA_06: Can retake/re-select image
- TC_AIA_07-08: Analyze button enabled/disabled based on image

##### TC_AIA_09–28: Happy Path
- TC_AIA_09: Loading spinner during API call
- TC_AIA_10-12: AI returns complete result (name, ingredients, nutrition)
- TC_AIA_13: Result laid out cleanly
- TC_AIA_14-18: Edit capabilities (name, ingredient, add/remove, nutrition)
- TC_AIA_19-28: Save flow (modal, pre-fill, edit, confirm, cancel, notification)

##### TC_AIA_29–44: Image Format & Size
- TC_AIA_29-33: Supported/unsupported formats
- TC_AIA_34-40: Size boundaries
- TC_AIA_41-44: Orientations and EXIF

##### TC_AIA_45–60: Error Handling & Edge Cases
- TC_AIA_45-52: API errors (no key, invalid key, network, timeout, rate limit, invalid/empty/partial response)
- TC_AIA_53-60: Unusual images (non-food, blurry, dark, multiple dishes, text, empty plate, packaged, raw)

##### TC_AIA_61–70: Save Integration
- TC_AIA_61-63: Naming edge cases (duplicate, case, accents)
- TC_AIA_64-68: Post-save verification (management, planning, nutrition, ingredients, editable)
- TC_AIA_69-70: Multiple analyses flow

##### TC_AIA_71–76: Platform-Specific
- TC_AIA_71-72: Permission denied
- TC_AIA_73-76: Desktop alternatives (file picker, drag-drop, paste)

##### TC_AIA_77–93: UI/UX
- Dark mode, responsive, i18n, loading, cancel, retry, error messages, card interactions, zoom, crop, history, quick save, share, copy

##### TC_AIA_94–105: Security, Performance & Accessibility
- Malicious file, XSS, memory, screen reader, keyboard, touch, undo, confidence, Vietnamese/international recognition

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
