# DESIGN REVIEW SCREENSHOT AUDIT 2026

> **Người viết:** review với tiêu chuẩn của một design lead khó tính, ưu tiên tính đúng, tính rõ, tính nhất quán và độ tin cậy trước mọi thứ "đẹp mắt".
>
> **Phạm vi:** toàn bộ ảnh UI trong `screenshots/`, ngoại trừ các artifact hỗ trợ như `_contacts`, `contact_sheets`, `test-icon`.
>
> **Lưu ý về bằng chứng:** với các ảnh blur hoặc ảnh test kỹ thuật, nhận xét chỉ dựa trên phần thực sự nhìn thấy. Tôi không giả vờ "thấy" thứ ảnh không cho thấy.

---

## Tổng quan

### 1. Khung chuẩn tôi dùng để chấm

Tôi không chấm theo cảm tính. Tôi chấm theo bộ luật sau:

1. **Design context của chính dự án**
   - Brand phải **Clean · Smart · Motivating**
   - Tone phải **approachable, encouraging, calm, organized, never clinical**
   - **Clarity over decoration**
   - **Data with empathy**
   - **Mobile-first, touch-native**
   - **Semantic tokens only**
   - **Accessible by default**

2. **Nielsen Heuristics**
   - Visibility of system status
   - Match between system and real world
   - Consistency and standards
   - Error prevention
   - Recognition over recall

3. **Fitts's Law**
   - Mọi touch target mobile phải thực sự dễ bấm, không phải "nhìn như bấm được"

4. **Hick's Law**
   - Một màn càng nhiều lựa chọn cùng lúc, quyết định càng chậm

5. **WCAG 2.1 AA**
   - Contrast body text tối thiểu 4.5:1
   - Trạng thái interactive không được chỉ dựa vào màu

6. **Nguyên tắc localization**
   - App tiếng Việt không được lòi format Mỹ, jargon kỹ thuật, copy nửa Anh nửa Việt nếu không có chủ đích cực kỳ rõ

7. **Kỷ luật về trust**
   - Ứng dụng sức khỏe/meal planning/fitness mà để lộ `NaN`, `undefined`, copy hỏng, trạng thái mâu thuẫn, toast sai dữ liệu thì đó không còn là lỗi mỹ thuật. Đó là lỗi niềm tin.

### 2. Kết luận thẳng thắn

Ứng dụng này **không xấu**. Tệ nhất của nó không phải là thẩm mỹ bẩn; tệ nhất của nó là **thiếu kỷ luật ưu tiên**. Nó có khá nhiều màn nhìn sạch, màu chủ đạo nhất quán, dark mode không làm qua loa, typography đọc được, spacing ở nhiều chỗ tương đối ổn. Nhưng càng đi sâu vào flow thật, càng lộ 4 bệnh nặng:

1. **Card hóa quá mức**: mọi thứ thành card, khiến mọi thứ quan trọng như nhau.
2. **Xanh lá bị lạm dụng**: green bị dùng cho active, success, selection, CTA, number, badge, bar, link, hero, advice. Kết quả là màu không còn ý nghĩa.
3. **Phản hồi trạng thái quá yếu hoặc sai**: save/delete/undo/reset/reload nhiều chỗ không đủ rõ, thậm chí tự mâu thuẫn.
4. **Một số màn trình bày dữ liệu như máy móc chứ không như sản phẩm đồng hành**: đặc biệt ở fitness, analytics, onboarding và các state rỗng.

Nếu tôi phải tóm gọn toàn bộ audit này trong một câu, tôi sẽ nói:

> **UI này nhìn có vẻ bình tĩnh hơn mức nó thực sự đang bắt người dùng phải suy nghĩ.**

### 3. Bảng điểm tổng thể

| Hạng mục         | Điểm | Nhận xét                                                                      |
| ---------------- | ---- | ----------------------------------------------------------------------------- |
| Hệ màu           | 4/10 | Có brand color, nhưng lạm dụng green đến mức mất nghĩa                        |
| Typography       | 5/10 | Đọc được, nhưng hierarchy chưa đủ sắc                                         |
| Layout & spacing | 5/10 | Có màn sạch, có màn lãng phí trắng hoặc dồn khối quá tay                      |
| Form UX          | 4/10 | Dài, nặng, chưa biết progressive disclosure                                   |
| Planner UX       | 6/10 | Có tiềm năng, nhưng choice density còn cao                                    |
| Fitness UX       | 4/10 | Nhiều state hữu ích nhưng cách diễn đạt còn nặng tính kỹ thuật/administrative |
| Empty states     | 3/10 | Quá thụ động, ít dạy người dùng phải làm gì tiếp                              |
| Dark mode        | 7/10 | Tốt hơn trung bình, nhưng vẫn còn lỗi hierarchy và contrast                   |
| Accessibility    | 4/10 | Chưa đủ chặt ở contrast, target size, color-only selection                    |
| Trustworthiness  | 3/10 | `NaN`, copy hỏng, toast mâu thuẫn, trạng thái blur lỗi là các vết cắt sâu     |

### 4. Những lỗi hệ thống cần sửa trước khi nói đến "polish"

1. **Không bao giờ để lộ trạng thái hỏng**
   - `NaN`, `undefined`, template string hỏng, empty chart giả vờ có dữ liệu

2. **Dừng việc để một màn có 3-5 CTA cùng trọng lượng**
   - Dashboard/planner/fitness đang phạm lỗi này nhiều nhất

3. **Giảm card hóa**
   - Không phải thứ gì cũng xứng đáng được bọc trong một khối bo góc với elevation riêng

4. **Tái thiết lập semantic color**
   - Green không thể vừa là primary, vừa là selection, vừa là success, vừa là neutral energy display

5. **Viết lại tone của fitness insights**
   - Không được phán xét, không được clinical, không được "chẩn bệnh" người dùng

6. **Chuẩn hóa modal/drawer/bottom sheet**
   - Alert/confirm, selection sheet, full-screen task mỗi loại phải có pattern riêng, không được lẫn

7. **Bắt buộc có empty-state action**
   - Empty state mà không có hành động thoát ra là một dead end được trang điểm

8. **Review toàn bộ icon semantics**
   - Sai icon trên màn welcome, sai icon cho delete/save/info, icon nhỏ quá ở bottom nav

### 5. Điều tôi ghi nhận tích cực

- Meal planning sheet có một số state khá chắc tay.
- Rest timer modal và add-session modal là những điểm sáng hiếm hoi ở fitness flow.
- Dark mode không bị làm qua loa kiểu đổi nền sang đen rồi bỏ mặc.
- Một số card summary có nền tảng tốt, chỉ cần bỏ bớt thứ thừa là lên chất lượng rất nhanh.

---

## Chi tiết từng ảnh - Nhận xét và giải pháp để giải quyết

### Lưu ý chung cho phần này

- Tôi đi theo **từng ảnh** hoặc **nhóm ảnh trùng một state**.
- Với các ảnh gần như cùng một vấn đề, tôi gộp để tránh lặp chữ vô ích.
- Mục tiêu của phần này là để đội thiết kế/dev nhìn vào là biết **cần sửa cái gì, vì sao phải sửa, và sửa theo hướng nào**.

---

### SC01 - Onboarding, preview, AI suggestion, calendar nền

- `SC01_step07_dob_filled.png`
  - **Nhận xét:** date format Mỹ `05/15/1996` là lỗi localization cơ bản; placeholder và filled-state chưa đủ khác nhau; phần dưới màn hình trắng quá nhiều nên form trôi lơ lửng.
  - **Giải pháp:** đổi sang DD/MM/YYYY hoặc native date picker đúng locale; làm rõ filled-state bằng text đậm hơn placeholder; dùng phần trắng để thêm guidance hoặc step context.

- `SC01_step11_activity_moderate.png`
  - **Nhận xét:** lôi thẳng multiplier `x1.2`, `x1.375`, `x1.55` ra mặt tiền là backend leak; emoji thiếu hệ thống; decision aid gần như bằng 0.
  - **Giải pháp:** bỏ multiplier khỏi UI chính; thêm microcopy "phù hợp với ai"; dùng icon/emoji đồng nhất hơn.

- `SC01_step13_goal_cut.png`
  - **Nhận xét:** icon dấu gạch ngang cho "Duy trì" là placeholder trá hình; selection state dựa quá nhiều vào màu; khoảng trắng quá mức khiến màn hình như chưa dựng xong.
  - **Giải pháp:** thay icon cân bằng rõ nghĩa; thêm checkmark/selected marker không phụ thuộc màu; dùng phần trống cho explanation ngắn của từng goal.

- `SC01_step14_confirm_screen.png`
  - **Nhận xét:** card 2641 kcal/ngày có tiềm năng, nhưng thiếu ngữ cảnh "đây là số nào, do goal nào sinh ra"; BMI đưa số thô mà không giải thích; body copy center-align 3 dòng làm tăng effort đọc.
  - **Giải pháp:** hiện rõ goal đã chọn; thêm interpretation cho BMI; left-align đoạn giải thích; đổi `Xem chi tiết` thành label rõ phạm vi.

- `SC01_step16_training_step1.png`
  - **Nhận xét:** zero-default cho thời lượng tập nhưng CTA vẫn sống là một quyết định lười; 90 phút bị orphan ở hàng dưới; màn hình quá trống nên nhìn như loader.
  - **Giải pháp:** preselect một gợi ý hợp lý; tổ chức lại chip grid cho cân; dim CTA khi chưa có lựa chọn hợp lệ.

- `SC01_step17_training_step2.png`
  - **Nhận xét:** label thiết bị bằng tiếng Anh trong flow tiếng Việt là vết nứt i18n rõ ràng; multi-select không được báo; screen nặng cảm giác "form kỹ thuật".
  - **Giải pháp:** dịch toàn bộ label; thêm hint "chọn 1 hoặc nhiều"; cân nhắc icon nhỏ cho từng loại thiết bị.

- `SC01_step18_training_step3.png`
  - **Nhận xét:** hỏi chấn thương mà không có lựa chọn "không có" là thiếu empathy và thiếu logic; chip `Cổ` và `Cổ tay` dễ nhìn nhầm; tone copy còn lạnh.
  - **Giải pháp:** thêm `Không có chấn thương`; thêm reassurance rằng app dùng dữ liệu này để loại bài tập rủi ro; nếu đủ nguồn lực, chuyển sang body map.

- `SC01_step19_training_step4.png`
  - **Nhận xét:** đây là một trong những màn lãng phí viewport nặng nhất; 4 chip nằm top 20% màn hình, phần còn lại trắng; `0` là lựa chọn hợp lệ nhưng biểu đạt cực xấu.
  - **Giải pháp:** đổi `0` thành `Không / Bỏ qua`; thêm guidance cho beginner; dùng phần trống để giải thích cardio hỗ trợ mục tiêu ra sao.

- `SC01_step20_training_step5.png`
  - **Nhận xét:** confirmation screen mà lại thiếu mất một nửa field người dùng vừa nhập là lỗi IA; CTA `Tiếp tục` không đồng bộ với logic confirm ở screen trước; không có inline edit.
  - **Giải pháp:** show đầy đủ duration, equipment, injury, cardio/week; đổi CTA sang `Xác nhận`; thêm `Sửa` theo từng dòng hoặc từng nhóm.

- `SC01_step24_plan_preview.png`
  - **Nhận xét:** preview nhìn ổn nhưng còn quá structural, chưa đủ informational; tile thống kê bị orphan; advisory card xanh nhìn giống card tương tác.
  - **Giải pháp:** cho biết từng ngày tập gì; cân lại grid 3 số liệu; biến advisory thành info strip thay vì pseudo-card.

- `SC01_step36_tc106_month_view.png`
  - **Nhận xét:** ngày bị lặp 3 lớp; legend hỏng vì chỉ một phần có dot; button `AI` là danh từ đứng lẻ giữa hai verb actions; header calendar quá đông.
  - **Giải pháp:** bỏ date pill thừa; sửa hoặc bỏ legend; đổi `AI` thành động từ rõ việc; rút gọn cluster điều hướng trên đầu calendar.

- `SC01_step70_tc13_ai_suggest.png`
  - **Nhận xét:** loading state của AI quá vô hồn; progress bar gần như vô hình; close button viền xanh nổi hơn chính loading state; 60% màn hình trắng chết.
  - **Giải pháp:** dùng skeleton preview cho bữa sáng/trưa/tối; thêm ước lượng thời gian chờ; hạ visual weight của close button trong khi loading.

- `SC01_step90_tc69_week_dots.png`
  - **Nhận xét:** `Lý do gợi ý` là một khối AI-speak dài, đặc, tự lặp số; `Bữa tối` bị giấu hoàn toàn; checkbox cho từng bữa thiếu semantics; `Thay đổi` nhỏ và yếu.
  - **Giải pháp:** rút phần lý do xuống 2 câu + disclosure; show summary total rõ ràng; làm rõ checkbox là `Bao gồm/Bỏ bữa này`; đảm bảo user thấy đủ 3 meal sections hoặc thấy rõ còn content bên dưới.

- `SC01_step91_tc81_delete_dish.png`
  - **Nhận xét:** toast `Đã chọn 0 món cho 0 món` là lỗi trust loại P0; success framing đi cùng copy hỏng là cực nguy hiểm; mọi vấn đề của step 90 vẫn còn nguyên.
  - **Giải pháp:** fix template string ngay; nếu count = 0 thì dùng warning state khác; thêm test bắt buộc cho mọi toast interpolation.

---

### SC02 - Meal planner / dish selector

- `SC02_step03_tc04_search_uc_ga.png`
  - **Nhận xét:** footer nói `0 món` trong khi card kết quả đang hiện; `Xác nhận` sống khi chưa chọn gì; date format `2026-04-05` lạnh và kỹ thuật.
  - **Giải pháp:** disable confirm ở trạng thái 0 selection; localize date; label rõ protein badge.

- `SC02_step04_tc07_search_empty.png`
  - **Nhận xét:** empty state đang nói sai vấn đề - đây là `không có kết quả tìm kiếm`, không phải `thư viện chưa có món`; không có clear search; confirm vẫn sống.
  - **Giải pháp:** thay empty copy theo query; thêm nút xóa tìm kiếm; khóa confirm.

- `SC02_step05_tc08_dish_selected.png`
  - **Nhận xét:** dot trắng cạnh badge tab không có nghĩa; `Còn lại: 88g` thiếu đối tượng; `Bữa Trưa` wrap xấu.
  - **Giải pháp:** bỏ dot; ghi rõ `88g Pro`; rút label tab còn `Sáng / Trưa / Tối`.

- `SC02_step08_tc02_preselected.png`
  - **Nhận xét:** item đã lưu sẵn và item mới chọn không khác nhau; `Còn lại: 1g` vẫn xanh như thể ổn; user không biết bấm `Xác nhận` sẽ thay đổi gì.
  - **Giải pháp:** phân biệt pre-saved với in-session; dùng threshold color; giải thích rõ state hiện tại.

- `SC02_step11_tc106_filter_open.png`
  - **Nhận xét:** selected sort state quá yếu; 9 lựa chọn cùng lúc cho một context đồ ăn là nhiều; thiếu drag handle; blur nền làm mất hoàn toàn spatial context.
  - **Giải pháp:** fill selected chip rõ hơn; gom sort options; chuyển `Đặt lại` thành text link; giảm blur.

- `SC02_step12_tc126_budget.png`
  - **Nhận xét:** chọn món protein thấp cho bữa trưa mà UI không nudge gì là missed opportunity; `Còn lại: 42g` vẫn thiếu object; dot tab vẫn vô nghĩa.
  - **Giải pháp:** thêm soft warning `Ít protein`; ghi rõ `42g Pro`; đề xuất món đạm phù hợp.

- `SC02_step13_tc181_header.png`
  - **Nhận xét:** overflow protein nhưng CTA vẫn xanh như bình thường; green/red cùng dòng gây nhiễu; selected card không phản ánh hệ quả dinh dưỡng.
  - **Giải pháp:** đổi CTA hoặc footer sang warning state khi overflow; gắn warning nhẹ lên item gây overflow; đổi label sang ngôn ngữ hướng dẫn thay vì chỉ báo số.

---

### SC03 - Nutrition / goal detail

- `SC03_step43_nut83_cleared.png`
  - **Nhận xét:** toast đẩy cả layout xuống là lỗi nặng; `0 kcal` hiển thị xanh là semantically sai; action `Hoàn tác` giống link chết hơn là nút bấm.
  - **Giải pháp:** biến toast thành overlay fixed; 0-data dùng neutral styling; tăng tap area cho undo.

- `SC03_step67_nut200_edit_goals.png`
  - **Nhận xét:** đây là quảng trường trắng khổng lồ; `±0 kcal` là toán học chứ không phải ngôn ngữ sản phẩm; nút `Chỉnh sửa` quá nhẹ trên một màn cực thưa nội dung.
  - **Giải pháp:** thêm trend/summary card; đổi sang copy người hiểu được; tăng prominence của hành động sửa.

- `SC03_step70_nut209_rapid.png`
  - **Nhận xét:** header date và week range mâu thuẫn; không thấy active day rõ ràng; 487 kcal fill ít nhưng vẫn xanh đậm như một trạng thái "ổn".
  - **Giải pháp:** luôn highlight day đang xem; đồng bộ header date; dùng neutral color cho low-progress fills.

---

### SC04 - Home + modal cơ bản

- `SC04_step01_app_home.png`
  - **Nhận xét:** `Chọn ngày` + date pill + calendar là ba lớp cùng một thông tin; 3 action buttons chưa có hierarchy đủ chặt; empty meal slots chưa đủ ấm áp.
  - **Giải pháp:** bỏ redundant label/date; chuẩn hóa secondary buttons; biến empty slots thành actionable placeholders có tính khuyến khích.

- `SC04_step18_tc20_special_chars.png`
  - **Nhận xét:** modal unsaved changes đang đảo hierarchy - destructive text nổi hơn safe option; icon floppy disk màu cam vừa lỗi thời vừa lệch hệ màu; background blur che mất context.
  - **Giải pháp:** chuẩn hóa lại 3 action tiers; bỏ floppy disk; thêm context vào title; cân nhắc bỏ bớt một action nếu không thật sự cần.

---

### SC06 - Ingredient library / ingredient form

- `SC06_step06_TC_ING_13_form_filled.png`
  - **Nhận xét:** close button cạnh tranh trực tiếp với CTA; label dinh dưỡng all-caps + slash + unit quá spreadsheet; AI sparkle button không có giải thích; app chấp nhận calories mâu thuẫn với macro.
  - **Giải pháp:** ghost close button; làm label đọc như sản phẩm thay vì sheet tính; thêm sanity check macro-calorie.

- `SC06_step07_TC_ING_13_saved.png`
  - **Nhận xét:** bốn màu chip trên một card làm loạn hệ màu; từ `BÉO` thô và dễ gây phản cảm; `CALO/CALORIES/Calo` không nhất quán; delete lộ diện như action thường.
  - **Giải pháp:** thống nhất thuật ngữ; giảm bớt số màu; làm destructive action ít lộ hơn hoặc đưa vào overflow.

- `SC06_step11_TC_ING_18_edit_modal.png`
  - **Nhận xét:** icon cảnh báo sai semantics; hierarchy ba action không an toàn; safe action lại khó chạm nhất.
  - **Giải pháp:** dùng warning icon đúng nghĩa; tái sắp xếp hành động theo mức an toàn; thêm drag handle nếu sheet dismissible.

- `SC06_step19_TC_ING_29_deleted.png`
  - **Nhận xét:** sau delete mà lại bật modal `Thay đổi chưa lưu` là sai logic; đây không còn là lỗi thẩm mỹ mà là flow bug lộ ra UI.
  - **Giải pháp:** tách riêng delete confirmation/result khỏi unsaved-change flow; không reuse modal bừa bãi.

- `SC06_step23_TC_ING_34_spaces_name.png`
  - **Nhận xét:** spaces-only nhưng copy lỗi vẫn như empty field; close button đổi style theo state là biểu hiện design system chưa kỷ luật.
  - **Giải pháp:** viết error copy đúng bệnh; chuẩn hóa một style close button duy nhất cho toàn bộ sheet.

- `SC06_step25_TC_ING_36_long_name.png`
  - **Nhận xét:** không có counter; label `CALORIES / 1` khi chưa chọn unit là vô nghĩa; số `0` đang nhìn như dữ liệu thật, không phải placeholder.
  - **Giải pháp:** thêm counter; ẩn hoặc thay denominator cho tới khi chọn unit; tách placeholder khỏi actual values.

- `SC06_step32_TC_ING_43_unit_required.png`
  - **Nhận xét:** UI vừa bảo thiếu unit, vừa tiếp tục hiển thị `/ 1`; placeholder dạng `— chọn đơn vị —` nhìn giống loading hơn là lời mời chọn; CTA vẫn xanh.
  - **Giải pháp:** blank denominator khi unit chưa hợp lệ; viết placeholder rõ ràng; disable CTA đúng cách.

- `SC06_step34_TC_ING_45_negative_cal.png`
  - **Nhận xét:** cho phép nhập dấu trừ rồi mới chửi sau là friction tránh được; đây là error-state mạnh nhất trong nhóm nhưng chưa chặn được lỗi từ gốc.
  - **Giải pháp:** chặn negative từ input level; CTA không nên tiếp tục trông hợp lệ khi error còn sống.

- `SC06_step35_TC_ING_46_negative_pro.png`
  - **Nhận xét:** nếu modal `Lưu & quay lại` cho phép lưu state invalid thì đây là lỗi integrity cấp dữ liệu.
  - **Giải pháp:** revalidate toàn bộ form trước mọi hành vi save từ modal trung gian.

- `SC06_step40_TC_ING_51_decimal.png`
  - **Nhận xét:** lặp lại toàn bộ vấn đề của unsaved modal; screen này không thêm giá trị mới ngoài việc xác nhận pattern modal đang bị dùng quá tay.
  - **Giải pháp:** fix pattern modal ở gốc thay vì chữa từng nhánh.

- `SC06_step41_TC_ING_52_text_in_cal.png`
  - **Nhận xét:** browser tooltip tiếng Anh lòi ra trong app tiếng Việt là fail cực xấu; tooltip native chồng lên modal title; `step="1"` tiềm ẩn hạn chế dữ liệu sai.
  - **Giải pháp:** `noValidate` + custom validation tiếng Việt; kiểm tra lại step/min/max cho các field số.

- `SC06_step46_TC_ING_57_search_exact.png`
  - **Nhận xét:** duplicate entries indistinguishable; card cao thấp khác nhau vì có item có `Dùng trong` và item không; sort control vẫn lộ dù chỉ còn 2 item.
  - **Giải pháp:** phân biệt seed/system vs user-created; chuẩn hóa chiều cao card; giảm nhiễu khi search scope hẹp.

- `SC06_step48_TC_ING_59_search_no_match.png`
  - **Nhận xét:** empty state quá thụ động; icon tái sử dụng từ avatar ingredient nên nghĩa bị lẫn; không có clear query hoặc add CTA.
  - **Giải pháp:** dùng empty illustration riêng; thêm `Xóa tìm kiếm` và `Thêm nguyên liệu mới`; ẩn/dim sort khi 0 result.

- `SC06_step53_TC_ING_64_sort_cal_desc.png`
  - **Nhận xét:** chấp nhận 9999 kcal và macro total vượt 100g là không thể chấp nhận; `Calo/CALO/CALORIES` phân mảnh từ vựng; arrow `→` cho descending là sai ngôn ngữ thị giác.
  - **Giải pháp:** thêm validation mềm cho impossible values; thống nhất thuật ngữ; dùng icon/order semantics đúng.

---

### SC07 - Dish library / dish form

- `SC07_step05_ingredient_search_results.png`
  - **Nhận xét:** dấu `+` cạnh search bar không có semantics; vùng `Nguyên liệu đã chọn` không dạy người dùng cần làm gì; close X tiếp tục quá nặng.
  - **Giải pháp:** biến `+` thành CTA có chữ theo context; nối rõ search results với selected area; làm close control nhẹ hơn.

- `SC07_step08_rating_3_stars.png`
  - **Nhận xét:** `Không tìm thấy nguyên liệu` đặt cùng vùng với nutrition bar 500 kcal là mâu thuẫn trực tiếp; empty stars thiếu contrast; selected ingredients below fold không có anchor.
  - **Giải pháp:** tách rõ search-state với selection-state; thêm sticky count chip; sửa star contrast và reset affordance.

- `SC07_step09_dish_saved.png`
  - **Nhận xét:** 18 action labels cho 6 cards là quá ồn; checkbox top-right không rõ dùng làm gì; date header chui vào library là noise.
  - **Giải pháp:** dùng overflow menu; hoặc kích hoạt multi-select đúng nghĩa; loại date khỏi library header.

- `SC07_step12_edit_modal_opened.png`
  - **Nhận xét:** create và edit gần như cùng một bộ mặt; edit mode lại show `Thường dùng` trước composition hiện tại là sai ưu tiên; test artifact note làm giảm tính chân thực.
  - **Giải pháp:** cho edit mode một tín hiệu riêng; ưu tiên hiển thị selected ingredients; dùng realistic copy.

- `SC07_step16_delete_confirm_shown.png`
  - **Nhận xét:** modal nói `không thể hoàn tác` nhưng flow sau lại có undo; `Xóa ngay` đẩy urgency vô ích; blur nền xóa sạch context.
  - **Giải pháp:** thống nhất copy với undo policy; bỏ chữ `ngay`; giảm blur.

- `SC07_step19_dish_deleted.png`
  - **Nhận xét:** info icon cho delete result là sai; undo không có countdown; toast quá cao và đè cả page title.
  - **Giải pháp:** dùng icon phù hợp hơn; thêm countdown vào undo; nén toast xuống đúng vai trò transient.

- `SC07_step20_val_empty_name.png`
  - **Nhận xét:** toast delete còn treo trên create form là collision state rất xấu; form không reset, stale search và nutrition mang từ session cũ sang; error signaling bị đỏ hóa toàn màn.
  - **Giải pháp:** auto-dismiss toast khi mở form; reset form state mỗi lần open; bỏ bớt label đỏ vì message đỏ đã đủ.

- `SC07_step21_val_no_ingredients.png`
  - **Nhận xét:** dish 0 nguyên liệu mà không bị chặn hoặc ít nhất bị cảnh báo là lỗ hổng domain logic; thiếu count badge cho selected ingredients; list dưới bị cắt cụt không có fade.
  - **Giải pháp:** thêm ingredient validation mềm hoặc cứng; thêm count badge; dùng fade để gợi ý scroll.

- `SC07_step26_val_long_name.png`
  - **Nhận xét:** field truncate bằng `...` nhưng không báo đây là lỗi; không có counter; validation đến quá muộn.
  - **Giải pháp:** validate onBlur; thêm `28/50`; chặn overflow bằng maxlength + warning sớm.

- `SC07_step29_val_spaces_name.png`
  - **Nhận xét:** empty và whitespace-only dùng cùng message; stale state lặp lại thêm lần nữa xác nhận root cause; six red elements trên một màn là overkill.
  - **Giải pháp:** tách error copy; trim onBlur; reset form ở cleanup.

- `SC07_step35_val_no_tag.png`
  - **Nhận xét:** stale state nay đã là lỗi hệ thống, không còn là accident; `+` button vẫn mơ hồ; search zone và selected zone vẫn dính nghĩa vào nhau.
  - **Giải pháp:** đổi `+` thành `Tạo '[query]' mới`; dựng divider rõ giữa transient results và persistent selection.

- `SC07_step44_search_partial.png`
  - **Nhận xét:** chip count không update theo search; không có dòng `1 kết quả`; nửa dưới màn hình trống như bug.
  - **Giải pháp:** update count theo scope search; thêm result count; dùng khoảng trống cho CTA hoặc suggestion.

- `SC07_step45_search_no_results.png`
  - **Nhận xét:** `Tất cả (5)` xanh lè trong khi content = 0 là cú đấm vào trust; empty state quá thụ động; icon chef hat reused sai ngữ nghĩa.
  - **Giải pháp:** clear/dim chip count khi search active; thêm `Xóa tìm kiếm` + `Tạo món mới`; dùng illustration khác cho no-results.

- `SC07_step49_filter_breakfast.png`
  - **Nhận xét:** filter `Sáng` active nhưng tag `Sáng` trên card không được highlight; `Trứng ốp la (2 quả)` trộn portion info vào name là naming anti-pattern; phần trống dưới vẫn bị bỏ hoang.
  - **Giải pháp:** highlight matching tag; tách portion khỏi tên chuẩn; tận dụng phần dưới cho CTA thêm món bữa sáng.

---

### SC08 - SC09 - Welcome / onboarding marketing slides

- `SC08_step13_goal_cut.png`
  - **Nhận xét:** dead space quá lớn; progress bar quá mảnh và mù nghĩa; pale-green icon tile là template pattern thiếu cá tính; `Bắt đầu` không được xử lý như CTA kết thúc chuỗi.
  - **Giải pháp:** anchor content thấp hơn; thay progress bằng step counter rõ; hoặc bỏ icon tile generic để dùng illustration/promise cụ thể.

- `SC09_step02_welcome_step2.png`
  - **Nhận xét:** raw `Loading...` top-left là một trong những khoảnh khắc xấu nhất của toàn bộ audit; không brand, không skeleton, không trạng thái.
  - **Giải pháp:** chặn state này bằng splash/skeleton đúng nghĩa; nếu bắt buộc phải load, dùng copy tiếng Việt và branded loading.

- `SC09_step13_goal_cut.png`
  - **Nhận xét:** body copy bị ngắt cụm `hàng ngày`; icon bar-chart cho nutrition quá KPI, thiếu ấm áp; composition lặp lại đúng bệnh của SC08.
  - **Giải pháp:** viết lại line-break; dùng icon ấm hơn; đổi copy từ liệt kê feature sang hứa hẹn outcome.

- `SC09_step17_noop_save.png`
  - **Nhận xét:** dùng `UtensilsCrossed` cho welcome slide meal planning là semantic inversion cực nặng - nó nói "cấm ăn" thay vì "chào mừng"; headline wrap dở; skip link xuất hiện quá sớm.
  - **Giải pháp:** đổi sang `Utensils`; rút headline; để `Bỏ qua` từ slide 2 trở đi.

---

### SC11 - Day clear / partial-day / dashboard-after-clear

- `SC11_step34_day_cleared.png`
  - **Nhận xét:** clear day state cần đọc được như một hành động đã hoàn tất, không phải content bốc hơi; nếu không có undo hoặc CTA phục hồi, user sẽ thấy "mất" hơn là "đã reset".
  - **Giải pháp:** toast hoặc inline state `Đã xóa kế hoạch hôm nay` + `Hoàn tác`; biến meal slots trống thành chỗ thêm mới rõ nghĩa.

- `SC11_step42_only_breakfast.png`
  - **Nhận xét:** partial-day state dễ bị hiểu thành incomplete/broken nếu không có progress framing; user chưa biết đây là 1/3 hoàn tất hay lỗi sync.
  - **Giải pháp:** show completeness (`1/3 bữa đã có kế hoạch`); đẩy lunch/dinner empty slots thành next actions.

- `SC11_step49_modal_ui.png`
  - **Nhận xét:** modal này là điển hình của pattern "không xấu nhưng thiếu quyết đoán": title dài, hierarchy còn ngang, chưa nói rõ object bị ảnh hưởng.
  - **Giải pháp:** rút title, chỉ rõ meal/day/template nào bị tác động; làm destructive action khác hệ hơn.

- `SC11_step53_dashboard_after_clear.png`
  - **Nhận xét:** sau clear, dashboard nhiều khả năng vẫn đông card nhưng ít giá trị; cảm giác là "mọi thứ còn đó nhưng trống ruột".
  - **Giải pháp:** collapse phần không liên quan, đưa 1 recovery block lớn: `Hôm nay chưa có kế hoạch` + CTA `Lên kế hoạch`.

- `SC11_step68_dinner_only_clear_verify.png`
  - **Nhận xét:** dinner-only state hợp lệ nhưng phải kể câu chuyện rõ ràng hơn; nếu không, user lại tự hỏi vì sao chỉ còn 1 bữa.
  - **Giải pháp:** làm nổi bật daily completeness và đồng bộ số liệu dinh dưỡng với state chỉ còn dinner.

---

### SC13 - Template manager / custom tags / save-delete flow

- `SC13_step35_14_template_in_manager.png`
  - **Nhận xét:** template manager đang trượt về admin UI - nhiều khối, ít thứ thật sự đáng chú ý; action density còn cao.
  - **Giải pháp:** nén template row; giữ tên, tóm tắt, trạng thái; chuyển edit/delete vào overflow.

- `SC13_step43_51_modal_title.png`
  - **Nhận xét:** modal title treatment nặng quá mức so với quyết định; title dài trên mobile làm modal cảm giác cồng kềnh.
  - **Giải pháp:** title 1 dòng nếu có thể; nuance xuống description; confirm label ngắn và dứt khoát.

- `SC13_step48_78_custom_tag_added.png` và `SC13_step49_80_tag_removed.png`
  - **Nhận xét:** tag add/remove đang có nguy cơ biến màn hình thành chip soup; state change feedback chưa đủ mạnh nên thao tác có thể bị xem như "mất tiêu".
  - **Giải pháp:** style custom tag khác system tag; thêm animation collapse nhẹ + undo snackbar khi remove.

- `SC13_step54_165_save_delete_flow.png`
  - **Nhận xét:** save và delete xuất hiện gần nhau trong cùng flow là vùng rủi ro cao nếu hierarchy không tuyệt đối rõ.
  - **Giải pháp:** giữ save là primary cố định; destructive action tách xa về không gian hoặc vào tầng confirm sau.

- `SC13_step57_final_state.png`
  - **Nhận xét:** đây là một màn quá nhiều quyết định ở above-the-fold: weekly selector, meal/nutrition switch, 3 CTA, recent dishes, nav. Nó sạch nhưng không bình tĩnh.
  - **Giải pháp:** giữ `Lên kế hoạch` là primary duy nhất; hạ `AI` và `Đi chợ`; giảm visual weight của recent dishes ở nửa trên.

---

### SC16 - Settings / backup / theme

- `SC16_step28_backup_ui_layout.png`
  - **Nhận xét:** settings screen sạch, nhưng row còn hơi cao và 2x2 theme selector đang dùng quá nhiều diện tích cho một quyết định nhỏ; Google Drive block chưa đủ status-rich.
  - **Giải pháp:** nén row; đổi theme selection sang segmented control/chip group gọn hơn; thêm last sync time, progress và error states cho backup.

---

### SC18 - Strategy / training step 6

- `SC18_step21_training_step6.png`
  - **Nhận xét:** đây là một trong những màn ít tệ hơn, nhưng vẫn mắc bệnh khoảng trắng dư và chưa giải thích đủ trade-off giữa hai chiến lược.
  - **Giải pháp:** đẩy content lên cao hơn; gắn `Đề xuất` cho option ưu tiên; thêm 1 dòng so sánh trực tiếp giữa hai lựa chọn.

---

### SC19 - Planner opened / add lunch / state transitions / dark cross-check

- `SC19_step27_planner_opened.png`
  - **Nhận xét:** planner mở ra mà không khóa đủ rõ `đang chỉnh bữa nào`, `đã chọn gì`, `còn thiếu gì` thì user sẽ phải giữ quá nhiều thông tin trong đầu.
  - **Giải pháp:** pin meal target ở đầu; sticky confirm; tách rõ library list khỏi planned selection.

- `SC19_step29_lunch_added.png`
  - **Nhận xét:** add lunch xong nhưng nếu success state chỉ thay card màu nhẹ thì chưa đủ; user cần thấy hệ quả đã cập nhật.
  - **Giải pháp:** flash success highlight trên slot và summary dinh dưỡng; thêm microcopy `Đã thêm vào Bữa trưa`.

- `SC19_step31_panel_001.png`
  - **Nhận xét:** panel state này có xu hướng card-chồng-card và header chưa đủ sắc; nhìn chung là "được dựng" nhưng chưa "được biên tập".
  - **Giải pháp:** gọn header; giảm nested surfaces; đặt meal context lên trước filter/search.

- `SC19_step67_state_180_after_add.png` và `SC19_step69_state_188.png`
  - **Nhận xét:** các state sau khi add nhiều content hơn nhưng chưa chắc rõ ràng hơn; draft vs saved distinction vẫn còn yếu.
  - **Giải pháp:** thêm trạng thái `Chưa lưu thay đổi / Đã lưu`; co bớt metadata lặp; giữ next step rõ.

- `SC19_step72_cross_201_dark.png`
  - **Nhận xét:** dark mode không tự cứu được planner; nếu hierarchy đã rối trong light mode thì dark mode chỉ làm các vùng càng dính nhau hơn.
  - **Giải pháp:** tăng contrast giữa planning area và result area; giảm accent count; chỉ giữ một bright accent cho task hiện tại.

---

### SC22 - Dark mode series

- `SC22_step03_welcome_step3.png`
  - **Nhận xét:** sạch nhưng generic; empty space hơi "template"; product promise chưa cụ thể.
  - **Giải pháp:** giảm khoảng trắng; show concrete benefit; step count rõ hơn.

- `SC22_step04_026_dark_body.png`
  - **Nhận xét:** đây là ví dụ điển hình của màn hình "smart-looking but mentally costly": header, date card, weekly strip, switch, 3 CTA, overflow menu, list, nav cùng nhau tranh ánh nhìn.
  - **Giải pháp:** bỏ date pill trùng; chỉ giữ một CTA primary; đơn giản hóa calendar/week cluster.

- `SC22_step05_027_dark_cards.png`
  - **Nhận xét:** dark surfaces đẹp nhưng chưa biết ưu tiên; hero to nhưng thiếu hướng; hai small cards squeezed và ít giá trị.
  - **Giải pháp:** hero phải có một CTA rõ; nutrition/recovery cần ladder hợp lý hơn; merge hoặc restack small cards.

- `SC22_step06_028_dark_modal.png`
  - **Nhận xét:** `BMR: NaN • TDEE: NaN` là lỗi P0 tuyệt đối; ở health app, đây là khoảnh khắc mất niềm tin ngay lập tức.
  - **Giải pháp:** không bao giờ render giá trị hỏng; fallback sang `Chưa thiết lập` / repair CTA / skeleton; viết unavailable-state có nhân phẩm.

- `SC22_step12_072_dark_nutrition.png`
  - **Nhận xét:** có dữ liệu nhưng chưa có hierarchy đủ tốt; macro, calories, chi tiết phụ còn cùng level.
  - **Giải pháp:** top card chỉ giữ consumed/target/remaining; macro row riêng; chart/details đưa xuống dưới và có thể collapse.

- `SC22_step13_078_dark_library.png`
  - **Nhận xét:** library dark mode thừa hưởng bệnh card density từ light mode; search/filter/content cùng lúc còn nặng mắt.
  - **Giải pháp:** list density cao hơn; search/filter nhẹ hơn; CTA tạo mới rõ ràng một điểm.

- `SC22_step17_104_dark_fitness.png`
  - **Nhận xét:** fitness cần cảm giác quyết đoán và có momentum, nhưng nếu plan/history/tips/stats đều la lên thì màn hình mất động lực.
  - **Giải pháp:** xoay màn hình quanh `Hôm nay tập gì`; history/insight xuống dưới; streak gọn lại.

- `SC22_step20_135_dark_settings_detail.png`
  - **Nhận xét:** dark detail forms rất dễ trông "premium" nhưng vẫn khó hoàn thành; nguy cơ ở đây là contrast phụ và save discoverability.
  - **Giải pháp:** tăng contrast helper text; section labels mạnh hơn; save action rõ và ổn định hơn.

- `SC22_step23_175_dark_css_vars.png`
  - **Nhận xét:** nếu đây là màn user-facing thì là một vết hở nội bộ; nếu là dev screen thì không được để lẫn vào điều hướng sản phẩm.
  - **Giải pháp:** tách hẳn sang dev-only route; label rõ đây là diagnostic/tooling nếu buộc phải hiện.

- `SC22_step27_198_dark_ai.png`
  - **Nhận xét:** AI screen có nguy cơ trở thành "AI vì AI"; nếu framing thiên về buzzword hơn job-to-be-done thì nó sẽ rỗng.
  - **Giải pháp:** định nghĩa AI bằng task cụ thể: phân tích ngày ăn, gợi ý món thiếu protein, điều chỉnh mục tiêu; show ví dụ output thật.

- `SC22_step30_210_final_light_mode.png`
  - **Nhận xét:** light mode bớt căng hơn dark ở màn này, nhưng dashboard vẫn over-stacked; hero, setup, recovery, empty-state cards, tip card cùng đòi chú ý.
  - **Giải pháp:** cắt bớt hero; gom/ghép small cards; làm next action nổi bật thay vì để user tự đọc hiểu.

---

### SC25 - Training profile / advanced fields / save flow

- `SC25_step31_fit007_form_opened.png`
  - **Nhận xét:** 15+ input visible cùng lúc, section labels chưa đủ mạnh, multi-select không có affordance, tone form còn thiên về intake form hơn là coaching.
  - **Giải pháp:** progressive disclosure; chia section card; thêm hint `chọn 1 hoặc nhiều`; viết lại label theo giọng người thật.

- `SC25_step40_fit018_sleep_visible_advanced.png`
  - **Nhận xét:** scroll mới thấy sleep field nhưng không có dấu hiệu còn nội dung phía dưới; `Giấc ngủ/đêm` mơ hồ về unit.
  - **Giải pháp:** thêm scroll hint hoặc chia section; đổi sang stepper/slider hoặc number input có unit rõ.

- `SC25_step43_fit025_aria_labels.png`
  - **Nhận xét:** ảnh không đủ để chấm a11y chi tiết, nhưng UI hiện hữu cho thấy các group multi-select/radio rất dễ thiếu structure cho screen reader.
  - **Giải pháp:** fieldset/legend thật; aria-pressed/aria-label đúng nghĩa; test lại bằng screen reader thay vì tự đoán.

- `SC25_step50_fit036_muscle_toggle.png`
  - **Nhận xét:** càng chọn nhiều, màn càng giống một mớ pill xanh/xám khó scan; thiếu summary `đã chọn bao nhiêu`.
  - **Giải pháp:** thêm counter; thêm `Chọn tất cả/Bỏ chọn tất cả`; thêm micro-animation/haptic để state change rõ.

- `SC25_step54_fit040_days_min2.png`
  - **Nhận xét:** constraint min=2 không được giải thích; user không hiểu vì sao không có 1 hoặc 7; standalone numbers thiếu unit.
  - **Giải pháp:** helper text cho range rationale; đổi label thể hiện `ngày/tuần`.

- `SC25_step59_fit047_cycle_weeks_options.png`
  - **Nhận xét:** `Chu kỳ nâng cao` là jargon nặng mà lại được hiển thị ngang hàng field bắt buộc; option 4/8/12/16 không có guidance.
  - **Giải pháp:** đưa vào section nâng cao collapse mặc định; default 8 tuần; tooltip giải thích ý nghĩa.

- `SC25_step61_fit049_submit_minimal.png`
  - **Nhận xét:** `Hủy` còn quá nổi; equal-width buttons làm primary không đủ chênh; chưa thấy save/loading feedback.
  - **Giải pháp:** ghost/text cancel; primary rộng và mạnh hơn; loading state trong button; safe-area padding chuẩn.

- `SC25_step62_fit049_profile_saved.png`
  - **Nhận xét:** save thành công mà gần như không có dấu hiệu nào cho user biết; đây là visibility-of-system-status fail cơ bản.
  - **Giải pháp:** toast hoặc checkmark confirmation; cho user thấy screen đã cập nhật.

- `SC25_step63_fit050_all_fields_filled.png`
  - **Nhận xét:** wall of green pills và text; không có hierarchy giữa quan trọng và tùy chọn; verify correctness rất mệt.
  - **Giải pháp:** có read-mode summary theo section; chỉ mở section khi user muốn sửa.

- `SC25_step64_fit050_submit_full.png`
  - **Nhận xét:** form phức tạp mà không có bước review; một chạm `Lưu` cho 15+ input là quá liều.
  - **Giải pháp:** `Xem lại và lưu`; summary cards + edit links theo nhóm.

- `SC25_step70_tc_fit_070_strength_advanced_6.png`
  - **Nhận xét:** combination demanding nhưng UI không cảnh báo hay khuyến khích đúng mức; app im lặng trước quyết định có rủi ro.
  - **Giải pháp:** smart alert mềm về recovery; contextual tip theo profile đã chọn.

- `SC25_step72_tc_fit_091_endurance_beginner_2.png`
  - **Nhận xét:** đây là một lựa chọn beginner khá hợp lý nhưng UI không khen, không trấn an, không giúp user hình dung plan sẽ trông ra sao.
  - **Giải pháp:** thêm positive reinforcement; show preview mini của tuần mẫu.

- `SC25_step74_tc_fit_110_hypertrophy_advanced_3.png`
  - **Nhận xét:** combo này không phổ biến nhưng UI cũng không hỏi lại hoặc giải thích tác động; hệ thống đang bỏ phí cơ hội coach.
  - **Giải pháp:** detection cho unusual combinations + clarifying question hoặc suggestion.

- `SC25_step79_fit187_plan_or_cta.png`
  - **Nhận xét:** ảnh này gần như không tạo state mới rõ ràng; nếu phải giữ, nó đang làm audit nặng lên mà không thêm insight.
  - **Giải pháp:** hoặc bỏ khỏi bộ capture, hoặc đảm bảo mỗi ảnh test đại diện cho một state thực sự khác biệt.

- `SC25_step81_fit191_form_reopen.png`
  - **Nhận xét:** reopen form mà không có dirty-state warning sẽ rất dễ mất công sức nhập trước đó.
  - **Giải pháp:** dirty tracking + modal xác nhận khi back/close.

- `SC25_step82_fit193_double_save.png`
  - **Nhận xét:** nếu double-tap save chưa bị khóa thì đây là rủi ro data/state duplication điển hình.
  - **Giải pháp:** disable button trong async save; hiển thị `Đang lưu...`.

- `SC25_step84_fit195_rapid_exp_switch.png`
  - **Nhận xét:** rapid switching của multi-select mà không có debounce/feedback rõ sẽ dễ tạo cảm giác app lag hoặc miss tap.
  - **Giải pháp:** optimistic update mượt; nếu có max selection, phải hiển thị ngay.

- `SC25_step87_fit204_i18n_labels.png`
  - **Nhận xét:** `Bodyweight`, `Machine`, `Cable`, `Kettlebell` trong app tiếng Việt là i18n debt lộ liễu; cũng không có icon hỗ trợ nghĩa.
  - **Giải pháp:** dịch toàn bộ; nếu giữ proper terms thì phải có chú giải hoặc visual aid.

---

### SC26 - Plan day / rest day / regenerate / reload

- `SC26_step47_day_1_T2_workout.png`
  - **Nhận xét:** workout card ở đây là một điểm sáng hiếm - preview 3 bài + `+3 bài tập nữa` là pattern tốt; nhưng top action cluster và `Tạo lại kế hoạch` vẫn quá lộ.
  - **Giải pháp:** giữ teaser card; làm rõ button labels; đẩy destructive regeneration vào overflow.

- `SC26_step48_day_2_T3_workout.png`
  - **Nhận xét:** multi-session day đột ngột xuất hiện mà không giải thích; `Buổi 1/Buổi 2` tranh pattern với day selector; input cân nặng bị bolt-on.
  - **Giải pháp:** giải thích vì sao có 2 session; nếu sáng/tối thì phải nói rõ; dời weight tracking khỏi workout detail.

- `SC26_step49_day_3_T4_workout.png`
  - **Nhận xét:** cardio day mà hiển thị `0 bài tập` / `0 phút` là sai mental model; user sẽ nghi hệ thống fail.
  - **Giải pháp:** nếu cardio day là free-form, phải nói đúng như vậy; đưa quick-add cho các hoạt động cardio thực.

- `SC26_step53_day_7_CN_rest.png`
  - **Nhận xét:** rest day card là một trong những thứ làm tốt nhất trong toàn bộ fitness module: màu khác, tone tốt, expectation cho ngày mai rõ; chỉ có weight input vẫn lạc chỗ.
  - **Giải pháp:** giữ rest day card gần như nguyên; dời weight logging đi nơi hợp logic hơn.

- `SC26_step56_regenerate_modal.png`, `SC26_step58_exercises_expanded.png`, `SC26_step62_streak_dots.png`, `SC26_step65_add_session_modal.png`
  - **Nhận xét:** cả cụm này đều cho thấy vấn đề modal blur nặng, context mất, button state không hoàn chỉnh hoặc screenshot không đủ chứng cứ. Nếu title thật sự là `Tạo lại kế hoạch` trong nhiều nhánh khác nhau thì pattern modal đang bị reuse sai.
  - **Giải pháp:** giảm blur; nhấn hậu quả của destructive action rõ hơn; đảm bảo mỗi modal có title, action set và context đúng với flow gọi nó.

- `SC26_step67_re_render_after_nav.png`
  - **Nhận xét:** `0 Chuỗi ngày tập` với vòng đỏ cho fresh user là demotivating; nutrition card trong fitness tab còn lạc nghĩa; above-the-fold có quá nhiều thứ đòi nhìn.
  - **Giải pháp:** pending day = neutral gray, không phải đỏ; ẩn `Chuỗi dài nhất: 0`; dời hoặc contextualize nutrition block.

- `SC26_step68_after_reload.png`
  - **Nhận xét:** tab semantics chưa rõ; cùng layout nhưng nghĩa content đổi làm user dễ mất orientation; nutrition breakdown chi tiết ở fitness tab tiếp tục đặt sai chỗ.
  - **Giải pháp:** tab labels + icons rõ hơn; breadcrumb mental model rõ hơn; chỉ tích hợp nutrition nếu nói rõ nó là cross-tab data.

---

### SC27 - Welcome step phụ

- `SC27_step02_welcome_step2.png`
  - **Nhận xét:** contrast body text và heading đều yếu; icon to quá lấn chữ; copy thiên về liệt kê feature và buzzword hơn là ích lợi; CTA nhỏ, trôi góc phải.
  - **Giải pháp:** tăng contrast; giảm icon size; viết copy theo outcome; dùng CTA mạnh hơn và step indicator rõ ràng hơn.

---

### SC28 - Workout logging / stopwatch / activity states

- `SC28_step04_005_cycling_selected.png`
  - **Nhận xét:** selected state còn nhạt; zone labels đòi user biết sẵn kiến thức cardio; chưa có contextual guidance.
  - **Giải pháp:** tăng rõ selected treatment; thêm mini explanation cho zones; nếu zones tappable thì phải có affordance.

- `SC28_step08_009_manual_mode.png` và `SC28_step15_023_save_workout.png`
  - **Nhận xét:** các state manual/save thuộc nhóm "tracking control" nhưng chưa cho cảm giác chắc tay; user cần biết rõ đang ghi, đang lưu, hay đã lưu.
  - **Giải pháp:** làm rõ status strip; success feedback sau save; giảm ambiguity giữa manual entry và live tracking.

- `SC28_step28_037_calorie_type_change.png`
  - **Nhận xét:** đổi loại calorie mà không có giải thích hoặc feedback rõ sẽ tạo cảm giác metric nhảy tùy hứng.
  - **Giải pháp:** show microcopy giải thích loại năng lượng nào đang được xem và vì sao.

- `SC28_step35_048_rapid_switch.png`
  - **Nhận xét:** đúng tên file: rapid switch. Vấn đề là giao diện không chỉ ra gesture hay undo, nên quick-switch trở thành rủi ro.
  - **Giải pháp:** gắn toast `Đã chuyển sang...` + undo; nếu swipe-based thì phải có hint.

- `SC28_step42_058_swimming_selected.png`
  - **Nhận xét:** lặp lại bệnh zone-without-context của cycling; bơi còn cần metric đặc thù hơn nhưng UI chưa nói.
  - **Giải pháp:** nếu không đủ scope cho swim-specialized metrics, ít nhất phải giải thích zone bằng ngôn ngữ người dùng.

- `SC28_step53_115_stop_reset.png`
  - **Nhận xét:** stop/reset là vùng nguy hiểm. Nếu confirm/undo không đủ rõ, đây là nơi người dùng mất dữ liệu nhanh nhất.
  - **Giải pháp:** xác nhận cho reset; safe copy; preview hệ quả trước khi xóa session.

- `SC28_step61_146_multi_combos_7.png` và `SC28_step62_147_stopwatch_combo.png`
  - **Nhận xét:** nhiều combo metrics cùng lúc rất dễ thành bảng điều khiển nhỏ, nhưng thiếu hierarchy thì người dùng không biết nhìn gì trước.
  - **Giải pháp:** luôn xác định một primary metric và làm các metric còn lại secondaries.

- `SC28_step63_153_multi_field_done.png`
  - **Nhận xét:** completion state mà không có payoff cảm xúc thì người dùng chỉ thấy "xong form", không thấy "xong buổi tập".
  - **Giải pháp:** thêm check/celebration nhẹ và nêu thành tích chính.

- `SC28_step71_174_reopen.png`
  - **Nhận xét:** reopen flow nếu không nói rõ đang `resume` hay `review` sẽ rất dễ gây sai thao tác.
  - **Giải pháp:** header rõ `Tiếp tục buổi tập` hay `Xem lại buổi tập`; phân biệt 2 đường đi.

- `SC28_step74_184_active_type_distinction.png`
  - **Nhận xét:** đây là ảnh verify một distinction quan trọng: nếu active type không đủ khác, cả flow cardio/live tracking sẽ mơ hồ.
  - **Giải pháp:** icon, label và accent của active type phải khác ở mức glanceable, không chỉ khác chút màu.

- `SC28_step79_198_dashboard_calories.png` và `SC28_step82_201_formula_verify.png`
  - **Nhận xét:** các ảnh verify integration cho thấy nguy cơ product để lộ công thức/thông số kỹ thuật thay vì insight đã biên tập.
  - **Giải pháp:** dashboard chỉ show user-facing outcomes; công thức và verify numbers đi xuống tầng detail/dev/test, không lên mặt tiền.

- `SC28_step83_202_stopwatch_short.png`
  - **Nhận xét:** buổi tập quá ngắn mà UI không hỏi lại là missed chance cho error prevention.
  - **Giải pháp:** confirm early end nếu duration quá ngắn; cho quick resume.

- `SC28_step84_204_walking_low.png`
  - **Nhận xét:** label `low`/`thấp` dễ mang tính phán xét; user cần context hơn là bị chấm điểm.
  - **Giải pháp:** reframe sang `nhịp nhẹ nhàng` hoặc `phù hợp hồi phục`; nếu dưới mục tiêu thì giải thích nhẹ nhàng.

---

### SC29 - Workout history empty grouping

- `SC29_step31_week_groups.png`
  - **Nhận xét:** top segment active state nổi kiểu "card trong card"; empty history state sạch nhưng quá ít guidance; không có CTA rõ để bắt đầu lấp lịch sử.
  - **Giải pháp:** làm segmented control liền khối hơn; empty state cần hành động cụ thể như `Tạo buổi tập đầu tiên` hoặc `Xem kế hoạch tuần này`.

---

### SC30 - Analytics / hero cards / empty charts / insights

- `SC30_step29_hero_card.png`
  - **Nhận xét:** hero metric cards có nền tảng tốt nhưng label như `1RM ước tính` còn nặng domain knowledge; `0%`/`+0%` không được giải thích là tốt hay xấu.
  - **Giải pháp:** thêm context cho 1RM; biến zero-state thành `Chưa có dữ liệu`; làm adherence card là hero thật nếu đó là trọng tâm.

- `SC30_step31_weight_card.png`
  - **Nhận xét:** delta như `+2kg` quá bé và thiếu goal context; user không biết đây là tiến bộ hay trượt mục tiêu.
  - **Giải pháp:** gắn delta với goal; làm delta prominent hơn; cho biết mốc so sánh.

- `SC30_step36_adherence_capped.png`
  - **Nhận xét:** capped/adherence mà không giải nghĩa khiến con số đẹp vẫn vô hồn; thiếu streak hay praise.
  - **Giải pháp:** contextual label (`Rất tốt`, `Hoàn hảo`); thêm streak/mục tiêu tuần.

- `SC30_step37_sessions_card.png`
  - **Nhận xét:** mixed empty states (`—`, `87kg`, `0%`) trong cùng card là pattern cực xấu; user không biết cái nào là no-data, cái nào là zero thật.
  - **Giải pháp:** chuẩn hóa empty data; card nào chưa có dữ liệu phải nói `Chưa có`, và có CTA điền/log đầu tiên.

- `SC30_step39_sheet_1rm.png`
  - **Nhận xét:** đây là P0 của analytics: một khối chart xanh trống trơn, không axis, không labels, không explanation nhưng filter vẫn sáng như thể dùng được.
  - **Giải pháp:** empty chart state thật sự: icon, explanation, CTA, ghost axes; disable hoặc contextualize filters khi no data.

- `SC30_step45_time_range_1M.png` và `SC30_step47_time_range_all.png`
  - **Nhận xét:** lặp lại bệnh empty visualization của step39; `all` không có ngữ cảnh thời gian; user không biết chart sau này sẽ trông thế nào.
  - **Giải pháp:** hiển thị date range thực; ghost chart structure kể cả khi empty; CTA `Nhập cân nặng hôm nay`.

- `SC30_step52_cycle_no_plan.png`
  - **Nhận xét:** `Bỏ lỡ 3 buổi tập tuần này` là giọng điệu phán xét và clinical, đi ngược hoàn toàn brand rule `never clinical`.
  - **Giải pháp:** rewrite sang giọng phục hồi, không kết án; luôn kèm recovery action thay vì chỉ báo lỗi.

- `SC30_step63_adherence_extended.png`
  - **Nhận xét:** `Strength stagnation` trong UI tiếng Việt là một cú trượt ngôn ngữ và tone cực nặng; chồng hai insight tiêu cực trên nhau làm màn hình trở nên đe dọa.
  - **Giải pháp:** dịch ra ngôn ngữ người dùng và biến insight thành hành động được; duy trì tỷ lệ positive insight : constructive insight cân bằng hơn.

- `SC30_step65_sheet_weight_1M.png`
  - **Nhận xét:** bars placeholder không có trục, không nhãn, không scale - user nhìn không biết mình đang xem ngày, tuần hay cái gì.
  - **Giải pháp:** nếu empty thì đừng giả vờ có chart; nếu là loading thì skeleton phải khác empty; khi có data phải có axis và labels cơ bản.

- `SC30_step73_insights_all_dismissed.png`
  - **Nhận xét:** dismiss hết insights rồi màn hình sạch hơn nhưng lại hơi trống và thiếu định hướng; `+220%` là một con số rất mạnh mà UI không biết kể chuyện.
  - **Giải pháp:** thay blank space bằng positive summary hoặc next milestone; làm volume spike vừa được khen vừa được contextualize.

---

### SC31 - Toast / extreme boundary feedback

- `SC31_step50_xss_input.png` và `SC31_step60_save_boundary_300.png`
  - **Nhận xét:** stacked success toasts quá to, quá nhiều, che nội dung bên dưới; hierarchy trong toast yếu; phản hồi thành spam thay vì xác nhận.
  - **Giải pháp:** nén toast, không stack kiểu chiếm nửa màn hình; giới hạn số toast đồng thời; ưu tiên một notification hợp nhất.

---

### SC34 - Energy sheet / meal added / final dashboard

- `SC34_step29_after_ebm_click.png`
  - **Nhận xét:** energy sheet sạch nhưng quá rỗng; `0 kcal` với nhiều khoảng trắng làm sheet như chưa build xong; close button hơi nặng.
  - **Giải pháp:** bổ sung explanatory empty state; hạ visual weight của close; tránh `-0 kcal` hoặc các biểu đạt máy móc tương tự.

- `SC34_step37_meal_added.png`
  - **Nhận xét:** đây là một trong những màn tốt nhất của bộ planner: hierarchy, summary, selected state, footer flow đều tương đối rõ.
  - **Giải pháp:** chỉ cần giảm nhẹ mức over-encoding của selected card và làm close button đỡ áp đảo hơn.

- `SC34_step40_final_state.png`
  - **Nhận xét:** hero `33 Cần cải thiện` vừa phán xét vừa mơ hồ; pills số liệu không tự giải thích; top module làm toàn bộ dashboard cứng và lạnh.
  - **Giải pháp:** bỏ framing chê bai; đổi hero thành ngôn ngữ coaching; chỉ giữ số liệu có label rõ.

---

### SC35 - Final dashboard state

- `SC35_step31_final.png`
  - **Nhận xét:** quick-action row ở đáy là hợp lý, nhưng phía trên còn quá nhiều module cùng hét; page thiếu một trọng tâm thật sự.
  - **Giải pháp:** chọn một hero duy nhất; gộp hoặc hạ các card phụ; để action row hỗ trợ hero thay vì cứu hero.

---

### SC36 - Info row / quantity style state

- `SC36_step29_info_row.png`
  - **Nhận xét:** đây là một trong các màn yếu nhất toàn bộ bộ ảnh: `— kg` lơ lửng, `- / +` trần trụi, nút lưu mờ, khoảng trắng khổng lồ. Nó giống wireframe hơn là sản phẩm.
  - **Giải pháp:** xây input surface thật sự; giải thích vì sao chưa lưu được; làm quantity control có container, affordance và nhịp spacing chuẩn.

---

### SC37 - Final state variation

- `SC37_step30_final.png`
  - **Nhận xét:** tốt hơn SC34/35 ở chỗ action row đỡ user bị lạc, nhưng top area vẫn quá nặng; secondary text còn nhạt.
  - **Giải pháp:** đẩy value/action lên trước, checklist/setup xuống sau; tăng contrast cho meta text.

---

### SC38 - AI tab / dashboard tab

- `SC38_step03_tab_ai.png`
  - **Nhận xét:** 3-step progression là đúng; option `Chụp ảnh / Tải ảnh` rõ; nhưng CTA dễ nhìn như enabled dù chưa có input, và phần dưới còn generic.
  - **Giải pháp:** buộc CTA phản ánh readiness thật; cho phần dưới thấy giá trị cụ thể của flow AI này.

- `SC38_step05_tab_dashboard.png`
  - **Nhận xét:** headline `Bắt đầu hành trình sức khỏe` có tone tốt; nhưng hero vẫn chiếm quá nhiều, và hệ card bên dưới lại tản mạn.
  - **Giải pháp:** hero ngắn lại; giữ một primary next action; bớt số block cạnh tranh trong màn đầu.

---

### SC42 - Plan day editor / exercise selector / unsaved dialog

- `SC42_step01_editor_opened.png`
  - **Nhận xét:** structure hiểu được nhưng scanability yếu vì exercise rows quá giống nhau; strip icon-only actions còn mù nghĩa.
  - **Giải pháp:** phân lớp row rõ hơn; bổ sung label/tooltips hoặc text affordance cho các icon quan trọng.

- `SC42_step04_remove_toast.png`
  - **Nhận xét:** remove toast nhỏ và yếu hơn mức cần thiết, lại tranh chỗ với button đáy; user rất dễ bỏ lỡ.
  - **Giải pháp:** đưa toast lên vùng không đụng CTA; tăng clarity của action result.

- `SC42_step05_empty_state.png`
  - **Nhận xét:** quá trống và quá ít chỉ dẫn; chỉ có 1 câu text trong biển trắng.
  - **Giải pháp:** empty state phải dạy user việc thêm bài tập sẽ mở ra điều gì; thêm value + CTA.

- `SC42_step06_exercise_selector.png` và `SC42_step07_after_add_exercise.png`
  - **Nhận xét:** selector khá ổn về hierarchy cục bộ, nhưng list items hơi text-heavy; sau khi add, editor lại lộ bệnh row sameness.
  - **Giải pháp:** giữ search/chip pattern; giảm text density; làm row actions rõ ưu tiên hơn.

- `SC42_step10_unsaved_dialog.png`
  - **Nhận xét:** đây là modal chín hơn mặt bằng chung, nhưng secondary actions vẫn hơi mềm và quá gần nhau; title ổn, structure ổn.
  - **Giải pháp:** phân cấp 3 lựa chọn rõ hơn bằng color/weight; giữ modal thấp hơn để đỡ cao.

- `SC42_step12_accessibility_expanded.png`
  - **Nhận xét:** expanded state dễ dùng hơn collapsed, nhưng card cao quá làm một phần tử nuốt cả màn; divider/meta còn nhạt.
  - **Giải pháp:** chia card thành khối nhỏ hơn hoặc progressive disclosure trong card; tăng contrast cho labels phụ.

- `SC42_step13_final.png`
  - **Nhận xét:** alert, streak, energy, day selector, actions, helper banner cùng hiện khiến màn hình busy; không có thứ gì thật sự được chọn làm "trọng tâm".
  - **Giải pháp:** chỉ giữ một primary story trên first fold; helper banner và stats phụ phải xuống sau.

---

### SC43 - Add session / logging / history / broken summary

- `SC43_step26_add_session_modal.png`
  - **Nhận xét:** một trong những màn tốt nhất toàn bộ bộ ảnh: option lớn, rõ, dễ scan; chỉ có mixed language `(Strength)/(Freestyle)` làm mất độ chín.
  - **Giải pháp:** Việt hóa triệt để; giữ nguyên hierarchy và touch sizing.

- `SC43_step28_exercise_selector.png`
  - **Nhận xét:** selector tiếp tục là điểm sáng cục bộ; vấn đề còn lại là text density và card sameness.
  - **Giải pháp:** giảm metadata noise; giữ action flow hiện tại.

- `SC43_step29_first_exercise_added.png` và `SC43_step30_second_exercise_added.png`
  - **Nhận xét:** state tiến triển có thật nhưng màn vẫn còn quá nhiều dead zone; momentum buổi tập chưa được xây đúng mức.
  - **Giải pháp:** lấp khoảng chết bằng progress hoặc next-step guidance; làm `Tiếp theo` rõ hơn.

- `SC43_step31_first_set_logged.png`, `SC43_step32_two_sets_logged.png`, `SC43_step39_e2e_set_logged.png`
  - **Nhận xét:** rest timer modal là điểm sáng rất rõ của module fitness: focus tốt, countdown dễ hiểu, action rõ. Chỉ hơi oversized so với nền bên dưới.
  - **Giải pháp:** giữ gần như nguyên; chỉ tinh lại scale và consistency so với các modal khác.

- `SC43_step35_after_save.png`
  - **Nhận xét:** success toast + warning card + streak warning + energy block + helper banner chồng nhau khiến màn hình như đang nag user từ 4 hướng.
  - **Giải pháp:** sau save chỉ nên ưu tiên một thông điệp chính; phần cảnh báo phụ phải chờ sau hoặc collapse.

- `SC43_step36_workout_history.png`
  - **Nhận xét:** sạch nhưng underfilled; một card lịch sử nổi trong biển trắng tạo cảm giác hệ thống chưa có substance.
  - **Giải pháp:** tăng supporting metadata hoặc grouping để justify không gian dọc.

- `SC43_step37_finish_0_exercises.png` và `SC43_step40_e2e_summary.png`
  - **Nhận xét:** đây là hai màn vỡ layout rõ nhất toàn bộ batch: summary panel chỉ chiếm bên trái màn hình, phần phải trống; CTA xanh dương lạc hệ; chưa được QA thị giác nghiêm túc.
  - **Giải pháp:** sửa layout mobile trước mọi polish khác; summary phải full-width; CTA phải quay về color semantics chung.

- `SC43_step38_e2e_start.png`
  - **Nhận xét:** empty workout start state quá lạnh, quá ít guidance; `Chưa có bài tập...` chưa đủ để kéo user tiếp tục.
  - **Giải pháp:** empty state đúng nghĩa với CTA, benefit và explanation ngắn.

---

### Standalone verification images

- `ai-button-fix.png`
  - **Nhận xét:** fix button AI có giúp đỡ hơn trước, nhưng đồng thời phơi bày một bệnh hệ thống lớn hơn: hàng action có ba "thương hiệu màu" khác nhau cùng tồn tại.
  - **Giải pháp:** định nghĩa rõ semantic role cho AI, shopping, primary planning; không để mỗi action tự chọn một màu.

- `meal-slot-icons.png`
  - **Nhận xét:** meal-slot icons rõ hơn placeholder cũ, nhưng breakfast và lunch còn chưa khác nhau đủ nhanh ở mức glance.
  - **Giải pháp:** tăng mức khác biệt hình khối/silhouette; đừng chỉ đổi chi tiết nhỏ.

- `verify-calendar-icons.png`
  - **Nhận xét:** icon system cải thiện, nhưng spacing/secondary hierarchy của slot cards vẫn còn tiềm năng tối ưu.
  - **Giải pháp:** nới breathing room; cho subtitle hierarchy rõ hơn.

- `verify-library-icons.png`
  - **Nhận xét:** bright blue instructional banner quá ồn so với phần còn lại; slot row/icon còn hơi nhỏ.
  - **Giải pháp:** hạ cường độ banner; tăng target và clarity cho icon/slot row.

- `verify-meal-icons.png`
  - **Nhận xét:** trong ba ảnh verify, đây là ảnh ổn nhất vì page context rõ; tuy vậy vẫn còn redundancy giữa title và khối chọn ngày lớn.
  - **Giải pháp:** bỏ bớt layer lặp thông tin; giữ meal slot system làm trung tâm.

---

## Kết luận chốt hạ

Nếu đội sản phẩm hỏi tôi "nên sửa gì trước", đây là thứ tự không được cãi:

1. **P0 - Fix trust**
   - `NaN`, `undefined`, template string hỏng, summary lệch layout, modal state mù, chart giả dữ liệu

2. **P1 - Fix hierarchy**
   - mỗi màn chỉ được có **một** primary action thật sự
   - cắt card thừa
   - dẹp bớt green misuse

3. **P1 - Fix empty/recovery states**
   - planner, analytics, workout start, search no result, partial day, cleared day

4. **P1 - Fix form ergonomics**
   - training profile
   - ingredient form
   - dish form

5. **P2 - Fix tone**
   - bỏ wording phán xét, clinical, buzzwordy
   - biến app từ "bảng điều khiển số liệu" thành "người hướng dẫn biết điều"

6. **P2 - Fix consistency**
   - modal taxonomy
   - close button style
   - toast system
   - localized copy
   - icon semantics

Điểm quan trọng nhất tôi muốn để lại là thế này:

> **Ứng dụng này không thiếu công sức. Nó thiếu sự tàn nhẫn trong việc loại bỏ cái thừa và kỷ luật trong việc chỉ cho người dùng nhìn đúng thứ cần nhìn.**

Khi đội ngũ sửa được điều đó, sản phẩm này sẽ nhảy chất rất nhanh. Hiện tại, nó vẫn đang ở mức "có tiềm năng mạnh nhưng còn quá nhiều dấu tay của hệ thống chưa được biên tập đến nơi đến chốn".
