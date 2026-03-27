# Scenario 13: Save Template

**Version:** 2.0  
**Date:** 2026-03-11  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Save Template cho phép user lưu meal plan hiện tại thành template để tái sử dụng. User mở modal → nhập tên → thêm tag (tùy chọn) → xem preview các món ăn theo bữa → save. Template = immutable snapshot. Saved templates quản lý qua Template Manager (SC12).

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| SaveTemplateModal | modals/SaveTemplateModal.tsx | Save UI: name input, tag management, preview, save/cancel |
| useMealTemplate | hooks/useMealTemplate.ts | Template logic: CRUD, storage, validation |

## Props & Cấu hình

| Prop | Kiểu | Mô tả |
|------|------|-------|
| currentPlan | DayPlan | Kế hoạch bữa ăn hiện tại cần lưu |
| dishes | Dish[] | Danh sách món ăn trong plan |
| onSave | (name: string, tags?: string[]) => void | Callback khi lưu thành công |
| onClose | () => void | Callback khi đóng modal |

**Hằng số:**
- `MAX_NAME_LENGTH = 100`

## Luồng nghiệp vụ

1. User có meal plan trên calendar
2. Click "Save as Template" → Modal mở
3. Auto-focus vào name input
4. Nhập tên template (bắt buộc, tối đa 100 ký tự)
5. Character counter hiển thị realtime: `current/100`
6. Thêm tags (tùy chọn): nhập + Enter/dấu phẩy, hoặc click preset tags
7. Preview hiển thị: món ăn nhóm theo bữa, color-coded (Amber=sáng, Blue=trưa, Indigo=tối)
8. Save → onSave(trimmedName, tags) → modal đóng
9. Template xuất hiện trong Template Manager

## Quy tắc nghiệp vụ

1. Name bắt buộc: tối thiểu 1 ký tự non-whitespace sau khi trim
2. Name tối đa 100 ký tự (MAX_NAME_LENGTH)
3. Validation hiển thị khi touched + invalid
4. Tag: thêm qua Enter hoặc dấu phẩy, không trùng lặp
5. Preset tags: "High Protein", "Bữa nhanh", "Cuối tuần", "Healthy", "Tiết kiệm"
6. Preview: dishes grouped by meal type, color-coded
7. Save button disabled khi name invalid
8. Snapshot: deep copy dữ liệu tại thời điểm save
9. Template bao gồm dish references tại thời điểm snapshot

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_ST_01 | Nút Save Template hiển thị trên giao diện | Positive | P1 | — |
| TC_ST_02 | Click nút → modal mở | Positive | P0 | — |
| TC_ST_03 | Trường nhập tên template hiển thị | Positive | P1 | — |
| TC_ST_04 | Tùy chọn phạm vi: Ngày | Positive | P1 | — |
| TC_ST_05 | Tùy chọn phạm vi: Tuần | Positive | P1 | — |
| TC_ST_06 | Nút Save hiển thị | Positive | P1 | — |
| TC_ST_07 | Nút Cancel hiển thị | Positive | P1 | — |
| TC_ST_08 | Nhập tên → save → lưu thành công | Positive | P0 | — |
| TC_ST_09 | Template xuất hiện trong Template Manager | Positive | P0 | — |
| TC_ST_10 | Cancel → không tạo template | Positive | P1 | — |
| TC_ST_11 | Phạm vi Ngày: lưu 3 bữa ăn | Positive | P0 | — |
| TC_ST_12 | Phạm vi Tuần: lưu 7 ngày | Positive | P0 | — |
| TC_ST_13 | Template là snapshot (immutable) | Positive | P0 | — |
| TC_ST_14 | Sửa plan sau khi save → template không thay đổi | Positive | P0 | — |
| TC_ST_15 | Thông báo lưu thành công | Positive | P1 | — |
| TC_ST_16 | Modal đóng sau khi save | Positive | P1 | — |
| TC_ST_17 | Tên rỗng → lỗi validation | Negative | P0 | — |
| TC_ST_18 | Tên chỉ khoảng trắng → lỗi | Negative | P1 | — |
| TC_ST_19 | Tên trùng → lỗi | Negative | P0 | — |
| TC_ST_20 | Tên trùng không phân biệt hoa/thường | Negative | P1 | — |
| TC_ST_21 | Tên đạt tối đa 100 ký tự | Boundary | P1 | — |
| TC_ST_22 | Tên 101 ký tự → lỗi/cắt | Boundary | P1 | — |
| TC_ST_23 | Tên có ký tự đặc biệt | Edge | P2 | — |
| TC_ST_24 | Tên có dấu tiếng Việt | Positive | P2 | — |
| TC_ST_25 | Tên có emoji | Edge | P2 | — |
| TC_ST_26 | Tên chứa HTML injection | Security | P1 | — |
| TC_ST_27 | Lưu plan ngày trống | Edge | P1 | — |
| TC_ST_28 | Lưu ngày chỉ có bữa sáng | Edge | P2 | — |
| TC_ST_29 | Lưu ngày đầy đủ 3 bữa | Positive | P1 | — |
| TC_ST_30 | Lưu tuần có dữ liệu một phần (3/7 ngày) | Edge | P2 | — |
| TC_ST_31 | Lưu tuần đầy đủ dữ liệu (21 bữa) | Positive | P1 | — |
| TC_ST_32 | Lưu tuần không có dữ liệu (0 bữa) | Edge | P2 | — |
| TC_ST_33 | Template chứa đúng dish IDs | Positive | P1 | — |
| TC_ST_34 | Snapshot dinh dưỡng template chính xác | Positive | P1 | — |
| TC_ST_35 | Nhiều lần save từ cùng 1 plan | Positive | P2 | — |
| TC_ST_36 | Save → xóa món → template vẫn giữ tham chiếu | Edge | P1 | — |
| TC_ST_37 | Save → sửa món → template giữ dữ liệu gốc | Positive | P1 | — |
| TC_ST_38 | Save → xóa nguyên liệu → template xử lý được | Edge | P1 | — |
| TC_ST_39 | 1 template trong storage | Positive | P2 | — |
| TC_ST_40 | 10 templates đã lưu | Positive | P2 | — |
| TC_ST_41 | 50 templates — kiểm tra giới hạn storage | Boundary | P2 | — |
| TC_ST_42 | Định dạng lưu trữ template trong localStorage | Positive | P1 | — |
| TC_ST_43 | Dữ liệu tồn tại sau reload trang | Positive | P0 | — |
| TC_ST_44 | Export bao gồm templates đã lưu | Positive | P1 | — |
| TC_ST_45 | Import bao gồm templates | Positive | P1 | — |
| TC_ST_46 | Đồng bộ templates lên cloud | Positive | P2 | — |
| TC_ST_47 | Lưu từ ngày hôm nay | Positive | P1 | — |
| TC_ST_48 | Lưu từ ngày trong quá khứ | Positive | P2 | — |
| TC_ST_49 | Lưu từ ngày tương lai | Positive | P2 | — |
| TC_ST_50 | Lưu từ tuần hiện tại | Positive | P1 | — |
| TC_ST_51 | Dark mode: modal hiển thị đúng | Positive | P2 | — |
| TC_ST_52 | Nhãn i18n hiển thị đúng ngôn ngữ | Positive | P2 | — |
| TC_ST_53 | Giao diện mobile responsive | Positive | P2 | — |
| TC_ST_54 | Giao diện desktop responsive | Positive | P2 | — |
| TC_ST_55 | Click backdrop → đóng modal | Positive | P2 | — |
| TC_ST_56 | Nhấn Escape → đóng modal | Positive | P2 | — |
| TC_ST_57 | Hỗ trợ screen reader | Positive | P3 | — |
| TC_ST_58 | Điều hướng bằng bàn phím | Positive | P3 | — |
| TC_ST_59 | Auto-focus vào trường tên khi mở | Positive | P2 | — |
| TC_ST_60 | Nhấn Enter để submit | Positive | P2 | — |
| TC_ST_61 | Tab navigation giữa các trường | Positive | P2 | — |
| TC_ST_62 | Thông báo validation hiển thị inline | Positive | P1 | — |
| TC_ST_63 | Highlight lỗi trên trường tên | Positive | P2 | — |
| TC_ST_64 | Tương tác cảm ứng trên mobile | Positive | P2 | — |
| TC_ST_65 | Preview template trước khi save | Positive | P2 | — |
| TC_ST_66 | Preview hiển thị bữa ăn & dinh dưỡng | Positive | P2 | — |
| TC_ST_67 | Double-click nhanh khi save | Edge | P2 | — |
| TC_ST_68 | Save trong lúc đồng bộ | Edge | P2 | — |
| TC_ST_69 | Save cùng lúc sửa plan | Edge | P2 | — |
| TC_ST_70 | Tính toán kích thước template | Positive | P3 | — |
| TC_ST_71 | Cảnh báo quota localStorage | Boundary | P2 | — |
| TC_ST_72 | Lưu template 10 món/bữa | Boundary | P2 | — |
| TC_ST_73 | Lưu template 100 tham chiếu món | Boundary | P2 | — |
| TC_ST_74 | Nén template (nếu triển khai) | Positive | P3 | — |
| TC_ST_75 | Save → áp dụng ngay cùng template | Positive | P2 | — |
| TC_ST_76 | Save → đổi tên trong manager | Positive | P2 | — |
| TC_ST_77 | Save → xóa trong manager | Positive | P2 | — |
| TC_ST_78 | Metadata template (ngày tạo) | Positive | P2 | — |
| TC_ST_79 | Metadata template (phạm vi ngày nguồn) | Positive | P3 | — |
| TC_ST_80 | Trường mô tả template (tùy chọn) | Positive | P3 | — |
| TC_ST_81 | Tags/phân loại template | Positive | P3 | — |
| TC_ST_82 | Ảnh/thumbnail template | Positive | P3 | — |
| TC_ST_83 | Gợi ý tên tự động | Positive | P3 | — |
| TC_ST_84 | Tóm tắt xác nhận trước khi save | Positive | P2 | — |
| TC_ST_85 | Lưu từ plan do AI tạo | Positive | P2 | — |
| TC_ST_86 | Lưu từ plan đã copy | Positive | P2 | — |
| TC_ST_87 | Lưu từ plan đã áp dụng template | Edge | P2 | — |
| TC_ST_88 | Lưu ngày thiếu bữa (partial day) | Edge | P2 | — |
| TC_ST_89 | Tùy chọn ghi đè template hiện có | Positive | P3 | — |
| TC_ST_90 | Tạo phiên bản mới cho template | Positive | P3 | — |
| TC_ST_91 | Danh sách template cập nhật sau save | Positive | P1 | — |
| TC_ST_92 | Animation/transition khi save | Positive | P3 | — |
| TC_ST_93 | Trạng thái loading khi đang save | Positive | P2 | — |
| TC_ST_94 | Xử lý lỗi khi save thất bại | Negative | P1 | — |
| TC_ST_95 | Thử lại sau khi save thất bại | Positive | P2 | — |
| TC_ST_96 | Save khi mất kết nối đồng bộ | Edge | P2 | — |
| TC_ST_97 | Tương thích ngược định dạng template | Edge | P3 | — |
| TC_ST_98 | Migration template khi cập nhật app | Edge | P3 | — |
| TC_ST_99 | Save từ các chế độ xem calendar khác nhau | Positive | P2 | — |
| TC_ST_100 | Phạm vi mặc định theo ngữ cảnh hiện tại | Positive | P2 | — |
| TC_ST_101 | Phạm vi tuần → căn theo thứ Hai | Positive | P1 | — |
| TC_ST_102 | Phạm vi ngày → ngày đang chọn | Positive | P1 | — |
| TC_ST_103 | Gợi ý tên dựa trên nội dung plan | Positive | P3 | — |
| TC_ST_104 | Tên trùng → gợi ý tên thay thế | Positive | P3 | — |
| TC_ST_105 | Hiển thị số lượng template đã lưu | Positive | P3 | — |
| TC_ST_106 | Nhập 1 ký tự → valid, nút save enabled | Boundary | P1 | — |
| TC_ST_107 | Nhập 2 ký tự → valid, counter hiện 2/100 | Boundary | P2 | — |
| TC_ST_108 | Nhập 50 ký tự → valid, counter hiện 50/100 | Boundary | P2 | — |
| TC_ST_109 | Nhập 99 ký tự → valid, counter hiện 99/100 | Boundary | P1 | — |
| TC_ST_110 | Nhập 100 ký tự → valid, đạt giới hạn MAX_NAME_LENGTH | Boundary | P0 | — |
| TC_ST_111 | Nhập 101 ký tự → bị cắt tại 100 hoặc không cho nhập thêm | Boundary | P0 | — |
| TC_ST_112 | Chỉ nhập khoảng trắng → invalid, hiện thông báo lỗi | Negative | P0 | — |
| TC_ST_113 | Khoảng trắng đầu + text → trim khi save, onSave nhận tên đã trim | Positive | P1 | — |
| TC_ST_114 | Khoảng trắng cuối + text → trim khi save, onSave nhận tên đã trim | Positive | P1 | — |
| TC_ST_115 | Tên tiếng Việt: "Bữa ăn cuối tuần" → valid, save thành công | Positive | P1 | — |
| TC_ST_116 | Tên có dấu tiếng Việt: "Thực đơn đặc biệt" → valid | Positive | P1 | — |
| TC_ST_117 | Tên có số: "Tuần 1 tháng 3" → valid | Positive | P2 | — |
| TC_ST_118 | Tên có ký tự đặc biệt: "Bữa ăn #1" → valid | Edge | P2 | — |
| TC_ST_119 | Tên có emoji: "🍚 Cơm nhà" → valid, hiển thị đúng | Edge | P2 | — |
| TC_ST_120 | Tên chứa HTML: "<script>alert(1)</script>" → escaped, không execute | Security | P0 | — |
| TC_ST_121 | Tên SQL injection: "'; DROP TABLE--" → safe, lưu dạng text thuần | Security | P0 | — |
| TC_ST_122 | Nhập tên → xóa hết → touched + invalid → hiện thông báo lỗi | Negative | P1 | — |
| TC_ST_123 | Copy-paste tên dài 200 ký tự → cắt tại 100 ký tự | Boundary | P1 | — |
| TC_ST_124 | Nhập nhanh liên tục → character counter cập nhật realtime không lag | Positive | P2 | — |
| TC_ST_125 | Tên trùng template đã có → cho phép lưu (hoặc hiện warning) | Edge | P1 | — |
| TC_ST_126 | Thêm tag bằng nhấn Enter → tag xuất hiện trong danh sách | Positive | P0 | — |
| TC_ST_127 | Thêm tag bằng nhập dấu phẩy → tag xuất hiện trong danh sách | Positive | P0 | — |
| TC_ST_128 | Thêm tag rỗng (Enter không có text) → không thêm tag | Negative | P1 | — |
| TC_ST_129 | Thêm tag chỉ có khoảng trắng → không thêm tag | Negative | P1 | — |
| TC_ST_130 | Thêm tag trùng tên → không thêm, giữ nguyên danh sách | Negative | P1 | — |
| TC_ST_131 | Thêm tag trùng nhưng khác hoa/thường → kiểm tra logic xử lý duplicate | Edge | P2 | — |
| TC_ST_132 | Xóa tag bằng nút X → tag biến mất khỏi danh sách | Positive | P0 | — |
| TC_ST_133 | Xóa tag cuối cùng → danh sách tag trống hoàn toàn | Positive | P1 | — |
| TC_ST_134 | Click preset tag "High Protein" → thêm vào danh sách tags | Positive | P1 | — |
| TC_ST_135 | Click preset tag "Bữa nhanh" → thêm vào danh sách tags | Positive | P1 | — |
| TC_ST_136 | Click preset tag "Cuối tuần" → thêm vào danh sách tags | Positive | P1 | — |
| TC_ST_137 | Click preset tag "Healthy" → thêm vào danh sách tags | Positive | P1 | — |
| TC_ST_138 | Click preset tag "Tiết kiệm" → thêm vào danh sách tags | Positive | P1 | — |
| TC_ST_139 | Preset tag đã chọn → ẩn hoặc disable khỏi danh sách preset | Positive | P1 | — |
| TC_ST_140 | Thêm 10 tags → tất cả hiển thị đầy đủ trong danh sách | Boundary | P2 | — |
| TC_ST_141 | Thêm 20 tags → scroll hiển thị nếu vượt khung nhìn | Boundary | P2 | — |
| TC_ST_142 | Tag tiếng Việt có dấu: "Bữa chính" → hiển thị và lưu đúng | Positive | P2 | — |
| TC_ST_143 | Tag dài 50 ký tự → hiển thị đúng hoặc truncate phù hợp | Boundary | P2 | — |
| TC_ST_144 | Save với tags → onSave nhận đúng mảng tags đã thêm | Positive | P0 | — |
| TC_ST_145 | Save không có tag → onSave nhận tags là undefined hoặc mảng rỗng | Positive | P1 | — |
| TC_ST_146 | Preview hiển thị khi plan có ít nhất 1 món ăn | Positive | P1 | — |
| TC_ST_147 | Preview section bữa sáng hiển thị màu Amber đúng | Positive | P1 | — |
| TC_ST_148 | Preview section bữa trưa hiển thị màu Blue đúng | Positive | P1 | — |
| TC_ST_149 | Preview section bữa tối hiển thị màu Indigo đúng | Positive | P1 | — |
| TC_ST_150 | Plan không có bữa sáng → ẩn section bữa sáng trong preview | Positive | P1 | — |
| TC_ST_151 | Plan không có bữa trưa → ẩn section bữa trưa trong preview | Positive | P1 | — |
| TC_ST_152 | Plan không có bữa tối → ẩn section bữa tối trong preview | Positive | P1 | — |
| TC_ST_153 | Preview 1 món bữa sáng → hiện đúng tên món | Positive | P2 | — |
| TC_ST_154 | Preview 5 món bữa trưa → hiện tất cả tên món | Positive | P2 | — |
| TC_ST_155 | Tên món dài trong preview → truncate hoặc wrap phù hợp | Edge | P2 | — |
| TC_ST_156 | Tên món tiếng Việt có dấu trong preview → hiện đúng | Positive | P2 | — |
| TC_ST_157 | Preview sử dụng getLocalizedField hiển thị tên món đúng ngôn ngữ | Positive | P2 | — |
| TC_ST_158 | Preview hiển thị tổng số bữa: "3 bữa ăn" | Positive | P2 | — |
| TC_ST_159 | Preview hiển thị tổng số món: "X món" | Positive | P2 | — |
| TC_ST_160 | Preview khi plan trống (0 món) → hiện thông báo trống phù hợp | Edge | P1 | — |
| TC_ST_161 | Preview cập nhật real-time nếu plan thay đổi trong lúc modal mở | Edge | P3 | — |
| TC_ST_162 | Preview dark mode: colors hiển thị đúng trên nền tối | Positive | P2 | — |
| TC_ST_163 | Preview mobile layout: các section xếp chồng (stacked) | Positive | P2 | — |
| TC_ST_164 | Preview desktop layout: các section hiển thị cạnh nhau (side-by-side) | Positive | P2 | — |
| TC_ST_165 | Preview scroll khi có nhiều món → scrollbar hoạt động mượt | Edge | P2 | — |
| TC_ST_166 | Nút Save disabled khi name rỗng | Positive | P0 | — |
| TC_ST_167 | Nút Save enabled khi name hợp lệ (có ít nhất 1 ký tự non-whitespace) | Positive | P0 | — |
| TC_ST_168 | Click Save → onSave được gọi với name đã trim | Positive | P0 | — |
| TC_ST_169 | Click Save thành công → modal đóng tự động | Positive | P0 | — |
| TC_ST_170 | Save thành công → hiện toast thông báo thành công | Positive | P1 | — |
| TC_ST_171 | Save thất bại → hiện error toast với thông báo lỗi rõ ràng | Negative | P1 | — |
| TC_ST_172 | Save loading state: spinner hiển thị trên nút Save khi đang xử lý | Positive | P1 | — |
| TC_ST_173 | Nút Save disabled trong khi đang loading (ngăn click lặp) | Positive | P1 | — |
| TC_ST_174 | Double-click nút Save → onSave chỉ được gọi đúng 1 lần | Edge | P0 | — |
| TC_ST_175 | Click Cancel → modal đóng, không gọi onSave | Positive | P1 | — |
| TC_ST_176 | Cancel → name input cleared, state không persist qua lần mở tiếp | Positive | P1 | — |
| TC_ST_177 | Nhấn phím Escape → modal đóng (tương tự Cancel) | Positive | P1 | — |
| TC_ST_178 | Click backdrop (vùng ngoài modal) → modal đóng (tương tự Cancel) | Positive | P1 | — |
| TC_ST_179 | Save với plan trống (0 món) → hiện error hoặc warning phù hợp | Negative | P1 | — |
| TC_ST_180 | Save với plan chỉ có 1 bữa → save thành công | Positive | P2 | — |
| TC_ST_181 | Save với plan đầy đủ 3 bữa → save thành công | Positive | P1 | — |
| TC_ST_182 | Lỗi network trong quá trình save → retry hoặc hiện error message | Negative | P1 | — |
| TC_ST_183 | localStorage đầy (quota exceeded) → hiện error message rõ ràng | Negative | P1 | — |
| TC_ST_184 | Save thành công → localStorage được cập nhật với template mới | Positive | P0 | — |
| TC_ST_185 | Save thành công → IndexedDB đồng bộ dữ liệu template | Positive | P2 | — |
| TC_ST_186 | Auto-focus vào name input ngay khi modal mở | Positive | P1 | — |
| TC_ST_187 | Tab order đúng thứ tự: name → tags input → preset buttons → Save → Cancel | Positive | P2 | — |
| TC_ST_188 | Dark mode: tất cả elements trong modal hiển thị đúng màu sắc | Positive | P2 | — |
| TC_ST_189 | Mobile: modal hiển thị full-width, không bị cắt nội dung | Positive | P2 | — |
| TC_ST_190 | Desktop: modal centered, max-width phù hợp | Positive | P2 | — |
| TC_ST_191 | Animation mở/đóng modal mượt mà (fade/slide) | Positive | P3 | — |
| TC_ST_192 | Character counter đổi màu cảnh báo khi gần limit (90+ ký tự) | Positive | P2 | — |
| TC_ST_193 | Character counter chuyển đỏ khi đạt đúng 100 ký tự | Positive | P2 | — |
| TC_ST_194 | Thông báo lỗi validation có animation fade-in | Positive | P3 | — |
| TC_ST_195 | Thông báo lỗi validation hiển thị bằng tiếng Việt | Positive | P1 | — |
| TC_ST_196 | Nút Save có hover state phản hồi trực quan | Positive | P3 | — |
| TC_ST_197 | Nút Save có active state (nhấn xuống) phản hồi | Positive | P3 | — |
| TC_ST_198 | Tag chip: hover → hiện rõ nút xóa (X) | Positive | P2 | — |
| TC_ST_199 | Tag chips responsive: wrap xuống dòng khi nhiều tags | Positive | P2 | — |
| TC_ST_200 | Mở modal → đóng → mở lại → toàn bộ state reset về mặc định | Positive | P1 | — |
| TC_ST_201 | Mở/đóng modal 50 lần liên tục → không memory leak, hiệu suất ổn | Edge | P2 | — |
| TC_ST_202 | Paste text dài vào name input → cắt đúng tại MAX_NAME_LENGTH (100) | Boundary | P1 | — |
| TC_ST_203 | Input IME (Vietnamese input method: Telex/VNI) → xử lý đúng, không lỗi | Positive | P1 | — |
| TC_ST_204 | Screen reader: đọc label "Tên template" cho input name | Positive | P2 | — |
| TC_ST_205 | Screen reader: đọc thông báo lỗi validation khi xuất hiện | Positive | P2 | — |
| TC_ST_206 | Focus trap trong modal: Tab không thoát ra ngoài modal | Positive | P2 | — |
| TC_ST_207 | Scroll behavior khi preview có nhiều món: cuộn mượt, không giật | Edge | P2 | — |
| TC_ST_208 | Save template → verify template mới xuất hiện trong TemplateManager list | Positive | P0 | — |
| TC_ST_209 | Save template → export data bao gồm template mới vừa lưu | Positive | P1 | — |
| TC_ST_210 | Concurrent save (2 tab cùng app) → không conflict, dữ liệu nhất quán | Edge | P2 | — |

---

## Chi tiết Test Cases (Grouped)

##### TC_ST_01–16: Luồng Save cốt lõi
- Nút Save Template, modal, trường tên, phạm vi, save, thông báo, template xuất hiện trong manager

##### TC_ST_17–26: Xác thực tên cơ bản
- Tên rỗng, khoảng trắng, trùng lặp, độ dài, ký tự đặc biệt, tiếng Việt, emoji, injection

##### TC_ST_27–38: Biến thể nội dung
- Plan trống, bữa thiếu, ngày đầy đủ, tuần đầy đủ/một phần, tính bất biến sau save

##### TC_ST_39–50: Lưu trữ & Persistence
- Nhiều templates, giới hạn, định dạng localStorage, reload, import/export, sync, ngày tháng

##### TC_ST_51–66: UI/UX cơ bản
- Dark mode, i18n, responsive, tương tác modal, accessibility, preview

##### TC_ST_67–105: Edge Cases & Nâng cao
- Race conditions, giới hạn storage, template lớn, tích hợp tính năng khác, metadata, xử lý lỗi

##### TC_ST_106–125: Xác thực tên nâng cao
- Boundary values (1, 2, 50, 99, 100, 101 ký tự), trim, Unicode, dấu tiếng Việt, emoji, XSS/SQL injection, copy-paste dài, counter realtime, trùng tên

##### TC_ST_126–145: Quản lý Tag
- Thêm tag Enter/phẩy, tag trống/trùng, xóa tag, 5 preset tags, preset ẩn sau chọn, nhiều tags (10, 20), tag tiếng Việt, tag dài, save có/không tag

##### TC_ST_146–165: Preview Template
- Preview hiển thị theo bữa, color-coded (Amber/Blue/Indigo), ẩn section rỗng, tên món dài/tiếng Việt, getLocalizedField, tổng bữa/món, plan trống, dark mode, responsive, scroll

##### TC_ST_166–185: Save Flow & Error Handling
- Save button state, onSave callback, modal đóng, toast thông báo, loading/spinner, double-click, Cancel/Escape/backdrop, plan trống/thiếu/đủ, network error, localStorage full, IndexedDB sync

##### TC_ST_186–210: UI/UX & Edge Cases nâng cao
- Auto-focus, tab order, dark mode toàn diện, responsive mobile/desktop, animation, character counter colors, validation message i18n, hover/active states, tag chips responsive, state reset, memory leak, paste dài, IME, screen reader, focus trap, scroll, verify trong TemplateManager, export, concurrent save

---

## Đề xuất Cải tiến

### Đề xuất 1: Auto-Save Templates
- **Vấn đề hiện tại**: Chỉ lưu thủ công. Plan tốt có thể bị mất nếu không save rõ ràng.
- **Giải pháp đề xuất**: Tự động lưu tuần hiện tại dạng bản nháp mỗi Chủ nhật. User có thể chuyển bản nháp thành template chính thức.
- **Lý do chi tiết**: User thường nhận ra muộn rằng họ muốn lưu template. Auto-draft ghi lại mọi thứ kịp thời.
- **Phần trăm cải thiện**: Tạo template +50%, Bảo toàn plan +40%
- **Mức độ ưu tiên**: Trung bình | **Effort**: M

### Đề xuất 2: Template từ Ảnh chụp
- **Vấn đề hiện tại**: Tạo template yêu cầu phải lên plan thủ công trước.
- **Giải pháp đề xuất**: Chụp ảnh thực đơn viết tay → AI chuyển đổi thành template. OCR + AI parsing.
- **Lý do chi tiết**: Nhiều người bắt đầu với lên kế hoạch trên giấy. Ảnh-sang-template kết nối analog với digital.
- **Phần trăm cải thiện**: Khả năng tiếp cận tạo template +60%, Onboarding user mới +30%
- **Mức độ ưu tiên**: Thấp | **Effort**: L

### Đề xuất 3: Tag & Tìm kiếm Template
- **Vấn đề hiện tại**: Danh sách template phẳng. Khó tìm khi có 10+ templates.
- **Giải pháp đề xuất**: Tags: "High Protein", "Bữa nhanh", "Cuối tuần". Tìm kiếm + lọc theo tag.
- **Lý do chi tiết**: Tổ chức cải thiện khi bộ sưu tập template lớn dần. Tags = O(1) lookup thay vì O(n) cuộn.
- **Phần trăm cải thiện**: Thời gian tìm template giảm 60%, Tổ chức +50%
- **Mức độ ưu tiên**: Trung bình | **Effort**: S

### Đề xuất 4: Preview Dinh dưỡng trước khi Save
- **Vấn đề hiện tại**: Save mà không thấy tổng quan dinh dưỡng. Lưu mù.
- **Giải pháp đề xuất**: Preview trước save: "Template này trung bình 1800 cal/ngày, 120g protein". Cảnh báo nếu lệch mục tiêu.
- **Lý do chi tiết**: Preview đảm bảo chất lượng template. Cảnh báo lệch mục tiêu ngăn lưu plan kém.
- **Phần trăm cải thiện**: Chất lượng template +30%, Template lệch mục tiêu giảm 50%
- **Mức độ ưu tiên**: Trung bình | **Effort**: S

### Đề xuất 5: Versioning Template
- **Vấn đề hiện tại**: Save mới thay thế về mặt khái niệm. Không thể lặp lại trên cùng tên template.
- **Giải pháp đề xuất**: Lịch sử phiên bản: v1, v2, v3 của "Plan Tuần Làm Việc". So sánh phiên bản. Rollback.
- **Lý do chi tiết**: Template tiến hóa theo thời gian. Versioning cho phép cải tiến liên tục mà không mất lịch sử.
- **Phần trăm cải thiện**: Tiến hóa template +40%, Bảo toàn lịch sử +60%
- **Mức độ ưu tiên**: Thấp | **Effort**: M
