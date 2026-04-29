# Pre-flight Decisions — Target-State Implementation

**Mục đích:** Chốt 8 quyết định nghiệp vụ trước khi bắt đầu Task 1 của plan `docs/plans/2026-04-29-target-state-meal-recipe-pantry-nutrition-implementation.md`. Nếu không chốt, các task sẽ phải làm lại khi gặp ràng buộc legacy.

**Cách dùng:** điền cột "Quyết định" + "Ghi chú", sau đó patch plan gốc theo kết quả.

**Liên quan:** `docs/plans/2026-04-29-target-state-implementation-plan-review.md` §8.

---

## D1. Phương án bump SCHEMA_VERSION

| Hạng mục | Nội dung |
|---|---|
| Bối cảnh | SCHEMA_VERSION hiện tại = 5. Plan có 4–5 đợt schema (Task 2, 7, 9, 13, 15). |
| Lựa chọn A (khuyến nghị) | Mỗi task 1 phiên bản → V6, V7, V8, V9, V10. Mỗi commit revert được. |
| Lựa chọn B | Gộp 1 mega-migration V6. Khó debug, khó rollback. |
| Quyết định | ☐ A   ☐ B |
| Ghi chú |  |

---

## D2. Số phận `dish_with_totals` VIEW

| Hạng mục | Nội dung |
|---|---|
| Bối cảnh | VIEW hiện đang dùng `i.calories × normalized_amount / nutrition_basis_quantity`. `dish.repository` đọc trực tiếp 4 callsite. |
| Lựa chọn A (khuyến nghị) | Giữ VIEW làm legacy fallback. Repo ưu tiên `dish_ingredient.nutrition_snapshot_json`, fallback VIEW khi snapshot null. Drop VIEW ở migration cuối khi backfill 100%. |
| Lựa chọn B | Drop VIEW ngay Task 7. Repo refactor luôn 4 callsite. Rủi ro: dish cũ thiếu snapshot → 0 kcal. |
| Quyết định | ☐ A   ☐ B |
| Ghi chú |  |

---

## D3. CHECK enum `('g','ml','piece')` trên `dish_ingredient.amount_unit` và `ingredient.default_entry_unit`

| Hạng mục | Nội dung |
|---|---|
| Bối cảnh | Hai cột đang reject mọi unit ngoài enum 3 phần tử. Plan target có ≥ 16 unit. |
| Lựa chọn A (khuyến nghị) | Recreate table không có CHECK, FK soft sang `unit.code` hoặc `unit.id`. |
| Lựa chọn B | Drop CHECK in-place qua `PRAGMA writable_schema=1` (rủi ro corrupt). |
| Lựa chọn C | Mở rộng CHECK enum thủ công (cứng nhắc, khó maintain). |
| Quyết định | ☐ A   ☐ B   ☐ C |
| Ghi chú |  |

---

## D4. Backfill `ingredient_unit_v3` → `ingredient_measurement`

| Hạng mục | Nội dung |
|---|---|
| Bối cảnh | User hiện tại đã có dữ liệu `ingredient_unit_v3` với `factor_to_basis`. Resolver mới đọc từ `ingredient_measurement` mới. |
| Lựa chọn A (khuyến nghị) | Backfill: mỗi row v3 → measurement row, `confidence='imported'`, `source='legacy_factor'`. Task 6.5 mới. |
| Lựa chọn B | Không backfill. Resolver mới fallback đọc v3 nếu measurement không có. |
| Lựa chọn C | Không làm gì. Mọi conversion cũ thành `missing` sau khi resolver mới online. (Không khuyến nghị) |
| Quyết định | ☐ A   ☐ B   ☐ C |
| Ghi chú |  |

---

## D5. IA cho Pantry feature

| Hạng mục | Nội dung |
|---|---|
| Bối cảnh | Tabs hiện có 4 (dashboard/calendar/management/fitness). Pantry cần một entry point. |
| Lựa chọn A | Pantry là sub-route trong tab `management` (Quản lý → Tủ lạnh + Nguyên liệu + Món ăn). Không thay BottomNav. |
| Lựa chọn B | Tab thứ 5 "Tủ lạnh / Pantry". Phải sửa BottomNav layout. |
| Lựa chọn C | Thay tab `fitness` bằng `pantry`. Fitness chuyển sang Settings. |
| Quyết định | ☐ A   ☐ B   ☐ C |
| Ghi chú |  |

---

## D6. IA cho Food Log feature

| Hạng mục | Nội dung |
|---|---|
| Bối cảnh | Hiện chỉ có `calendar` (kế hoạch tương lai). Food Log = lịch sử thực tế ăn, snapshot bất biến. |
| Lựa chọn A (khuyến nghị) | Food Log nằm trong `calendar` cùng meal plan, tab cũ rename "Lịch ăn" giữ nguyên, có toggle "Đã ăn / Đã lên kế hoạch". |
| Lựa chọn B | Food Log riêng trong `dashboard` (tổng quan today). |
| Lựa chọn C | Tab riêng. (Conflict với D5 nếu cả hai chọn tab mới.) |
| Quyết định | ☐ A   ☐ B   ☐ C |
| Ghi chú |  |

---

## D7. Migration `day_plan/meal_slot/planned_dish`

| Hạng mục | Nội dung |
|---|---|
| Bối cảnh | 3 bảng meal-plan kiểu cũ đã có dữ liệu. Plan tạo `meal_plan + meal_plan_item` mới. |
| Lựa chọn A (khuyến nghị) | Migrate dữ liệu cũ → bảng mới (Task 13.5), drop bảng cũ trong cùng migration. |
| Lựa chọn B | Coexist 3 bảng cũ + 2 bảng mới. UI dùng cả hai song song trong 1 release, sau đó migrate. |
| Lựa chọn C | Coexist vĩnh viễn. (Không khuyến nghị, schema double.) |
| Quyết định | ☐ A   ☐ B   ☐ C |
| Ghi chú |  |

---

## D8. Snapshot versioning

| Hạng mục | Nội dung |
|---|---|
| Bối cảnh | `ConversionSnapshot` và `NutritionSnapshot` lưu JSON. Khi shape thay đổi tương lai, các row cũ phải migrate. |
| Lựa chọn A (khuyến nghị) | Mỗi snapshot có field `snapshot_version: number` ngay từ Task 1. Default = 1. |
| Lựa chọn B | Không version. Khi đổi shape thì migrate-all (rủi ro lệch). |
| Quyết định | ☐ A   ☐ B |
| Ghi chú |  |

---

## D9 (bonus). Policy save khi conversion missing

| Hạng mục | Nội dung |
|---|---|
| Bối cảnh | User nhập 1 bottle nước A nhưng chưa có conversion → kcal không tính được. |
| Lựa chọn A | Block save. User phải resolve qua Missing Conversion Resolver. |
| Lựa chọn B (khuyến nghị) | Cho save với `conversion_status='missing'` + warning UI rõ ràng. Dashboard total hiển thị "đang thiếu". |
| Lựa chọn C | Save với fake value 0. (Không khuyến nghị, gây sai data.) |
| Quyết định | ☐ A   ☐ B   ☐ C |
| Ghi chú |  |

---

## D10 (bonus). Policy `nutrition_profile.is_authoritative`

| Hạng mục | Nội dung |
|---|---|
| Bối cảnh | Một ingredient có thể có nhiều profile (USDA + Open Food Facts + user_custom). Cần 1 nguồn chính. |
| Lựa chọn A (khuyến nghị) | UNIQUE partial index: `is_authoritative=1` chỉ 1 row per `(ingredient_id, variant_id)`. User chọn nguồn chính từ UI. |
| Lựa chọn B | Auto-pick theo `confidence` ranking (verified > imported > estimated). |
| Quyết định | ☐ A   ☐ B |
| Ghi chú |  |

---

## Sau khi điền

1. Lưu file này.
2. Phản hồi cho Hermes Agent: chạy patch plan gốc theo các quyết định trên.
3. Hermes sẽ:
   - Patch `2026-04-29-target-state-meal-recipe-pantry-nutrition-implementation.md`.
   - Bổ sung Task 1.5, 6.5, 13.5.
   - Cập nhật Task 2/7/8 theo D2/D3.
   - Cập nhật acceptance criteria định lượng.
   - Verify lại plan và báo cáo.
