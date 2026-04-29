# Research UI/UX: Flow thêm/sửa nguyên liệu từ các app nutrition

Ngày phân tích: 2026-04-29  
Vai trò: Senior Business Analyst + UX Flow Architect + Software Architect  
Scope: chỉ research evidence UI và đề xuất flow cải tiến, **chưa sửa code**.

---

## 1. Executive Summary

Cảm giác “UI thêm nguyên liệu hiện tại chưa tự nhiên” là hợp lý.

Sau khi đối chiếu flow hiện tại của MealPlaning với evidence UI từ các app nutrition/food logging tương tự, vấn đề chính không nằm ở màu sắc hay component riêng lẻ. Vấn đề nằm ở **cách gom quá nhiều thông tin kỹ thuật vào một form dài**:

- Tên nguyên liệu.
- Nhóm.
- Basis `100g/100ml`.
- Calories/macros.
- Unit conversion.
- Density g/ml.
- Unit default.
- Unit approximate.
- Delete / dishes using / unsaved changes.

Trong các app tham khảo, các pattern phổ biến hơn là:

1. **Tách “nhập dữ liệu” và “review dinh dưỡng” thành bước riêng.**
   - Cronometer có màn “Nutrient Review” sau khi tạo food, với selector “Nutrition displayed per” và các card summary.
2. **Ưu tiên entry point theo ngữ cảnh ăn uống.**
   - MyFitnessPal/YAZIO/FatSecret chia diary theo bữa: Breakfast/Lunch/Dinner và có nút Log/Add ngay trong từng bữa.
3. **Serving/unit được trình bày bằng ngôn ngữ người dùng hiểu.**
   - Cronometer preview “Serving Size: 1 cup = 227g”, thay vì bắt user hiểu `factor_to_basis`.
4. **Macro/nutrition được preview trực quan.**
   - Cronometer/FatSecret dùng chart/progress/label-style preview để user thấy dữ liệu vừa nhập có hợp lý không.
5. **Các app hiện đại giảm friction bằng search, scan, photo, AI hoặc recipe cards.**
   - Lose It! quảng bá “Snap It! Say It! Scan It!”; YAZIO quảng bá AI/photo recognition; MyFitnessPal có Log button theo từng meal và central plus.

Kết luận sản phẩm:

- MealPlaning hiện đang đúng về kiến trúc dữ liệu, nhưng UX form đang “developer-first” hơn “user-first”.
- Nên cải tiến theo hướng **guided form + serving/unit review + nutrition preview**, không nên chỉ làm đẹp lại form cũ.
- Gợi ý flow tối ưu cho V1.5: **Basic info → Serving & units → Nutrition → Review & save**.
- Với user thường, nên ẩn phần khó như density/factor nâng cao sau một lớp “Cài đặt nâng cao”.

---

## 2. Evidence sources đã thu thập

### 2.1 Cronometer — official help center / support images

Nguồn chính:

- Mobile create custom food: `https://support.cronometer.com/hc/en-us/articles/360019866351-Mobile-Create-a-Custom-Food`
- Web create custom food: `https://support.cronometer.com/hc/en-us/articles/360018240312-Create-a-Custom-Food`
- Mobile create custom meal: `https://support.cronometer.com/hc/en-us/articles/16510542794004-Mobile-Create-Custom-Meal`

Evidence assets đã tải về local:

| Asset | Nguồn | Ghi chú |
|---|---|---|
| `ingredient-uiux-evidence-assets/cronometer-mobile-create-food-tile.png` | Cronometer support | Tile/action tạo food. |
| `ingredient-uiux-evidence-assets/cronometer-mobile-create-food-step1.png` | Cronometer support | Màn “New Food / Nutrient Review”. |
| `ingredient-uiux-evidence-assets/cronometer-web-custom-food.png` | Cronometer support | Web custom food editor có form + nutrition facts preview. |
| `ingredient-uiux-evidence-assets/cronometer-mobile-create-meal-1.png` | Cronometer support | Create custom meal evidence. |
| `ingredient-uiux-evidence-assets/cronometer-mobile-create-meal-2.png` | Cronometer support | Create custom meal evidence. |

Mức tin cậy: **High** vì ảnh đến từ official support domain của Cronometer.

### 2.2 MyFitnessPal — official website / Google Play evidence

Nguồn:

- App page: `https://play.google.com/store/apps/details?id=com.myfitnesspal.android&hl=en&gl=US`
- Official website image: `https://www.myfitnesspal.com/premium?legacy=true`
- Local asset: `ingredient-uiux-evidence-assets/myfitnesspal-feature-logging.png`
- Local asset: `ingredient-uiux-evidence-assets/play-myfitnesspal-diary-logging-01.png`
- Local asset: `ingredient-uiux-evidence-assets/play-myfitnesspal-diary-logging-02.png`

Mức tin cậy: **Medium–High**. Play Store/official site là official marketing evidence, nhưng không luôn thể hiện full flow sau khi bấm.

### 2.3 YAZIO — official website / Google Play evidence

Nguồn:

- Food diary page: `https://www.yazio.com/en/food-diary`
- App page: `https://play.google.com/store/apps/details?id=com.yazio.android&hl=en&gl=US`
- Local asset: `ingredient-uiux-evidence-assets/yazio-food-diary-app.png`
- Local asset: `ingredient-uiux-evidence-assets/yazio-food-diary-phone.png`
- Local asset: `ingredient-uiux-evidence-assets/play-yazio-log-02.png`

Mức tin cậy: **Medium–High**.

### 2.4 Lose It! — Google Play evidence

Nguồn:

- App page: `https://play.google.com/store/apps/details?id=com.fitnow.loseit&hl=en&gl=US`
- Local asset: `ingredient-uiux-evidence-assets/play-loseit-log-01.png`

Mức tin cậy: **Medium**. Evidence là marketing creative, rõ về photo/speech/scan pattern nhưng không cho thấy full custom ingredient form.

### 2.5 FatSecret — Google Play evidence

Nguồn:

- App page: `https://play.google.com/store/apps/details?id=com.fatsecret.android&hl=en&gl=US`
- Local asset: `ingredient-uiux-evidence-assets/play-fatsecret-diary-01.png`

Mức tin cậy: **Medium**. Evidence rõ về diary/macro table/streak/add icon, chưa rõ custom food form.

### 2.6 Nutritionix Track / APIs

Nguồn:

- App page: `https://play.google.com/store/apps/details?id=com.nutritionix.nixtrack&hl=en&gl=US`
- API docs: `https://docx.syndigo.com/developers/docs/nutritionix-api-guide`

Mức tin cậy: **Medium**. API docs có evidence về `serving_weight_grams`, nhưng UI screenshot thu được không đủ tốt cho custom ingredient UX.

---

## 3. Evidence UI quan trọng nhất

## 3.1 Cronometer mobile — “New Food / Nutrient Review”

Evidence image:

`ingredient-uiux-evidence-assets/cronometer-mobile-create-food-step1.png`

Những gì thấy trong UI:

- Header: `New Food`.
- Step/content title: `Nutrient Review`.
- Tên food: `Clif bar, peanut`.
- Card selector: `Nutrition displayed per` → `Bar – 120g`.
- Card `Energy Summary`:
  - Donut chart.
  - `100 kcal` ở trung tâm.
  - Protein / Net Carbs / Fat có màu riêng.
- Card `Macronutrient Targets`:
  - Energy / Protein / Net Carbs với progress bar.
  - Có giá trị hiện tại / target và phần trăm.
- Bottom actions:
  - `BACK`.
  - `SAVE FOOD`.
  - `SAVE & ADD TO DIARY`.

UX lesson:

- Cronometer không bắt user nhìn một form dài rồi tự hình dung dữ liệu có đúng hay không.
- Nó cho user một bước **review** rất rõ trước khi lưu.
- Serving/unit được nói bằng ngôn ngữ tự nhiên: `Bar – 120g`.
- Dữ liệu macro được kiểm chứng bằng visual summary, không chỉ input field.

Áp dụng cho MealPlaning:

- Sau khi user nhập nutrition/unit, nên có card preview:
  - “Dinh dưỡng chuẩn lưu theo: 100g / 100ml”.
  - Nếu dữ liệu đến từ nhãn “1 khẩu phần”, UI phải hỏi thêm khối lượng/thể tích khẩu phần để quy đổi về `100g/100ml` trước khi lưu.
  - “Nếu dùng 2 quả trong món ăn → app tính khoảng X kcal, P/C/F”.
- CTA nên phân cấp:
  - `Quay lại`.
  - `Lưu nguyên liệu`.
  - Sau này có thể có `Lưu & thêm vào món`.

---

## 3.2 Cronometer web — Custom Food editor + Nutrition Facts preview

Evidence image:

`ingredient-uiux-evidence-assets/cronometer-web-custom-food.png`

Những gì thấy trong UI:

- Left panel:
  - `+ Add Food`.
  - Search custom foods.
  - List custom foods.
- Main editor:
  - Group `Names`.
  - Group `Category & Tags`.
  - Group `Notes`.
  - Group `Barcodes`.
  - Group `Serving Sizes`.
- Right panel:
  - Preview `Nutrition Facts` label.
  - `Serving Size: 1 cup = 227g`.
  - Calories, fat, sodium, carbs, protein, vitamins...
  - `% Daily Value`.

UX lesson:

- Form không đứng một mình. Nó đi kèm **preview sống**.
- Serving size là một entity riêng, có thể thêm nhiều serving sizes.
- Nutrition facts preview giúp phát hiện dữ liệu bất thường ngay lập tức.
- `1 cup = 227g` là cách diễn đạt rất tự nhiên cho conversion.

Áp dụng cho MealPlaning:

- `ingredient_unit.factor_to_basis` không nên lộ bằng ngôn ngữ kỹ thuật.
- UI nên nói:
  - `1 quả = 60g`.
  - `1 muỗng canh = 15ml`.
  - `1 khẩu phần = 120g` như một serving/conversion helper.
- Không persist nutrition basis kiểu `per serving`; luôn quy đổi và lưu canonical `100g/100ml`.
- Nên có preview card dạng “Nutrition label mini” hoặc “Tóm tắt dinh dưỡng”.

---

## 3.3 MyFitnessPal — Today dashboard + Log per meal

Evidence images:

- `ingredient-uiux-evidence-assets/myfitnesspal-feature-logging.png`
- `ingredient-uiux-evidence-assets/play-myfitnesspal-diary-logging-01.png`

Những gì thấy trong UI:

- Dashboard theo ngày: `Today`.
- Calendar mini.
- Calories card / calories remaining.
- Macro card: Carbs, Fat, Protein.
- Diary section.
- Meal rows: Breakfast, Lunch.
- Mỗi meal row có nút `Log` hoặc `ADD FOOD`.
- Bottom navigation có nút `+` ở giữa.

UX lesson:

- Add/log food không chỉ là một form CRUD trong tab quản lý.
- Người dùng thường thêm food trong ngữ cảnh: “tôi vừa ăn bữa sáng/trưa/tối”.
- Mỗi meal có entry point riêng, giảm câu hỏi “thêm cái này vào đâu?”.

Áp dụng cho MealPlaning:

- Flow thêm nguyên liệu từ tab Quản lý vẫn cần, nhưng nên xem là **advanced/master data flow**.
- Flow user thường nên đi từ món ăn/recipe/meal context:
  - “Không thấy nguyên liệu này?” → “Tạo nguyên liệu mới nhanh”.
  - Sau khi tạo xong, quay lại món ăn và dùng ngay nguyên liệu đó.

---

## 3.4 YAZIO — Diary + meal calories + Add row

Evidence image:

`ingredient-uiux-evidence-assets/yazio-food-diary-app.png`

Những gì thấy trong UI:

- Date/week strip.
- Calorie equation: Goal – Food + Exercise = Remaining.
- Macro progress bars: Carbohydrates, Protein, Fat.
- Meal section: Breakfast.
- Food rows có ảnh thumbnail, serving/brand detail, calories canh phải.
- Row `Add` trong meal.
- Bottom navigation có central `+`.

UX lesson:

- Meal list có hierarchy rất rõ:
  - Meal total calories.
  - Recommended calories cho meal.
  - Food rows.
  - Add row.
- Food row có serving detail ngay dưới tên, ví dụ `1 piece`, `0.5 oz`, `5.07 fl. oz.`.

Áp dụng cho MealPlaning:

- Trong dish/meal context, khi hiển thị ingredient usage, nên luôn có:
  - amount + display unit.
  - calories/macro preview của row.
  - edit row bằng bottom sheet.
- Flow thêm ingredient nên giúp tạo ra display unit thân thiện để các list sau đọc dễ.

---

## 3.5 FatSecret — Macro table + diary add icon

Evidence image:

`ingredient-uiux-evidence-assets/play-fatsecret-diary-01.png`

Những gì thấy trong UI:

- `Today` card.
- Food logging streak.
- Meal rows: Breakfast, Lunch.
- Macro/calorie columns: Fat, Carbs, Prot., RDI, Cals.
- Donut chart macro: Carbs/Fat/Protein.
- Add icons màu xanh cạnh meal/calorie area.

UX lesson:

- Một số app power-user hơn dùng table macro ngay trong diary.
- Add action vẫn đặt gần meal context.
- Macro ratio chart giúp user hiểu cơ cấu dinh dưỡng, không chỉ kcal.

Áp dụng cho MealPlaning:

- Không nhất thiết dùng table dày như FatSecret cho V1, nhưng nên học cách:
  - hiển thị macro preview bằng chart/card.
  - đặt add action gần nơi user cần.

---

## 3.6 Lose It! — Snap / Say / Scan pattern

Evidence image:

`ingredient-uiux-evidence-assets/play-loseit-log-01.png`

Những gì thấy trong UI:

- Text: `Track Your Calories & Nutrition`.
- Text: `Snap It! Say It! Scan It!`.
- Camera UI để chụp meal.
- Food recognition labels trên ảnh: `Hardboiled egg`, `Avocado`, `Wheat bread`.
- Camera shutter button.

UX lesson:

- Các app consumer hiện đại đang giảm friction nhập liệu bằng:
  - chụp ảnh.
  - nói bằng voice.
  - scan barcode.
- Đây không phải scope bắt buộc ngay, nhưng là direction dài hạn.

Áp dụng cho MealPlaning:

- Không nên bắt user luôn đi qua form full technical.
- Có thể thêm “AI gợi ý nutrition” hoặc “Tạo từ nhãn dinh dưỡng” sau này.
- V1.5 có thể bắt đầu bằng guided manual flow trước, chưa cần camera/AI.

---

## 4. Pattern UI/UX rút ra từ thị trường

| Pattern | Evidence app | Cách họ xử lý | Bài học cho MealPlaning |
|---|---|---|---|
| Review trước khi save | Cronometer mobile | `Nutrient Review` với Energy Summary, Macro Targets, CTA rõ | Nên thêm bước/card review trước khi lưu ingredient. |
| Serving/unit thân thiện | Cronometer web/mobile | `Bar – 120g`, `1 cup = 227g` | Không dùng từ kỹ thuật như factor; nói “1 quả = 60g”. |
| Nutrition label preview | Cronometer web | Form bên trái, Nutrition Facts preview bên phải | Có thể làm mini nutrition card trong mobile. |
| Add/log theo meal context | MyFitnessPal, YAZIO, FatSecret | `Log`/`Add` trong từng meal row | Tạo nguyên liệu nên có flow contextual từ dish/meal, không chỉ CRUD. |
| Central add action | MyFitnessPal, YAZIO | Bottom nav có nút `+` | Nếu app có nhiều add actions, cần menu rõ: thêm món, thêm nguyên liệu, log meal. |
| Macro visual summary | Cronometer, FatSecret, YAZIO | Donut/progress bars | Form nutrition nên preview macro trực quan. |
| Search/recipe discovery | MyFitnessPal Plan | Search recipes + card grid | Ingredient creation nên ưu tiên search existing trước khi tạo mới. |
| AI/photo/scan input | Lose It!, YAZIO | Snap/Say/Scan, AI/photo recognition | Direction dài hạn để giảm nhập tay. |

---

## 5. Vì sao UI hiện tại của MealPlaning có thể “không tự nhiên”

Dựa trên file phân tích hiện tại và code, form thêm/sửa ingredient đang làm đúng về data nhưng chưa tự nhiên về UX vì:

### 5.1 Người dùng bị yêu cầu hiểu model kỹ thuật quá sớm

Các khái niệm như:

- `nutrition_basis_unit`.
- `factor_to_basis`.
- `density_g_per_ml`.
- unit default.
- approximate unit.

là khái niệm system/data model. User thường chỉ nghĩ:

- “Tôi muốn thêm trứng.”
- “Tôi biết 1 quả khoảng 60g.”
- “Tôi biết dinh dưỡng theo 100g hoặc trên bao bì.”

### 5.2 Form dài nhưng thiếu preview kết quả

User nhập nhiều số nhưng chưa thấy ngay:

- nếu dùng 1 quả thì bao nhiêu kcal?
- nếu dùng 2 muỗng thì macro thế nào?
- dữ liệu có bất thường không?
- nguyên liệu này đang ảnh hưởng món nào?

Cronometer xử lý tốt hơn bằng review/preview.

### 5.3 Unit conversion bị đặt ngang hàng với field cơ bản

Hiện tại “Đơn vị có thể nhập” là phần bắt buộc và hơi nặng. Với user thường, nó nên là:

- đơn vị mặc định đơn giản trước;
- advanced units sau;
- conversion được diễn đạt bằng câu tự nhiên.

### 5.4 Không có flow “search trước, tạo sau” rõ ràng

Các app nutrition thường ưu tiên:

1. Search database.
2. Scan/search/AI.
3. Không thấy thì tạo custom.

MealPlaning đang có create form trực tiếp trong management, nên dễ tạo duplicate và tăng gánh nặng nhập liệu.

---

## 6. Đề xuất 3 flow UI cải tiến cho MealPlaning

## Flow A — Guided Basic Form + Advanced Unit Settings

### Mục tiêu

Giữ implementation gần hiện tại nhất nhưng làm UX tự nhiên hơn.

### User flow

1. User bấm “Thêm nguyên liệu”.
2. Màn hình mở với section 1: “Thông tin cơ bản”.
   - Tên nguyên liệu.
   - Nhóm.
3. Section 2: “Dinh dưỡng chuẩn”.
   - Toggle: `Theo 100g` / `Theo 100ml` / sau này `Theo khẩu phần`.
   - Calories, Protein, Carbs, Fat, Fiber.
4. Section 3: “Đơn vị thường dùng”.
   - Default prompt: “Bạn thường nhập nguyên liệu này bằng đơn vị nào?”
   - Ví dụ: `g`, `ml`, `quả`, `muỗng`, `cốc`.
   - Nếu chọn `quả`: hỏi `1 quả bằng khoảng bao nhiêu g?`.
5. Section 4: “Xem lại”.
   - Preview: `1 quả = 60g`.
   - Preview: `1 quả ≈ 93 kcal, P 7.8g, C 0.6g, F 6.6g`.
6. CTA: `Lưu nguyên liệu`.

### Conceptual UI

```text
Thêm nguyên liệu

[Thông tin cơ bản]
Tên: Trứng gà
Nhóm: Trứng & Sữa

[Dinh dưỡng chuẩn]
Dữ liệu này tính theo: [100g] [100ml]
Calories | Protein | Carbs | Fat | Fiber

[Đơn vị thường dùng]
Bạn hay dùng đơn vị nào?
[gram] [quả] [muỗng] [cốc]

Nếu chọn quả:
1 quả ≈ [60] g

[Xem lại]
1 quả trứng ≈ 93 kcal
P 7.8g · C 0.6g · F 6.6g

[Lưu nguyên liệu]
```

### Data mapping

- Vẫn map về `ingredient` + `ingredient_unit` như hiện tại.
- `1 quả = 60g` → `ingredient_unit.factor_to_basis = 60`.
- `100g` → `nutrition_basis_unit = 'g'`, `nutrition_basis_quantity = 100`.

### Ưu điểm

- Ít phá architecture.
- User hiểu dễ hơn.
- Giữ được validation và schema hiện tại, chỉ đổi presentation/flow.

### Nhược điểm

- Vẫn là manual form.
- Chưa giải quyết search/duplicate ở mức tốt nhất.

### Phù hợp

**Should-have cho V1.5.**

---

## Flow B — Search First, Create Only If Missing

### Mục tiêu

Giảm duplicate ingredient và giảm cảm giác “form CRUD kỹ thuật”.

### User flow

1. User bấm “Thêm nguyên liệu”.
2. Đầu tiên không vào form ngay, mà vào màn search:
   - Search placeholder: `Tìm trứng, ức gà, sữa tươi...`
3. Nếu tìm thấy:
   - Chọn ingredient có sẵn.
   - Vào edit hoặc use directly.
4. Nếu không thấy:
   - Hiển thị CTA: `Không thấy nguyên liệu? Tạo mới`.
5. Form tạo mới mở với tên đã search prefill.
6. User nhập phần còn thiếu.

### Conceptual UI

```text
Thêm nguyên liệu

Bạn muốn thêm nguyên liệu nào?
[ Tìm tên nguyên liệu... ]

Gợi ý gần giống:
- Trứng gà
- Lòng trắng trứng
- Trứng vịt

Không thấy nguyên liệu bạn cần?
[+ Tạo “Trứng cút”]
```

### Data mapping

- Search dùng `IngredientStore.search() / IngredientRepository.searchByName()`.
- Nếu tạo mới, prefill `name`.
- Có thể thêm duplicate warning khi tên gần giống.

### Ưu điểm

- Giảm duplicate.
- Gần pattern thị trường hơn: search database trước, custom sau.
- Phù hợp khi seed database lớn dần.

### Nhược điểm

- Thêm một step trước form.
- Cần fuzzy matching tốt hơn nếu muốn UX mượt.

### Phù hợp

**Must-have nếu muốn scale ingredient database.**

---

## Flow C — Contextual Create From Dish/Recipe

### Mục tiêu

Làm flow tự nhiên cho user khi họ đang tạo món ăn nhưng thiếu nguyên liệu.

### User flow

1. User đang tạo món “Cơm trứng”.
2. User bấm thêm nguyên liệu vào món.
3. Search ingredient.
4. Không thấy “trứng cút”.
5. CTA: `Tạo nguyên liệu mới “trứng cút”`.
6. Bottom sheet hoặc routed page tạo ingredient mở với name prefill.
7. User nhập dinh dưỡng/unit tối thiểu.
8. Save xong quay lại dish-edit, ingredient mới đã được chọn sẵn.
9. User nhập amount: `5 quả`.

### Conceptual UI

```text
Thêm nguyên liệu vào món
[ Tìm nguyên liệu... ]

Không tìm thấy “trứng cút”
[+ Tạo nguyên liệu mới]

Sau khi tạo:
Món: Cơm trứng
Nguyên liệu: Trứng cút
Số lượng: [5] [quả]
Preview: 70 kcal · P 6g · F 5g
```

### Data mapping

- Create ingredient như hiện tại.
- Sau save, navigate back to dish edit with selected ingredient id.
- Dish amount sheet dùng new ingredient units.

### Ưu điểm

- Tự nhiên nhất với mental model của user.
- User tạo ingredient vì có nhu cầu dùng ngay.
- Giảm context switching.

### Nhược điểm

- Cần handle return navigation/state tốt.
- Cần tránh mất draft dish khi rời sang create ingredient.

### Phù hợp

**High priority sau khi add/edit ingredient ổn định.**

---

## 7. Flow đề xuất tối ưu cho project hiện tại

Mình đề xuất chọn hướng hybrid:

> Search-first + Guided create + Review preview.

Không cần làm AI/photo/scan ngay. Nhưng nên restructure UX để user đi theo logic tự nhiên:

```text
Tìm nguyên liệu → nếu không có thì tạo mới → nhập thông tin dễ hiểu → xem preview → lưu → dùng trong món/meal
```

### 7.1 Proposed screen structure

#### Step 0 — Search / choose existing

```text
Thêm nguyên liệu
[Search tên nguyên liệu]

Kết quả gần giống
- Trứng gà · Trứng & Sữa · 155 kcal/100g
- Lòng trắng trứng · Trứng & Sữa · 52 kcal/100g

[+ Tạo nguyên liệu mới “...”]
```

#### Step 1 — Basic info

```text
Thông tin cơ bản
Tên nguyên liệu
Nhóm nguyên liệu
```

#### Step 2 — Nutrition basis

```text
Dữ liệu dinh dưỡng bạn có là loại nào?
[Theo 100g] [Theo 100ml]

Calories
Protein / Carbs / Fat / Fiber
```

Future option:

```text
[Theo khẩu phần trên bao bì]
Serving size: 1 thanh = 45g
```

#### Step 3 — Units people use

```text
Bạn thường dùng nguyên liệu này bằng đơn vị nào?
[g] [ml] [quả] [muỗng] [cốc] [khác]

Nếu chọn unit cần quy đổi:
1 quả ≈ [60] g
```

#### Step 4 — Review

```text
Xem lại cách app sẽ tính

Dinh dưỡng chuẩn: 155 kcal / 100g
Đơn vị mặc định: 1 quả ≈ 60g

Nếu thêm vào món:
1 quả ≈ 93 kcal
2 quả ≈ 186 kcal

Protein 7.8g · Carbs 0.4g · Fat 6.6g

[Lưu nguyên liệu]
```

### 7.2 Rule UX nên áp dụng

| Rule | Chi tiết |
|---|---|
| Không nói “factor_to_basis” trong UI | Dùng “1 quả = ? g” hoặc “1 cốc = ? ml”. |
| Luôn preview macro theo default unit | Giúp user phát hiện sai conversion. |
| Density là advanced | Chỉ hiện khi user bật “Cần quy đổi g ↔ ml”. |
| Search trước create | Giảm duplicate. |
| Nếu edit ingredient đang được dùng | Hiện warning/card “Đang dùng trong N món”. |
| Nếu đổi nutrition/unit quan trọng | Gợi ý xem danh sách món bị ảnh hưởng. |
| Nếu unit approximate | Hiển thị `≈` và “ước lượng”. |
| Nếu data bất thường | Warning mềm: “Calories cao hơn mức thường gặp, kiểm tra lại?” |

---

## 8. Recommendation priority

### Critical

1. Không đổi code ngay khi chưa chốt flow UX.
2. Chốt product decision: create ingredient là advanced management flow hay contextual flow từ dish/meal cũng phải hỗ trợ.
3. Quyết định cách xử lý nutrition theo serving trên bao bì: convert về 100g/100ml hay lưu serving riêng.

### High

1. Redesign “Thêm nguyên liệu” theo guided sections.
2. Thêm review card trước save.
3. Đổi wording unit conversion sang ngôn ngữ tự nhiên.
4. Đưa density vào advanced section.
5. Thêm duplicate/search-first flow.

### Medium

1. Add impact card khi edit ingredient đang được dùng.
2. Add macro preview theo default unit.
3. Add warning data bất thường.
4. Add “Lưu & dùng trong món” nếu mở từ dish context.

### Low

1. Visual polish: chart donut/progress bars.
2. AI/photo/scan direction.
3. Barcode/nutrition label import.

---

## 9. Final decision guide

| Mục tiêu | Nên chọn |
|---|---|
| Nhanh, ít thay đổi | Flow A: Guided Basic Form + Advanced Unit Settings. |
| Giảm duplicate lâu dài | Flow B: Search First, Create Only If Missing. |
| Tự nhiên nhất với user | Flow C: Contextual Create From Dish/Recipe. |
| Macro calculation rõ ràng nhất | Flow A + Review preview bắt buộc. |
| Scale database/unit về sau | Flow B + serving/unit model rõ. |
| Chuẩn UX nhất cho app nutrition | Hybrid: Search-first + Guided create + Review preview + contextual return. |

Khuyến nghị của mình:

- Giai đoạn tiếp theo nên **chưa sửa code ngay**.
- Nên dựng 2–3 mockup HTML cho màn “Thêm nguyên liệu” theo các flow trên để bạn nhìn trực quan.
- Sau khi bạn chọn flow, mới viết implementation plan và sửa Angular/Ionic.

---

## 10. Evidence asset index

Tất cả evidence ảnh local nằm ở:

`/Users/khanhhuynh/person_project/MealPlaning/docs/5-development/ingredient-uiux-evidence-assets/`

Các ảnh đáng xem trước:

1. `cronometer-mobile-create-food-step1.png`
   - Mạnh nhất cho pattern “review nutrition trước khi save”.
2. `cronometer-web-custom-food.png`
   - Mạnh nhất cho pattern “form + nutrition facts preview + serving size”.
3. `myfitnesspal-feature-logging.png`
   - Mạnh cho diary/log per meal pattern.
4. `play-myfitnesspal-diary-logging-01.png`
   - Mạnh cho Today dashboard + Log per meal.
5. `yazio-food-diary-app.png`
   - Mạnh cho meal list + add row + macro progress.
6. `play-fatsecret-diary-01.png`
   - Mạnh cho macro table/donut + add icon.
7. `play-loseit-log-01.png`
   - Mạnh cho photo/speech/scan direction.

---

## 11. Câu hỏi cần bạn quyết định trước khi mockup

Có 3 hướng mockup đáng làm:

1. **Safe redesign**
   - Giữ flow 1 page, chỉ đổi layout thành guided sections + preview card.

2. **Search-first redesign**
   - Mở bằng search ingredient, chỉ create nếu không tìm thấy.

3. **Contextual dish-first redesign**
   - Tạo nguyên liệu ngay trong flow thêm món ăn, save xong quay lại món.

Mình khuyến nghị làm mockup cả 3 để bạn so trực quan trước khi chọn.
