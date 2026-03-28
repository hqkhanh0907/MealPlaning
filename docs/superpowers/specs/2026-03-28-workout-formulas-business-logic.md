# Công thức Tính toán & Business Logic cho Ứng dụng Theo dõi Workout & Sức khỏe

> **Tài liệu nghiên cứu toàn diện** — Tổng hợp tất cả công thức toán học, quy tắc nghiệp vụ và luồng logic cần thiết cho một ứng dụng ghi chú theo dõi hoạt động tập luyện hàng ngày.
>
> Dựa trên phân tích mã nguồn dự án Smart Meal Planner + nghiên cứu tiêu chuẩn ngành.
>
> **Cập nhật 2026-03-28**: Đã audit toàn bộ codebase — đánh dấu rõ ✅ Đã implement / ⚠️ Một phần.
> Đã loại bỏ 7 công thức không phù hợp scope (BMI, FFMI, Navy Body Fat, Wilks, Max HR, HR Zones, Recovery Time) — xem lý do tại Phần E.

---

## 📊 Tổng quan Trạng thái Implement

### Công thức (Formulas)

| # | Công thức | Trạng thái | Nguồn |
|---|-----------|-----------|-------|
| 1.1 | BMR (Mifflin-St Jeor) | ✅ Đã implement | `nutritionEngine.ts:33-44` |
| 1.2 | TDEE | ✅ Đã implement | `nutritionEngine.ts:46-52` |
| 1.3 | Caloric Target | ✅ Đã implement | `nutritionEngine.ts:74-80` |
| 1.4 | Macro Split (P→F→C) | ✅ Đã implement | `nutritionEngine.ts:82-114` |
| 2.1 | 1RM Brzycki | ✅ Đã implement | `trainingMetrics.ts:31-36` |
| 2.2 | RPE/RIR | ⚠️ Một phần | Có lưu RPE, chưa có công thức RIR↔RPE |
| 2.3 | Volume Load | ✅ Đã implement | `trainingMetrics.ts:5-19` |
| 2.4 | Progressive Overload | ✅ Đã implement | `useProgressiveOverload.ts:47-75` |
| 2.5 | Periodization (3 models) | ✅ Đã implement | `periodization.ts:35-54` |
| 2.6 | Deload Protocol | ✅ Đã implement | `periodization.ts:64-109` |
| 2.7 | Duration Estimate | ✅ Đã implement | `TrainingPlanView.tsx` |
| 2.8 | Volume Distribution | ✅ Đã implement | `volumeCalculator.ts` |
| 3.2 | LBM | ✅ Đã implement | `nutritionEngine.ts:90-92` |
| 4.3 | Cardio Calories (MET) | ✅ Đã implement | `cardioEstimator.ts` |
| 5.1 | Daily Score | ✅ Đã implement | `scoreCalculator.ts:83-164` |
| 5.2 | Streak | ✅ Đã implement | `gamification.ts:58-176` |
| 5.3 | PR Detection | ✅ Đã implement | `gamification.ts:192-225` |
| 5.4 | Milestones | ✅ Đã implement | `gamification.ts` |

**Tóm tắt**: ✅ 19 đã implement | ⚠️ 1 một phần (RPE/RIR)

### Business Logic (Luồng Nghiệp vụ)

| # | Luồng | Trạng thái | Nguồn |
|---|-------|-----------|-------|
| 6 | Onboarding | ✅ Đã implement | `FitnessOnboarding.tsx` |
| 7 | Training Plan Generation | ✅ Đã implement | `useTrainingPlan.ts` |
| 8 | Workout Logging | ✅ Đã implement | `WorkoutLogger.tsx` + `CardioLogger.tsx` |
| 9 | Progressive Overload | ✅ Đã implement | `useProgressiveOverload.ts` |
| 10 | Plateau & Overtraining | ✅ Đã implement | `plateauAnalysis.ts` + `useProgressiveOverload.ts` |
| 11 | Feedback Loop | ✅ Đã implement | `useFeedbackLoop.ts` |
| 12 | Nutrition-Fitness Bridge | ✅ Đã implement | `useFitnessNutritionBridge.ts` |
| 13 | Gamification & Streak | ✅ Đã implement | `scoreCalculator.ts` + `gamification.ts` |
| 14 | State Management | ✅ Đã implement | 8 Zustand stores + SQLite |
| — | Warmup Protocol | ❌ Chưa implement | Internet — chưa có warmup sets tự động |
| — | Exercise Database | ✅ Đã implement | `exerciseDatabase.ts` (133 bài tập) |
| — | Rest Timer | ✅ Đã implement | `RestTimer.tsx` + `useTimer.ts` |
| — | Progress Visualization | ⚠️ Một phần | Có 4 metrics, chart cơ bản, chưa có trend line |

**Tóm tắt**: ✅ 11 đã implement | ⚠️ 1 một phần | ❌ 1 chưa implement

---

## Mục lục

1. [Phần A: Công thức Tính toán (Formulas)](#phần-a-công-thức-tính-toán)
   - [1. Dinh dưỡng & Năng lượng](#1-dinh-dưỡng--năng-lượng)
   - [2. Sức mạnh & Tập luyện](#2-sức-mạnh--tập-luyện)
   - [3. Thể hình & Cơ thể](#3-thể-hình--cơ-thể)
   - [4. Tim mạch & Cardio](#4-tim-mạch--cardio)
   - [5. Theo dõi Tiến trình & Gamification](#5-theo-dõi-tiến-trình--gamification)
2. [Phần B: Business Logic (Luồng Nghiệp vụ)](#phần-b-business-logic)
   - [6. Luồng Onboarding](#6-luồng-onboarding-thu-thập-thông-tin-người-dùng)
   - [7. Tạo Kế hoạch Tập luyện](#7-tạo-kế-hoạch-tập-luyện-training-plan-generation)
   - [8. Ghi nhận Buổi tập (Workout Logging)](#8-ghi-nhận-buổi-tập-workout-logging)
   - [9. Progressive Overload tự động](#9-progressive-overload-tự-động)
   - [10. Phát hiện Plateau & Overtraining](#10-phát-hiện-plateau--overtraining)
   - [11. Vòng phản hồi — Tự điều chỉnh Calories](#11-vòng-phản-hồi--tự-điều-chỉnh-calories-feedback-loop)
   - [12. Cầu nối Dinh dưỡng–Tập luyện](#12-cầu-nối-dinh-dưỡng--tập-luyện-nutrition-fitness-bridge)
   - [13. Gamification & Streak](#13-gamification--streak)
   - [14. Quản lý Trạng thái & Lưu trữ](#14-quản-lý-trạng-thái--lưu-trữ-dữ-liệu)
3. [Phần C: Bảng Tổng hợp](#phần-c-bảng-tổng-hợp-tất-cả-công-thức)
4. [Phần D: Nguồn tham khảo](#phần-d-nguồn-tham-khảo)
5. [Phần E: Công thức đã loại bỏ (và lý do)](#phần-e-công-thức-đã-loại-bỏ-khỏi-scope)

---

# Phần A: Công thức Tính toán

## 1. Dinh dưỡng & Năng lượng

### 1.1 BMR — Tỷ lệ Chuyển hóa Cơ bản (Mifflin-St Jeor) ✅

> **Trạng thái**: ✅ Đã implement — `src/services/nutritionEngine.ts:33-44`

Công thức chính xác nhất để ước tính năng lượng cơ thể đốt khi nghỉ ngơi[^1][^2]:

```
Nam:   BMR = 10 × Cân nặng(kg) + 6.25 × Chiều cao(cm) − 5 × Tuổi + 5
Nữ:    BMR = 10 × Cân nặng(kg) + 6.25 × Chiều cao(cm) − 5 × Tuổi − 161
```

| Đầu vào | Kiểu | Đơn vị |
|----------|------|--------|
| Cân nặng | Số | kg |
| Chiều cao | Số | cm |
| Tuổi | Số | năm |
| Giới tính | Enum | 'male' \| 'female' |

**Đầu ra**: BMR (kcal/ngày), làm tròn số nguyên[^1].

---

### 1.2 TDEE — Tổng Năng lượng Tiêu hao Hàng ngày ✅

> **Trạng thái**: ✅ Đã implement — `src/services/nutritionEngine.ts:46-52`

```
TDEE = BMR × Hệ số Hoạt động
```

| Mức độ Hoạt động | Hệ số | Mô tả |
|-------------------|--------|-------|
| Ít vận động (Sedentary) | 1.2 | Ngồi nhiều, không tập |
| Nhẹ (Light) | 1.375 | Tập 1–3 ngày/tuần |
| Vừa (Moderate) | 1.55 | Tập 3–5 ngày/tuần |
| Năng động (Active) | 1.725 | Tập 6–7 ngày/tuần |
| Rất năng động (Extra) | 1.9 | Tập nặng 2 lần/ngày |

**Hệ số tự động điều chỉnh** (nếu có dữ liệu tập luyện)[^3]:

```
Hệ số Điều chỉnh = (Hệ số từ Dữ liệu × 0.7) + (Hệ số Người dùng chọn × 0.3)
```

→ 70% dựa trên dữ liệu thực tế, 30% dựa trên lựa chọn ban đầu.

**Phát hiện mức hoạt động từ dữ liệu**[^4]:

| Tần suất Tập | Cardio/tuần | Mức |
|---------------|-------------|-----|
| ≥ 6 buổi sức mạnh | — | Extra Active |
| ≥ 5 buổi | — | Active |
| ≥ 4 buổi + cardio > 90 phút | — | Active |
| ≥ 3 buổi HOẶC cardio ≥ 90 phút | — | Moderate |
| ≥ 1 buổi HOẶC cardio ≥ 30 phút | — | Light |
| 0 | < 30 phút | Sedentary |

**Độ tin cậy**[^4]:

| Thời gian có dữ liệu | Mức tin cậy |
|------------------------|-------------|
| < 2 tuần hoặc chưa tập | Thấp |
| 2–3 tuần | Trung bình |
| ≥ 4 tuần | Cao |

---

### 1.3 Mục tiêu Calories (Caloric Target) ✅

> **Trạng thái**: ✅ Đã implement — `src/services/nutritionEngine.ts:74-80`

```
Calories Mục tiêu = TDEE + Calorie Offset
```

| Giai đoạn | Bù trừ (kcal) | |
|-----------|--------|---|
| | Nhẹ | Vừa | Mạnh |
| Giảm cân (Cut) | −275 | −550 | −1100 |
| Tăng cân (Bulk) | +275 | +550 | +1100 |
| Duy trì (Maintain) | 0 | 0 | 0 |

**Giới hạn an toàn**[^5]:
- Sàn tuyệt đối: **1200 kcal** (không bao giờ dưới)
- Thâm hụt tối đa: **TDEE − 1000 kcal**
- Thặng dư tối đa: **TDEE + 700 kcal**

---

### 1.4 Macronutrient — Tính Đạm, Béo, Tinh bột ✅

> **Trạng thái**: ✅ Đã implement — `src/services/nutritionEngine.ts:82-114`
> Custom: Priority-based (P→F→C), hỗ trợ LBM khi có body fat %

Hệ thống ưu tiên (Priority-Based)[^1]:

**Bước 1 — Protein (Ưu tiên cao nhất):**
```
Nếu có Body Fat %:
  Khối lượng Nạc (LBM) = Cân nặng × (1 − Body Fat %)
  Protein (g) = LBM × Hệ số Protein
Nếu không:
  Protein (g) = Cân nặng × Hệ số Protein

Calories từ Protein = Protein(g) × 4 kcal/g
```

**Bước 2 — Chất béo:**
```
Calories từ Béo = Calories Mục tiêu × Tỷ lệ Béo (mặc định 25%)
Chất béo (g) = Calories Béo ÷ 9 kcal/g
```

**Bước 3 — Tinh bột (phần còn lại):**
```
Calories từ Carbs = Max(0, Calories Mục tiêu − Protein Cal − Fat Cal)
Carbs (g) = Calories Carbs ÷ 4 kcal/g
```

| Chất | Năng lượng/g | Mặc định |
|------|-------------|----------|
| Protein | 4 kcal | 2.0 g/kg thể trọng nạc |
| Chất béo | 9 kcal | 25% tổng calories |
| Tinh bột | 4 kcal | Phần còn lại |

---

## 2. Sức mạnh & Tập luyện

### 2.1 Ước tính 1RM (One-Rep Max) — Brzycki ✅

> **Trạng thái**: ✅ Đã implement — `src/features/fitness/utils/trainingMetrics.ts:31-36`
> Accuracy ±5% cho reps < 10. Brzycki là công thức duy nhất cần thiết — Epley cho kết quả tương đương, không thêm giá trị.

```
1RM = Trọng lượng ÷ (1.0278 − 0.0278 × Số lần lặp)
```

| Ví dụ | Kết quả |
|-------|---------|
| 100kg × 5 reps | ~112.5 kg |
| 80kg × 10 reps | ~106.7 kg |

**Ứng dụng**: Xác định cường độ tập (% 1RM), theo dõi tiến trình sức mạnh.

---

### 2.2 RPE — Thang đo Cường độ Chủ quan ⚠️

> **Trạng thái**: ⚠️ Một phần — Có lưu trữ RPE trong `WorkoutSet`, dùng cho phát hiện fatigue/overtraining.
> Chưa implement: Bảng ánh xạ RPE↔%1RM, công thức RIR từ RPE. Nguồn bảng dưới: Internet.

**Thang RPE 1–10 dựa trên RIR (Reps In Reserve)**[^8]:

| RPE | RIR (Số reps còn lại) | Mô tả |
|-----|----------------------|-------|
| 10 | 0 | Cố gắng tối đa, không thể thêm |
| 9 | 1 | Có thể thêm 1 rep nữa |
| 8 | 2 | Có thể thêm 2 reps |
| 7 | 3 | Còn khá thoải mái |
| 6 | 4+ | Nhẹ nhàng |

**Ánh xạ RPE → % 1RM** (xấp xỉ):

| Reps | RPE 10 | RPE 9 | RPE 8 | RPE 7 |
|------|--------|-------|-------|-------|
| 1 | 100% | 97.5% | 95% | 92.5% |
| 3 | 92% | 90% | 87% | 85% |
| 5 | 86% | 84% | 82% | 80% |
| 8 | 79% | 77% | 75% | 73% |
| 10 | 75% | 73% | 71% | 69% |

---

### 2.3 Volume — Khối lượng Tập luyện ✅

> **Trạng thái**: ✅ Đã implement — `src/features/fitness/utils/trainingMetrics.ts:5-19`
> Bao gồm: Volume bài tập + Volume tuần. MEV/MAV/MRV trong `volumeCalculator.ts:14-52`

```
Volume Bài tập = Σ (Số lần lặp × Trọng lượng)    cho tất cả sets
Volume Tuần = Σ (Volume Bài tập)                    cho tất cả buổi trong tuần
```

**Volume Landmarks** (Schoenfeld 2017)[^9] — Sets/Nhóm cơ/Tuần:

| Nhóm cơ | Beginner | Intermediate | Advanced |
|----------|----------|-------------|----------|
| Ngực | 10 | 14 | 18 |
| Lưng | 10 | 14 | 18 |
| Vai | 8 | 12 | 16 |
| Chân | 10 | 14 | 18 |
| Tay | 8 | 10 | 14 |
| Bụng | 6 | 8 | 10 |
| Mông | 8 | 12 | 16 |

**Ngưỡng Volume quan trọng**:

| Chỉ số | Ý nghĩa | Phạm vi (sets/tuần) |
|--------|---------|---------------------|
| **MEV** (Minimum Effective Volume) | Tối thiểu để tăng trưởng | 4–6 |
| **MAV** (Maximum Adaptive Volume) | Tối ưu cho tăng trưởng | 14–20 |
| **MRV** (Maximum Recoverable Volume) | Tối đa có thể hồi phục | 20–26 |

---

### 2.4 Progressive Overload — Tăng Tải Tiến trình ✅

> **Trạng thái**: ✅ Đã implement — `src/features/fitness/hooks/useProgressiveOverload.ts:47-75`
> Bao gồm: Gợi ý tự động, tích hợp plateau + fatigue detection

**Quy tắc tăng tải**[^10]:

```
NẾU Số reps đạt được ≥ Rep Max mục tiêu:
  → TĂNG TRỌNG LƯỢNG theo bảng dưới
  → Reset reps về Rep Min mục tiêu
  → Nguồn: "progressive_overload"

NẾU Số reps < Rep Max mục tiêu:
  → GIỮ NGUYÊN trọng lượng
  → Tăng 1 rep
  → Nguồn: "rep_progression"
```

**Mức tăng theo kinh nghiệm**:

| Kinh nghiệm | Thân trên | Thân dưới | Tần suất |
|-------------|-----------|-----------|----------|
| Beginner | +2.5 kg | +5.0 kg | Mỗi tuần |
| Intermediate | +1.25 kg | +2.5 kg | Mỗi 2 tuần |
| Advanced | +1.25 kg | +2.5 kg | Mỗi 4 tuần |

---

### 2.5 Periodization — Phân kỳ Tập luyện ✅

> **Trạng thái**: ✅ Đã implement — `src/features/fitness/utils/periodization.ts:35-54`
> Đầy đủ 3 mô hình: Linear, Undulating (DUP), Block

**Tính tuần hiện tại**[^11]:

```
Tuần hiện tại = Floor((Thời gian hiện tại − Ngày bắt đầu) ÷ 7 ngày) + 1
```

**Mô hình phân kỳ**:

| Mô hình | Mô tả | Thay đổi |
|---------|-------|----------|
| **Linear** | Tăng dần cường độ, giảm volume | Tuần → tuần |
| **Undulating (DUP)** | Thay đổi trong tuần | Buổi → buổi |
| **Block** | Chu kỳ 3 giai đoạn | Mỗi block 3–4 tuần |

**Block Periodization chi tiết**:

| Block | Tuần | Rep Range | Rest | Mục tiêu |
|-------|------|-----------|------|----------|
| Hypertrophy | 1–4 | 8–12 reps | 60–90s | Tăng cơ |
| Strength | 5–8 | 4–6 reps | 120–180s | Tăng sức mạnh |
| Endurance/Peak | 9–12 | 12–15 reps | 45–60s | Sức bền |

---

### 2.6 Deload — Giảm Tải ✅

> **Trạng thái**: ✅ Đã implement — `src/features/fitness/utils/periodization.ts:64-109`
> Bao gồm: Auto-deload trigger (RPE ≥ 8.0 × 4 tuần), giảm 40% volume

**Khi nào kích hoạt** (tự động)[^12]:
```
NẾU 4 tuần liên tiếp có RPE trung bình ≥ 8.0:
  → Kích hoạt Deload Week
```

**Công thức giảm tải**:
```
Sets mới = Round(Sets hiện tại × 0.6)     (giảm 40% volume)
Cường độ = Giữ nguyên × 0.9               (giảm 10% trọng lượng)
```

---

### 2.7 Ước tính Thời gian Buổi tập ✅

> **Trạng thái**: ✅ Đã implement — `TrainingPlanView.tsx` + `useTodaysPlan.ts`

```
Tổng phút = Khởi động + Σ(sets × (Thời gian set + Nghỉ) + Setup) ÷ 60

Trong đó:
  Khởi động = 5 phút
  Thời gian set = 40 giây (trung bình thực hiện 1 set)
  Nghỉ = restSeconds từ kế hoạch (mặc định 90s)
  Setup = 30 giây/bài tập (thay đổi thiết bị)
```

---

### 2.8 Phân phối Volume cho Bài tập ✅

> **Trạng thái**: ✅ Đã implement — `src/features/fitness/utils/volumeCalculator.ts:75-83`

```
Sets cơ bản = Floor(Tổng Sets ÷ Số bài tập)
Phần dư = Tổng Sets mod Số bài tập

Bài tập 1 → Sets cơ bản + (1 nếu thứ tự ≤ Phần dư)
Bài tập 2 → Sets cơ bản + (1 nếu thứ tự ≤ Phần dư)
...

Ví dụ: 14 sets cho 3 bài tập → [5, 5, 4]
```

---

## 3. Thể hình & Cơ thể

### 3.1 LBM — Khối lượng Nạc ✅

> **Trạng thái**: ✅ Đã implement — `src/services/nutritionEngine.ts:90-92` (trong `calculateMacros`)

```
LBM = Cân nặng × (1 − % Mỡ cơ thể)
```

---

## 4. Tim mạch & Cardio

### 4.1 Ước tính Calories Đốt (Cardio) ✅

> **Trạng thái**: ✅ Đã implement — `src/features/fitness/utils/cardioEstimator.ts`
> MET table đầy đủ cho 7 loại cardio × 3 mức cường độ.

**Công thức dựa trên MET**[^14]:

```
Calories = (Phút × MET × Cân nặng(kg)) ÷ 60
```

| Loại Cardio | MET (Cường độ thấp/vừa/cao) |
|-------------|------|
| Đi bộ | 3.5 / 4.5 / 5.5 |
| Chạy bộ | 7.0 / 9.0 / 12.0 |
| Đạp xe | 4.0 / 6.0 / 10.0 |
| Bơi | 5.0 / 7.0 / 10.0 |
| HIIT | 6.0 / 8.0 / 12.0 |
| Nhảy dây | 8.0 / 10.0 / 12.0 |

**Calories đốt khi tập sức mạnh**[^4]:
```
Calories/phút = (5.0 × Cân nặng(kg) × Thời gian(phút)) ÷ 60
```

---

## 5. Theo dõi Tiến trình & Gamification

### 5.1 Điểm Hàng ngày (Daily Score) ✅

> **Trạng thái**: ✅ Đã implement — `src/features/dashboard/utils/scoreCalculator.ts:83-164`
> 5 thành phần weighted + streak bonus, color coding

**Công thức tổng hợp**[^15]:

```
Điểm = Round(Σ(điểm_thành_phần × trọng_số) ÷ tổng_trọng_số)
Tối thiểu: 1 điểm
```

| Thành phần | Trọng số | Cách tính |
|-----------|---------|-----------|
| Calories | 0.30 | Độ lệch so với mục tiêu |
| Protein | 0.25 | Tỷ lệ thực tế/mục tiêu |
| Buổi tập | 0.25 | Hoàn thành/Nghỉ/Bỏ lỡ |
| Cân nặng | 0.10 | Đã ghi/Chưa ghi |
| Chuỗi ngày | 0.10 | Min(ngày × 5, 100) |

**Chi tiết từng thành phần**:

**Calories Score**:

| Độ lệch | Điểm |
|---------|------|
| ≤ 50 kcal | 100 |
| ≤ 100 kcal | 90 |
| ≤ 200 kcal | 70 |
| ≤ 500 kcal | 40 |
| > 500 kcal | 10 |

**Protein Score**:

| Tỷ lệ đạt | Điểm |
|-----------|------|
| ≥ 100% | 100 |
| ≥ 90% | 80 |
| ≥ 70% | 60 |
| ≥ 50% | 40 |
| < 50% | 20 |

**Workout Score**:

| Trạng thái | Điểm |
|-----------|------|
| Đã hoàn thành | 100 |
| Ngày nghỉ (theo kế hoạch) | 100 |
| Chưa tập (trước 8 PM) | 50 |
| Bỏ lỡ | 0 |

**Màu sắc**:

| Khoảng điểm | Màu | Ý nghĩa |
|-------------|-----|---------|
| ≥ 80 | Xanh lá (Emerald) | Tuyệt vời |
| 50–79 | Vàng (Amber) | Khá |
| < 50 | Xám (Slate) | Cần cải thiện |

---

### 5.2 Streak — Chuỗi ngày Tập ✅

> **Trạng thái**: ✅ Đã implement — `src/features/fitness/utils/gamification.ts:58-176`
> Grace period 1 ngày, weekly dots UI, streak bonus trong scoring

```
Chuỗi hiện tại:
  Đếm ngược từ hôm nay, mỗi ngày được tính nếu:
    ✅ Có buổi tập HOẶC
    ✅ Ngày nghỉ theo kế hoạch
  
  Grace Period: 1 ngày bỏ lỡ được phép (chuỗi "sắp mất")
  
  DỪNG khi: 2 ngày liên tiếp bỏ lỡ buổi tập đã lên kế hoạch

Streak Bonus = Min(Số ngày × 5, 100)
```

### 5.3 Phát hiện Kỷ lục Cá nhân (PR Detection) ✅

> **Trạng thái**: ✅ Đã implement — `src/features/fitness/utils/gamification.ts:192-225`
> Bao gồm: `detectPRs()`, `isPersonalRecord()`, PRToast UI component

```
Cho mỗi set trong buổi tập hiện tại:
  previousBest = Max trọng lượng cho bài tập đó ở cùng rep range
  
  NẾU trọng lượng hiện tại > previousBest:
    → PR DETECTED!
    → Cải thiện = trọng lượng hiện tại − previousBest
```

### 5.4 Hệ thống Milestone ✅

> **Trạng thái**: ✅ Đã implement — `src/features/fitness/utils/gamification.ts`
> 10 milestones: 5 session + 5 streak, mỗi milestone có emoji badge

| ID | Emoji | Ngưỡng | Điều kiện |
|----|-------|--------|-----------|
| sessions-1 | 🥇 | 1 | Buổi tập đầu tiên |
| sessions-10 | 💪 | 10 | 10 buổi tập |
| sessions-25 | ⚡ | 25 | 25 buổi tập |
| sessions-50 | 🔥 | 50 | 50 buổi tập |
| sessions-100 | 💎 | 100 | 100 buổi tập |
| streak-7 | 📅 | 7 | Chuỗi 7 ngày |
| streak-14 | 🌟 | 14 | Chuỗi 14 ngày |
| streak-30 | 🦁 | 30 | Chuỗi 30 ngày |
| streak-60 | 👑 | 60 | Chuỗi 60 ngày |
| streak-90 | 🏆 | 90 | Chuỗi 90 ngày |

---

# Phần B: Business Logic

## 6. Luồng Onboarding (Thu thập Thông tin Người dùng) ✅

> **Trạng thái**: ✅ Đã implement — `src/features/fitness/components/FitnessOnboarding.tsx` (565 dòng)
> Multi-step wizard, experience-gated steps, smart defaults

### Dữ liệu Thu thập

| Trường | Kiểu | Bắt buộc | Điều kiện |
|--------|------|----------|-----------|
| Mục tiêu tập (trainingGoal) | Enum: strength/hypertrophy/endurance/general | ✅ | Tất cả |
| Kinh nghiệm (trainingExperience) | Enum: beginner/intermediate/advanced | ✅ | Tất cả |
| Ngày/tuần (daysPerWeek) | 2–6 | ✅ | Tất cả |
| Thời gian buổi tập (sessionDurationMin) | 30/45/60/90 phút | ✅ | Tất cả |
| Thiết bị (availableEquipment) | Mảng: 6 loại | ✅ | Tất cả |
| Chấn thương (injuryRestrictions) | Mảng: 6 vùng cơ thể | ❌ | Tất cả |
| Cardio/tuần (cardioSessionsWeek) | 0–5 | ✅ | Tất cả |
| Mô hình phân kỳ (periodizationModel) | linear/undulating/block | ✅ | Intermediate+ |
| Chu kỳ (planCycleWeeks) | 4/6/8/12 tuần | ✅ | Intermediate+ |
| Nhóm cơ ưu tiên (priorityMuscles) | Tối đa 3 | ❌ | Intermediate+ |
| 1RM đã biết (known1rm) | 4 bài tập chính | ❌ | Advanced |
| Giấc ngủ (avgSleepHours) | Số dương | ❌ | Advanced |

### Logic Điều kiện Bước

```
Mức kinh nghiệm = { beginner: 0, intermediate: 1, advanced: 2 }

Bước được hiển thị NẾU step.minExperience ≤ mức người dùng
```

→ **Beginner**: 7 bước (bỏ qua periodization, cycle, priority, 1RM, sleep)
→ **Intermediate**: 10 bước (thêm periodization, cycle, priority)
→ **Advanced**: 12 bước (tất cả)

---

## 7. Tạo Kế hoạch Tập luyện (Training Plan Generation) ✅

> **Trạng thái**: ✅ Đã implement — `src/features/fitness/hooks/useTrainingPlan.ts` (583 dòng)
> Thuật toán 7 bước, 3 mô hình periodization, volume-based programming

### Thuật toán 7 Bước

```
INPUT → TrainingProfile (từ Onboarding)
OUTPUT → TrainingPlan { planDays[], exercises[], schedule }

BƯỚC 1: Chọn Split tập
  ├─ 1–3 ngày/tuần → Full Body (A/B luân phiên)
  ├─ 4 ngày → Upper/Lower
  ├─ 5 ngày → Push/Pull/Legs + thêm
  └─ 6+ ngày → PPL (DUP)

BƯỚC 2: Tính Volume
  Cho mỗi nhóm cơ:
    base = VOLUME_TABLE[experience][muscle]
    Điều chỉnh:
      × 0.8 nếu Cut
      × 1.1 nếu Bulk
      × 0.9 nếu tuổi > 40
      × 0.9 nếu ngủ < 7 giờ
    Clamp(MEV, MAV)

BƯỚC 3: Gán Ngày trong Tuần
  1 buổi → [Thứ 2]
  2 buổi → [Thứ 2, Thứ 5]
  3 buổi → [Thứ 2, Thứ 4, Thứ 6]
  4 buổi → [Thứ 2, 3, 5, 6]
  5 buổi → [Thứ 2, 3, 4, 6, 7]
  6+ buổi → Trải đều

BƯỚC 4: Chọn Bài tập
  1. Lọc: nhóm cơ phù hợp + thiết bị có + không chấn thương
  2. Sắp xếp: Compound → Secondary → Isolation
  3. Số bài tập = Max(1, Ceil(sets cần / 3))
  4. Phân phối sets cho bài tập

BƯỚC 5: Gán Rep Range (theo Periodization + Tuần)
  Block: Hypertrophy(T1-4) → Strength(T5-8) → Endurance(T9-12)
  Linear: Giảm dần rep, tăng dần weight
  DUP: Thay đổi mỗi buổi

BƯỚC 6: Lịch Cardio
  1. Ưu tiên ngày nghỉ trước
  2. Nếu thiếu → thêm vào ngày tập
  3. Ước tính calories đốt cho mỗi buổi

BƯỚC 7: Kiểm tra Deload
  NẾU 4 tuần liên tiếp RPE ≥ 8.0 → Giảm 40% volume
```

---

## 8. Ghi nhận Buổi tập (Workout Logging) ✅

> **Trạng thái**: ✅ Đã implement — `WorkoutLogger.tsx` + `CardioLogger.tsx` + `saveWorkoutAtomic()`
> Strength: sets/reps/weight/RPE | Cardio: duration/distance/HR/MET | Atomic save

### Luồng Sức mạnh (Strength)

```
┌─ Khởi tạo
│  ├─ Nạp bài tập từ kế hoạch HOẶC chọn thủ công
│  ├─ Bật đồng hồ đếm thời gian
│  └─ Auto-save draft mỗi 500ms
│
├─ Vòng lặp Ghi Set
│  ├─ Hiển thị gợi ý Progressive Overload
│  ├─ Nhập: Trọng lượng × Reps (tùy chọn RPE)
│  ├─ Lưu WorkoutSet vào state
│  ├─ Kích hoạt Rest Timer
│  └─ Lặp lại cho set tiếp theo
│
├─ Kết thúc Buổi tập
│  ├─ Tính tổng volume, thời gian, số sets
│  ├─ Phát hiện PR (detectPRs)
│  └─ Hiển thị Summary Card
│
└─ Lưu Atomic
   ├─ BEGIN TRANSACTION
   ├─ INSERT workout
   ├─ INSERT tất cả workout_sets
   ├─ COMMIT
   └─ Xóa draft
```

### Luồng Cardio

```
┌─ Chọn loại (running, cycling, swimming, HIIT, ...)
├─ Chọn mode: Đồng hồ bấm giờ HOẶC Nhập thủ công
├─ Nhập tùy chọn: Khoảng cách, Nhịp tim, Cường độ
├─ Tính calories ước tính = estimateCardioBurn()
└─ Lưu Atomic (1 workout + 1 set)
```

### Validation Rules

| Trường | Min | Max | Bước |
|--------|-----|-----|------|
| Trọng lượng | 0 kg | ∞ | 2.5 kg |
| Reps | 1 | ∞ | 1 |
| RPE | 6 | 10 | Chọn 1 trong [6,7,8,9,10] |
| Thời gian cardio | 1 phút | ∞ | 1 phút |

---

## 9. Progressive Overload Tự động ✅

> **Trạng thái**: ✅ Đã implement — `src/features/fitness/hooks/useProgressiveOverload.ts`
> Decision tree + enrichment (plateau, fatigue, overtraining)

### Cây Quyết định

```
                    ┌─────────────────────┐
                    │  Có lịch sử set?    │
                    └──────┬──────────────┘
                           │
                    ┌──────▼──────┐
                    │     Có      │    Không → Manual entry
                    └──────┬──────┘
                           │
                 ┌─────────▼─────────┐
                 │ Reps ≥ Rep Max?   │
                 └────┬─────────┬────┘
                      │         │
                ┌─────▼───┐  ┌──▼─────────┐
                │   CÓ    │  │   KHÔNG    │
                └─────┬───┘  └──┬─────────┘
                      │         │
            ┌─────────▼───┐  ┌──▼──────────┐
            │ TĂNG WEIGHT │  │ TĂNG REPS   │
            │ + Increment │  │ + 1 rep     │
            │ Reset reps  │  │ Giữ weight  │
            └─────────────┘  └─────────────┘
```

### Enrichment (Bổ sung thông tin)

Sau khi tính gợi ý, hệ thống kiểm tra thêm:

1. **Plateau**: Trọng lượng giống nhau ≥ 3 tuần (±2% tolerance)?
2. **Mệt mỏi cấp tính**: RPE trung bình ≥ 9.0 HOẶC volume spike > 130%?
3. **Overtraining mãn tính**: Volume giảm ≥ 4 tuần liên tiếp?

→ Hiển thị cảnh báo tương ứng trên gợi ý.

---

## 10. Phát hiện Plateau & Overtraining ✅

> **Trạng thái**: ✅ Đã implement — `plateauAnalysis.ts` + `useProgressiveOverload.ts`
> Strength plateau (±2%), Volume plateau, Acute fatigue (RPE/spike), Chronic overtraining (6 tuần)

### Strength Plateau

```
INPUT: Lịch sử sets của 1 bài tập (≥ 3 buổi)

1. Lấy trọng lượng max mỗi buổi
2. Đếm buổi liên tiếp có trọng lượng tương tự (±2%)
3. NẾU ≥ 3 buổi → PLATEAU
```

**Hàm so sánh trọng lượng** (±2% tolerance):
```
isWeightSimilar(a, b):
  reference = max(|a|, |b|)
  NẾU reference = 0: return true
  return |a − b| ÷ reference ≤ 0.02
```

### Volume Plateau

```
thisWeekVolume = Σ(reps × weight) trong 7 ngày qua
lastWeekVolume = Σ(reps × weight) 7–14 ngày trước

Volume Plateau = (lastWeekVolume > 0) AND (thisWeekVolume ≤ lastWeekVolume)
```

### Mệt mỏi Cấp tính (Acute Fatigue)

```
Dữ liệu: 9 sets gần nhất (≈ 3 buổi)

RPE trung bình = Σ(RPE có giá trị) ÷ count
Volume Spike = Volume buổi cuối ÷ Trung bình 2 buổi trước

HIGH:    RPE ≥ 9.0 HOẶC Spike > 1.3
MODERATE: RPE ≥ 8.0
NONE:    Dưới ngưỡng
```

### Overtraining Mãn tính (Chronic)

```
Dữ liệu: 6 tuần gần nhất

Đếm tuần liên tiếp mà:
  Volume tuần này < Volume tuần trước × 0.95

HIGH:    ≥ 4 tuần giảm liên tiếp
MODERATE: 2–3 tuần
NONE:    < 2 tuần
```

---

## 11. Vòng Phản hồi — Tự điều chỉnh Calories (Feedback Loop) ✅

> **Trạng thái**: ✅ Đã implement — `src/features/dashboard/hooks/useFeedbackLoop.ts` (241 dòng)
> 14-day evaluation, ±150 kcal auto-adjust, safety bounds

### Cấu hình

| Tham số | Giá trị | Ý nghĩa |
|---------|---------|---------|
| evaluationPeriodDays | 14 | Cửa sổ đánh giá |
| minWeightEntries | 10 | Số liệu tối thiểu |
| weightChangeThreshold | 0.2 kg | Ngưỡng thay đổi |
| calorieAdjustment | 150 kcal | Mỗi lần điều chỉnh |
| maxDeficit | 1000 kcal | Thâm hụt tối đa |
| minCalories | 1200 kcal | Sàn tuyệt đối |
| maxSurplus | 700 kcal | Thặng dư tối đa |

### Thuật toán Tự điều chỉnh

```
1. Thu thập dữ liệu cân nặng 14 ngày
2. NẾU < 10 entries → Chờ thêm dữ liệu
3. Tính trung bình tuần này và tuần trước
4. weightChange = Trung bình tuần này − Trung bình tuần trước

CÂY QUYẾT ĐỊNH:

  ┌─ Mục tiêu = CUT ──────────────────────────────┐
  │                                                 │
  │  weightChange ≥ −0.2 kg (không giảm đủ)?       │
  │    → Giảm 150 kcal                             │
  │    → Sàn = Max(1200, TDEE − 1000)              │
  │                                                 │
  │  weightChange < −0.2 kg → Đang giảm tốt ✅     │
  └─────────────────────────────────────────────────┘

  ┌─ Mục tiêu = BULK ─────────────────────────────┐
  │                                                 │
  │  weightChange ≤ +0.2 kg (không tăng đủ)?       │
  │    → Tăng 150 kcal                             │
  │    → Trần = TDEE + 700                         │
  │                                                 │
  │  weightChange > +0.2 kg → Đang tăng tốt ✅     │
  └─────────────────────────────────────────────────┘

  ┌─ Mục tiêu = MAINTAIN ─────────────────────────┐
  │  → Không điều chỉnh                            │
  └─────────────────────────────────────────────────┘
```

### Adherence — Mức Tuân thủ

```
Calorie Adherence:
  Hit = Ngày mà actual calories trong [target × 0.9, target × 1.1]
  Adherence % = Hits ÷ Tổng ngày × 100

Protein Adherence:
  Hit = Ngày mà actual protein ≥ target × 0.9
  Adherence % = Hits ÷ Tổng ngày × 100
```

---

## 12. Cầu nối Dinh dưỡng — Tập luyện (Nutrition-Fitness Bridge) ✅

> **Trạng thái**: ✅ Đã implement — `src/features/fitness/hooks/useFitnessNutritionBridge.ts` (131 dòng)
> 4 insight rules: deficit-on-training, protein-low, recovery-day, balanced

### Luồng Dữ liệu

```
Buổi tập + Kế hoạch ăn → Phân tích → Gợi ý Thông minh

INPUT:
  ├─ Workouts[] (buổi tập hôm nay)
  ├─ HealthProfile (cân nặng, chiều cao, tuổi)
  └─ TodayNutrition { eaten, protein } (từ meal plan)
```

### Quy tắc Gợi ý (Insight Rules)

| Ưu tiên | Điều kiện | Loại | Mức độ |
|---------|-----------|------|--------|
| 1 | Ngày tập + Eaten < 75% Budget | deficit-on-training | ⚠️ Warning |
| 2 | Protein < 60% Mục tiêu | protein-low | ⚠️ Warning |
| 3 | Ngày nghỉ + ≥ 4 buổi/tuần | recovery-day | ℹ️ Info |
| 4 | Tất cả tốt | — | Không hiện |

---

## 13. Gamification & Streak ✅

> **Trạng thái**: ✅ Đã implement — `scoreCalculator.ts` + `gamification.ts`
> Daily score (5 weighted factors), 10 milestones, streak với grace period

### Luồng Streak Chi tiết

```
Đếm ngày liên tiếp (ngược từ hôm nay):

CÓ kế hoạch tập:
  ├─ Ngày có buổi tập → +1 ngày ✅
  ├─ Ngày nghỉ theo kế hoạch → +1 ngày ✅
  ├─ Ngày đầu tiên bỏ lỡ → Dùng Grace Period (chuỗi "sắp mất") ⚠️
  └─ Ngày thứ 2 bỏ lỡ → DỪNG chuỗi ❌

KHÔNG có kế hoạch:
  ├─ Ngày có buổi tập → +1 ngày ✅
  └─ Ngày không tập → DỪNG chuỗi ❌

Dots tuần (T2–CN):
  ├─ today → Xám nhạt (chưa qua)
  ├─ completed → Xanh (có buổi tập)
  ├─ rest → Xanh nhạt (nghỉ theo kế hoạch)
  ├─ missed → Đỏ (bỏ lỡ)
  └─ upcoming → Xám (tương lai)
```

---

## 14. Quản lý Trạng thái & Lưu trữ Dữ liệu ✅

> **Trạng thái**: ✅ Đã implement — 8 Zustand stores + SQLite (sql.js WASM) + localStorage
> Hybrid persistence, atomic saves, rehydration guard

### Mô hình Dữ liệu Chính

```
TrainingProfile
  ├─ trainingGoal: strength | hypertrophy | endurance | general
  ├─ trainingExperience: beginner | intermediate | advanced
  ├─ daysPerWeek: 2–6
  ├─ sessionDurationMin: 30 | 45 | 60 | 90
  ├─ availableEquipment: Equipment[]
  ├─ injuryRestrictions: BodyRegion[]
  ├─ periodizationModel: linear | undulating | block
  ├─ planCycleWeeks: 4 | 6 | 8 | 12
  └─ priorityMuscles: MuscleGroup[] (max 3)

TrainingPlan
  ├─ id, name, status (active | paused | completed)
  ├─ currentWeek: number
  ├─ startDate: string (ISO)
  └─ planDays: TrainingPlanDay[]

Workout
  ├─ id, date (YYYY-MM-DD), name
  ├─ durationMin, notes
  └─ sets: WorkoutSet[]

WorkoutSet
  ├─ id, workoutId, exerciseId
  ├─ setNumber, reps, weightKg, rpe
  ├─ restSeconds (strength)
  └─ durationMin, distanceKm, avgHeartRate, intensity, estimatedCalories (cardio)

WeightEntry
  ├─ id, date, weightKg, notes
  └─ createdAt
```

### Chiến lược Lưu trữ

```
┌─ Zustand (In-Memory) ─── Phản hồi UI tức thì
│
├─ SQLite (sql.js WASM) ── Persistent, transactional
│  ├─ Bảng: workouts, workout_sets, weight_entries
│  ├─ Bảng: training_plans, plan_days
│  └─ Bảng: workout_drafts (auto-save)
│
├─ localStorage ────────── Lightweight state
│  ├─ mp-user-profile (cân nặng, protein ratio, calories)
│  ├─ mp-fitness-onboarded (boolean)
│  └─ mp-training-profile (JSON)
│
└─ Rehydration Guard ───── Bảo vệ dữ liệu
   ├─ Number() coercion cho các trường số
   └─ Range clamp: targetCalories [500, 10000]
```

---

# Phần C: Bảng Tổng hợp Tất cả Công thức

| # | Danh mục | Công thức | Trạng thái | File tham khảo |
|---|---------|-----------|-----------|----------------|
| 1 | BMR | Mifflin-St Jeor | ✅ Đã implement | nutritionEngine.ts:33-44 |
| 2 | TDEE | BMR × Activity Multiplier | ✅ Đã implement | nutritionEngine.ts:46-51 |
| 3 | Caloric Target | TDEE ± Offset | ✅ Đã implement | nutritionEngine.ts:74-80 |
| 4 | Macros | Priority P→F→C | ✅ Đã implement | nutritionEngine.ts:82-114 |
| 5 | LBM | Weight × (1 − BF%) | ✅ Đã implement | nutritionEngine.ts:90-92 |
| 6 | Activity Blend | 0.7×Auto + 0.3×User | ✅ Đã implement | nutritionEngine.ts:63-72 |
| 7 | 1RM Brzycki | W÷(1.0278−0.0278R) | ✅ Đã implement | trainingMetrics.ts:31-36 |
| 8 | Volume | Σ(Reps×Weight) | ✅ Đã implement | trainingMetrics.ts:5-8 |
| 9 | Weekly Sets | Base×Adjustments, clamped | ✅ Đã implement | volumeCalculator.ts:54-73 |
| 10 | Volume Distribution | Floor(total/n) + remainder | ✅ Đã implement | volumeCalculator.ts:75-83 |
| 11 | Progressive Overload | Rep max → +Weight, else +Rep | ✅ Đã implement | useProgressiveOverload.ts:48-75 |
| 12 | Plateau Detection | ≥3 weeks same weight (±2%) | ✅ Đã implement | useProgressiveOverload.ts:77-104 |
| 13 | Acute Fatigue | RPE ≥ 9.0 OR spike > 1.3x | ✅ Đã implement | useProgressiveOverload.ts:106-138 |
| 14 | Chronic Overtraining | ≥4 weeks declining volume | ✅ Đã implement | useProgressiveOverload.ts:140-176 |
| 15 | Deload | Sets × 0.6, Intensity × 0.9 | ✅ Đã implement | periodization.ts:72-79 |
| 16 | Current Week | Floor(elapsed / 7days) + 1 | ✅ Đã implement | useTrainingPlan.ts:98-102 |
| 17 | Cardio Burn (MET) | (Min×MET×Kg)÷60 | ✅ Đã implement | cardioEstimator.ts:14-23 |
| 18 | Strength Burn | (5.0×Kg×Min)÷60 | ✅ Đã implement | activityMultiplier.ts:150-151 |
| 19 | Duration Estimate | Warmup + Σ(sets×(40s+rest)+30s)/60 | ✅ Đã implement | TrainingPlanView.tsx:26-33 |
| 20 | Daily Score | Weighted average (5 factors) | ✅ Đã implement | scoreCalculator.ts:83-164 |
| 21 | Streak | Consecutive days + grace period | ✅ Đã implement | gamification.ts:58-176 |
| 22 | PR Detection | Current 1RM > historical best | ✅ Đã implement | gamification.ts:192-225 |
| 23 | Streak Bonus | Min(days × 5, 100) | ✅ Đã implement | scoreCalculator.ts:65-70 |
| 24 | Moving Average | Σ(weights)/n (min 3 entries) | ✅ Đã implement | useFeedbackLoop.ts:33-38 |
| 25 | Auto-Adjust | ±150 kcal per evaluation | ✅ Đã implement | useFeedbackLoop.ts:58-133 |
| 26 | Adherence | Hit%: actual in ±10% target | ✅ Đã implement | useFeedbackLoop.ts:135-179 |
| 27 | RPE→RIR | RIR = 10 − RPE | ⚠️ Một phần | Có RPE, chưa có RIR mapping |

**Tổng: ✅ 26 đã implement | ⚠️ 1 một phần**

> **Ghi chú**: 8 công thức từ Internet (BMI, FFMI, 1RM Epley, Max HR, HR Zones, Recovery Time, Navy Body Fat, Wilks Score)
> đã được đánh giá và **loại bỏ khỏi scope** — xem lý do chi tiết tại [Phần E](#phần-e-công-thức-đã-loại-bỏ-khỏi-scope).

---

# Phần D: Nguồn Tham khảo

[^1]: `src/services/nutritionEngine.ts` — Mifflin-St Jeor BMR, TDEE, Macros calculation (Lines 33-114)
[^2]: BMR Pro Tools — https://bmrprotools.com/ (Mifflin-St Jeor reference)
[^3]: `src/services/nutritionEngine.ts:63-72` — Auto-adjusted activity multiplier (70/30 blend)
[^4]: `src/features/fitness/utils/activityMultiplier.ts:37-58` — Activity level detection from training data
[^5]: `src/features/dashboard/hooks/useFeedbackLoop.ts:21-29` — Auto-adjust configuration & safety limits
[^6]: `src/features/fitness/utils/trainingMetrics.ts:31-36` — Brzycki 1RM formula implementation
[^8]: BodySpec RPE Guide — https://www.bodyspec.com/blog/post/rate_of_perceived_exertion_practical_guide_and_calculator
[^9]: `src/features/fitness/utils/volumeCalculator.ts:14-53` — Schoenfeld 2017 volume landmarks
[^10]: `src/features/fitness/hooks/useProgressiveOverload.ts:48-75` — Progressive overload algorithm
[^11]: `src/features/fitness/hooks/useTrainingPlan.ts:98-102` — Current week computation
[^12]: `src/features/fitness/utils/periodization.ts:72-79` — Deload reduction formula
[^15]: `src/features/dashboard/utils/scoreCalculator.ts:83-164` — Daily score aggregation

---

# Phần E: Công thức Đã Loại bỏ Khỏi Scope

> Các công thức sau đã được đánh giá ngày 2026-03-28 và **loại bỏ** vì không phù hợp scope app
> (Smart Meal Planner = meal planning + macro tracking + training logging).

| Công thức | Lý do loại bỏ |
|-----------|---------------|
| **BMI** (Weight ÷ Height²) | App focus là macro tracking + training, không phải health screening. BMI không ảnh hưởng tới bất kỳ logic nào (TDEE dùng Mifflin-St Jeor, macro dùng weight_kg trực tiếp). Vanity metric, không actionable. |
| **FFMI** (LBM ÷ Height²) | Fitness onboarding không thu thập `heightCm` (chỉ nutrition profile có). FFMI dùng cho bodybuilding competitive — vượt scope app meal planner. |
| **1RM Epley** (W × (1+0.0333R)) | Brzycki đã implement với accuracy ±5%. Epley cho kết quả tương đương (~0.1% khác biệt ở 10 reps). Thêm Epley chỉ tạo confusion, không thêm giá trị. |
| **Max HR** (220 − Age / Tanaka) | App không kết nối wearable (Apple Watch/Fitbit). CardioLogger chỉ ghi HR thủ công. Max HR chỉ hữu ích khi có HR Zones — defer tới khi thêm wearable integration. |
| **HR Zones** (Karvonen) | Cần `Resting HR` (chưa thu thập) + `Max HR` (chưa tính). Không có UI hiển thị zones. Toàn bộ cardio tracking dùng MET-based calories — hoạt động tốt. |
| **Recovery Time** ((AvgHR × Min) ÷ 200) | Hệ thống hiện tại đã có: rest timers (90-180s), sleep tracking, auto-deload detection (RPE ≥ 8 × 4 tuần), acute/chronic fatigue detection. Công thức HR-based kém chính xác hơn. |
| **Navy Body Fat** (Circumference-based %) | Cần đo circumference (cổ, eo, hông) — app không có UI nhập, không có data model. `bodyFatPct` hiện nhập trực tiếp trong HealthProfile — đơn giản hơn và đủ dùng. |
| **Wilks Score** (Total × 500 ÷ polynomial) | Chỉ hữu ích cho nhánh `trainingGoal: 'strength'` (~20% users). Dùng cho powerlifting competitive ranking — vượt scope app meal planner. Có thể xem xét lại nếu thêm tính năng powerlifting. |
