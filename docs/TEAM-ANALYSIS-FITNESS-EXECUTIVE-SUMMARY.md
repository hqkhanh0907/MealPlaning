# 🏋️ PHÂN TÍCH TOÀN DIỆN: Flow Buổi Tập & Bài Tập — Executive Summary

> **Ngày**: 2026-04-04
> **Team**: CEO → BM → Tech Leader → Dev → QA (6 agents, ~50 phút)
> **Scope**: Toàn bộ fitness module — 61 files, 12,739 LOC

---

## 📊 TỔNG QUAN KẾT QUẢ

| Metric | Giá trị |
|--------|---------|
| Entities phân tích | **10** (TrainingProfile → PlanTemplate) |
| User flows | **16** (từ tạo plan đến gamification) |
| Cross-feature bridges | **5** (Nutrition, Dashboard, Calendar, Onboarding, HealthProfile) |
| Business rules tài liệu hóa | **58** |
| Bugs confirmed | **7** (5 gốc + 2 mới phát hiện) |
| Bugs denied | **1** (BUG-08: activity level CÓ suggest xuống) |
| Architecture issues | **14** |
| Test files | **27** (600+ tests, all passing) |
| fitnessStore coverage | **82.69% Stmts / 69.37% Branch** (yếu nhất) |

---

## 🔴 TOP CRITICAL FINDINGS

### 1. SILENT DATA LOSS — 10/24 store actions không persist SQLite
**Severity**: 🔴 P0 — Data mất khi restart

| Action | Persist? | Impact |
|--------|:--------:|--------|
| `updateWorkoutSet` | ❌ | Edit set → mất khi restart |
| `removeWorkoutSet` | ❌ | Xóa set → mất khi restart |
| `updateWorkout` | ❌ | Edit workout → mất |
| `addWeightEntry` | ❌ | Cân nặng → mất |
| `updateWeightEntry` | ❌ | Edit cân nặng → mất |
| `removeWeightEntry` | ❌ | Xóa cân nặng → mất |
| `addTrainingPlan` | ❌ | **KẾ HOẠCH TẬP → MẤT!** |
| `updateTrainingPlan` | ❌ | Edit plan → mất |
| `setActivePlan` | ❌ | Chọn plan active → mất |
| `changeSplitType` | ⚠️ | Fire-and-forget, không rollback |

**Root cause**: Pattern Zustand-first, persist-second — nhưng "persist" bị quên implement cho 10 actions.

### 2. NON-ATOMIC OPERATIONS — Chỉ 1/24 action dùng transaction
- `saveWorkoutAtomic()` là action DUY NHẤT dùng `_db.transaction()`
- `deleteWorkout`: 2 sequential DELETEs, no transaction → orphan data nếu fail giữa chừng
- `changeSplitType`: 3+ concurrent promises, no rollback → plan days bị mất nếu lỗi

### 3. SUNDAY BUG — Day-of-week mismatch
- `useDailyScore` dùng `getDay()` → Sunday = 0
- Training plan days dùng ISO → Sunday = 7
- **Impact**: Buổi tập Chủ Nhật KHÔNG BAO GIỜ được nhận diện → score sai

### 4. NUTRITION BRIDGE BLIND SPOT
- `useFitnessNutritionBridge` so sánh eaten vs target nhưng **HOÀN TOÀN BỎ QUA calories burned**
- User tập nặng (đốt 500 kcal) vẫn bị cảnh báo "deficit-on-training" nếu ăn < 75% target
- **Đúng ra**: nên so sánh `eaten vs (target + burned)` hoặc ít nhất hiển thị burned context

---

## 🟡 IMPORTANT FINDINGS

| # | Finding | Source | Severity |
|---|---------|--------|----------|
| 5 | `getTemplates()` async-in-sync bug — user templates never returned | Dev | P1 |
| 6 | 27 `.catch()` nuốt lỗi im lặng — không log đủ context | Tech Leader | P1 |
| 7 | `useProgressiveOverload` rebuild O(n) Map mỗi render | Tech Leader | P2 |
| 8 | Missing FK CASCADE trên `workout_sets.exercise_id` | Tech Leader | P2 |
| 9 | Daily score phạt user không có plan (score=0 sau 20h) | BM+Dev | P2 |
| 10 | `PlanTemplateGallery.tsx` 76.34% coverage — yếu nhất | QA | P2 |

---

## 🏗️ DATA MODEL TỔNG HỢP

```
TrainingProfile (14 fields)
    │ drives generation
    ▼
TrainingPlan (status: active/paused/completed)
    │ 1:N (CASCADE)
    ▼
TrainingPlanDay (dayOfWeek, sessionOrder 1-3, exercises JSON)
    │                                    │
    │ exercises = JSON[]                 │ 0:1 via planDayId
    ▼                                    ▼
Exercise (~200 built-in)              Workout (date, duration, notes)
    │                                    │ 1:N (CASCADE)
    │                                    ▼
    └──────────────────────────────► WorkoutSet
                                     ├─ Strength: reps, weightKg, rpe
                                     └─ Cardio: duration, distance, calories

WeightEntry (date UNIQUE, weightKg)
PlanTemplate (6 built-in + custom)
WorkoutDraft (crash recovery)
```

**Quan hệ quan trọng**: Exercises lưu JSON trong TrainingPlanDay (KHÔNG FK) → nếu exercise bị xóa, plan day vẫn reference ID cũ → potential crash khi render.

---

## 🔄 16 USER FLOWS

### Nhóm Core (buổi tập & bài tập trực tiếp):
| # | Flow | Trigger | Complexity |
|---|------|---------|------------|
| 1 | Tạo kế hoạch tập | Onboarding / Manual | High (7 steps, auto-select exercises) |
| 2 | Ghi nhận buổi tập sức mạnh | Click ▶ trên day card | High (sets, RPE, rest timer, PR detect) |
| 3 | Ghi nhận buổi tập cardio | Click ❤ trên day card | Medium (MET formula, live estimate) |
| 4 | Chỉnh sửa bài tập trong ngày | Click ✏ trên day card | Medium (swap, delete, reorder, add) |
| 5 | Thay đổi Split | Edit menu → Đổi Split | High (remap/regenerate, preview) |
| 16 | Template system | 6 built-in + custom | Medium |

### Nhóm Intelligence (tự động):
| # | Flow | Logic | Issue? |
|---|------|-------|--------|
| 6 | Progressive overload | Gợi ý +2.5kg/+1 rep | ⚠️ Performance: O(n) mỗi render |
| 7 | Plateau detection | 3+ tuần cùng weight | OK |
| 8 | Auto-deload | 4+ tuần nặng → -40% volume | OK |
| 14 | Draft recovery | Crash → restore workout | Cần verify |

### Nhóm Cross-Feature:
| # | Flow | Bridge | Issue? |
|---|------|--------|--------|
| 9 | Tính calories đốt | Workout → useTodayCaloriesOut | OK |
| 10 | Cầu nối Nutrition | Bridge → SmartInsightBanner | 🔴 Bỏ qua burned calories |
| 11 | Điều chỉnh Activity Level | 4-week history → suggest | OK (CÓ suggest xuống) |
| 12 | Gamification | Streak, milestones, PR | ⚠️ Sunday bug |
| 13 | Daily Score | workout+streak+weight+rest | ⚠️ Phạt planless users |
| 15 | Multi-session/day | Max 3/day | OK |

---

## 🔗 CROSS-FEATURE IMPACT MAP

```
                    ┌──────────────────┐
                    │  Health Profile   │
                    │  (weightKg, age)  │
                    └────────┬─────────┘
                             │ weightKg used for MET calc
                             ▼
┌───────────┐    ┌──────────────────────┐    ┌──────────────┐
│ Onboarding│───►│    FITNESS MODULE     │───►│  Nutrition   │
│ (14 fields│    │                      │    │ (TDEE, Target│
│  profile) │    │ Workouts → calories  │    │  Macros)     │
└───────────┘    │ burned → eaten-burned│    └──────────────┘
                 │ = net energy balance │           │
                 │                      │           │
                 │ Activity suggestion  ├───────────┘
                 │ → TDEE recalculate   │    (activity level
                 └──────┬───────┬───────┘     changes TDEE)
                        │       │
                   ┌────┘       └────┐
                   ▼                 ▼
            ┌────────────┐   ┌────────────┐
            │  Dashboard  │   │  Calendar  │
            │ DailyScore  │   │ NutriBars  │
            │ StreakMini   │   │ EnergyCard │
            │ TodaysPlan   │   │ MealSlots  │
            │ WeightMini   │   │            │
            └────────────┘   └────────────┘
```

---

## 📋 PRIORITY FIX LIST

### 🔴 P0 — Critical (data loss)
1. **Thêm SQLite persistence cho 10 actions thiếu** — Effort: M
2. **Wrap deleteWorkout trong transaction** — Effort: S
3. **Fix Sunday day-of-week mismatch** — Effort: S

### 🟡 P1 — High (data integrity)
4. **Wrap changeSplitType trong transaction + rollback** — Effort: M
5. **Fix getTemplates() async-in-sync** — Effort: S
6. **Nutrition bridge tính burned calories** — Effort: S
7. **Thêm write-queue cho fire-and-forget writes** — Effort: L

### 🟠 P2 — Medium (correctness/UX)
8. **Memoize useProgressiveOverload** — Effort: S
9. **Fix daily score cho planless users** — Effort: S
10. **Thêm FK CASCADE cho exercise_id** — Effort: M

### 🔵 P3 — Low (maintenance)
11. **Tăng fitnessStore coverage 82% → 100%** — Effort: L
12. **Refactor duplicate DB write patterns** — Effort: M
13. **Clean up 27 silent .catch() blocks** — Effort: M
14. **Thêm atomicity tests cho changeSplitType** — Effort: S

---

## 📄 DOCUMENTS ĐÃ TẠO

| Document | Nội dung | Lines |
|----------|---------|-------|
| `docs/02-architecture/fitness-business-logic-analysis.md` | BM: 58 business rules, 16 flows, 12 bugs | 546 |
| `docs/tech-leader-fitness-architecture.md` | Architecture: state, persistence, dependencies, 14 issues | 537 |
| `docs/dev-analysis-fitness-deep-dive.md` | Dev: Bug verification, persistence audit, code quality | 455 |
| `docs/QA_FITNESS_TEST_COVERAGE.md` | QA: Test inventory, coverage gaps, test plan | 324 |
| **Tổng** | | **1,862** |

---

## 🎯 KẾT LUẬN

Fitness module có **kiến trúc tốt** (no circular deps, good types, smart algorithms) nhưng **persistence layer nghiêm trọng thiếu sót**:

- **10/24 actions** không lưu xuống database = **data loss risk**
- Chỉ **1/24** dùng transaction = **data corruption risk**
- **Sunday bug** = **100% buổi tập Chủ Nhật bị bỏ qua**

Ưu tiên #1: Fix P0 persistence bugs trước khi thêm feature mới.
