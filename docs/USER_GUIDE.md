# 📱 Smart Meal Planner — Mô Tả Dự Án

> Tài liệu dành cho người dùng cuối, không yêu cầu kiến thức kỹ thuật.
> Cập nhật: Tháng 4/2026

---

## Mục lục

1. [Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
2. [Bắt đầu sử dụng — Hành trình người dùng mới](#2-bắt-đầu-sử-dụng--hành-trình-người-dùng-mới)
3. [Lập kế hoạch bữa ăn — Tab Lịch](#3-lập-kế-hoạch-bữa-ăn--tab-lịch)
4. [Thư viện nguyên liệu & món ăn — Tab Thư viện](#4-thư-viện-nguyên-liệu--món-ăn--tab-thư-viện)
5. [Phân tích AI — Tab AI](#5-phân-tích-ai--tab-ai)
6. [Tập luyện & Thể dục — Tab Fitness](#6-tập-luyện--thể-dục--tab-fitness)
7. [Bảng điều khiển — Tab Dashboard](#7-bảng-điều-khiển--tab-dashboard)
8. [Danh sách đi chợ](#8-danh-sách-đi-chợ)
9. [Cài đặt & Sao lưu dữ liệu](#9-cài-đặt--sao-lưu-dữ-liệu)
10. [Cách dữ liệu kết nối với nhau](#10-cách-dữ-liệu-kết-nối-với-nhau)
11. [Tính năng dự kiến trong tương lai](#11-tính-năng-dự-kiến-trong-tương-lai)

---

## 1. Giới thiệu tổng quan

### App này là gì?

**Smart Meal Planner** là một ứng dụng di động giúp bạn **lên kế hoạch bữa ăn hàng ngày** và **theo dõi quá trình tập luyện** — tất cả trong một app duy nhất. Thay vì phải dùng nhiều app riêng lẻ (một app đếm calo, một app ghi workout, một app lên thực đơn), Smart Meal Planner gộp tất cả lại để bạn có cái nhìn toàn diện về sức khỏe của mình.

### App giải quyết vấn đề gì?

Nhiều người muốn ăn uống khoa học hơn nhưng gặp những rào cản sau:

- **Không biết nên ăn gì mỗi ngày** để đạt mục tiêu (giảm cân, tăng cơ, giữ dáng)
- **Không biết thức ăn chứa bao nhiêu calo**, bao nhiêu đạm, béo, tinh bột
- **Không có thời gian** lên thực đơn, tính toán dinh dưỡng thủ công
- **Quên đi chợ mua gì** khi đã lên kế hoạch xong
- **Muốn tập luyện** nhưng không biết lên kế hoạch tập ra sao
- **Dữ liệu rải rác** ở nhiều nơi, không có bức tranh tổng thể

Smart Meal Planner giải quyết **tất cả** những vấn đề trên.

### Dành cho ai?

- Người muốn **giảm cân** một cách khoa học
- Người tập gym muốn **tăng cơ**, cần theo dõi lượng đạm (protein) hàng ngày
- Người muốn **ăn uống cân bằng**, biết mình đang nạp gì vào cơ thể
- Bất kỳ ai muốn **tiết kiệm thời gian** lên thực đơn và đi chợ

### 3 điểm khác biệt

| Điểm khác biệt                | Giải thích                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| **Không cần internet**        | Hầu hết tính năng hoạt động khi không có mạng. Dữ liệu lưu ngay trên điện thoại.            |
| **Trí tuệ nhân tạo tích hợp** | Chụp ảnh thức ăn → app tự nhận diện và tính dinh dưỡng. AI gợi ý thực đơn phù hợp mục tiêu. |
| **Tất cả trong một**          | Dinh dưỡng + tập luyện + đi chợ + theo dõi tiến độ — không cần cài thêm app nào khác.       |

### Giao diện chính — 5 tab

App có **5 tab** (5 màn hình chính) ở thanh điều hướng phía dưới:

| Tab           | Biểu tượng | Chức năng chính                       |
| ------------- | ---------- | ------------------------------------- |
| **Lịch**      | 📅         | Lên kế hoạch bữa ăn hàng ngày         |
| **Thư viện**  | 📦         | Quản lý nguyên liệu và món ăn         |
| **AI**        | 🤖         | Chụp ảnh phân tích, gợi ý thực đơn    |
| **Fitness**   | 💪         | Kế hoạch tập luyện và ghi log workout |
| **Dashboard** | 📊         | Tổng quan tiến độ hôm nay             |

Ngoài ra còn có nút **Cài đặt** (biểu tượng bánh răng ⚙️) ở góc trên bên phải, mở ra trang thiết lập đầy đủ.

---

## 2. Bắt đầu sử dụng — Hành trình người dùng mới

Khi mở app lần đầu, bạn sẽ trải qua **7 bước** thiết lập ban đầu (gọi là Onboarding). Quá trình này mất khoảng 3-5 phút và chỉ cần làm **một lần duy nhất**.

### Bước 1: Chào mừng (3 slide giới thiệu)

App giới thiệu ngắn gọn về chính mình:

- Smart Meal Planner giúp bạn lên kế hoạch ăn uống
- Kết hợp theo dõi dinh dưỡng và tập luyện
- Mọi dữ liệu nằm trên điện thoại, riêng tư tuyệt đối

Bạn lướt qua 3 slide bằng cách nhấn **"Tiếp tục"**, sau đó nhấn **"Bắt đầu"**.

### Bước 2: Thông tin sức khỏe cơ bản

Bạn nhập:

- **Giới tính**: Nam hoặc Nữ
- **Tên**: Tên bạn muốn hiển thị trong app
- **Ngày sinh**: Để app tính tuổi chính xác
- **Chiều cao** (cm)
- **Cân nặng** (kg)

> **Tại sao cần những thông tin này?** App dùng chúng để tính lượng calo cơ thể bạn đốt mỗi ngày (gọi là BMR và TDEE). Từ đó xác định bạn nên ăn bao nhiêu để đạt mục tiêu.

### Bước 3: Mức độ vận động

Bạn chọn một trong 5 mức:

| Mức                | Mô tả                                    | Ví dụ               |
| ------------------ | ---------------------------------------- | ------------------- |
| Ít vận động        | Ngồi làm việc cả ngày, không tập thể dục | Nhân viên văn phòng |
| Hoạt động nhẹ      | Tập 1-2 buổi/tuần                        | Đi bộ cuối tuần     |
| Hoạt động vừa      | Tập 3-4 buổi/tuần                        | Gym 3 buổi/tuần     |
| Hoạt động tích cực | Tập 5-6 buổi/tuần                        | Tập luyện đều đặn   |
| Hoạt động rất cao  | Tập hàng ngày, cường độ cao              | Vận động viên       |

### Bước 4: Mục tiêu dinh dưỡng

Bạn chọn **mục tiêu chính**:

- **Giảm cân** (Cut): Ăn ít hơn lượng calo cơ thể cần → giảm mỡ
- **Tăng cân** (Bulk): Ăn nhiều hơn → tăng cơ bắp
- **Giữ cân** (Maintain): Ăn vừa đủ → duy trì thể trạng hiện tại

Nếu chọn giảm hoặc tăng cân, bạn còn chọn **tốc độ**:

- **Chậm (Conservative)**: Thay đổi ~275 calo/ngày — an toàn, bền vững
- **Vừa (Moderate)**: Thay đổi ~550 calo/ngày — cân bằng
- **Nhanh (Aggressive)**: Thay đổi ~1100 calo/ngày — nhanh nhưng khó duy trì

### Bước 5: Xác nhận chỉ số

App hiển thị kết quả tính toán dựa trên thông tin bạn vừa nhập:

- **BMR**: Số calo cơ thể đốt khi nghỉ ngơi hoàn toàn (chỉ để duy trì nhịp tim, hô hấp...)
- **TDEE**: Tổng calo cơ thể cần mỗi ngày (đã tính cả vận động)
- **Mục tiêu calo**: Số calo bạn nên ăn mỗi ngày để đạt mục tiêu
- **Lượng đạm (Protein)**: Gam protein khuyến nghị mỗi ngày
- **Lượng béo (Fat)**: Gam chất béo khuyến nghị
- **Lượng tinh bột (Carbs)**: Gam tinh bột khuyến nghị

> **Ví dụ**: Nam, 29 tuổi, 75kg, 175cm, tập 3 buổi/tuần, muốn giảm cân vừa phải → BMR ≈ 1704 calo, TDEE ≈ 2641 calo, Mục tiêu ≈ 2091 calo/ngày.

Bạn nhấn **"Xác nhận"** nếu đồng ý, hoặc quay lại sửa thông tin.

### Bước 6: Thiết lập kế hoạch tập luyện

App hỏi thêm về thói quen tập:

- **Kinh nghiệm tập**: Mới bắt đầu / Đã tập 1-2 năm / Tập lâu năm
- **Mục tiêu tập**: Tăng sức mạnh / Tăng cơ / Tăng sức bền / Cải thiện chung
- **Số ngày tập/tuần**: 3, 4, 5, hoặc 6 ngày
- **Thời gian mỗi buổi**: 30-90 phút
- **Thiết bị có sẵn**: Gym đầy đủ / Tạ nhà / Chỉ có thể hình (bodyweight)
- **Chấn thương/hạn chế**: Nếu có

Bạn có thể nhấn **"Bỏ qua"** nếu chưa quan tâm đến tập luyện.

### Bước 7: Tạo kế hoạch & Xem trước

App dùng AI để **tự động tạo kế hoạch tập luyện** phù hợp với bạn. Quá trình mất khoảng 10-15 giây, app hiển thị hiệu ứng "đang tính toán".

Sau đó, bạn xem trước kế hoạch tập (ngày nào tập nhóm cơ nào, bài tập gì). Nhấn **"Bắt đầu tập luyện"** để hoàn tất và vào app chính.

> **Lưu ý**: Tất cả thông tin bạn nhập ở bước Onboarding đều có thể thay đổi sau trong phần **Cài đặt**. Bạn không cần lo lắng nếu chưa chắc chắn.

---

## 3. Lập kế hoạch bữa ăn — Tab Lịch

Đây là tab **mặc định** khi bạn mở app — nơi bạn dành nhiều thời gian nhất mỗi ngày.

### Giao diện chính

Phía trên cùng là **thanh chọn ngày**: bạn có thể lướt trái/phải để chọn ngày khác, hoặc nhấn vào ngày để mở lịch đầy đủ. Mặc định hiển thị **ngày hôm nay**.

Bên dưới thanh ngày có **2 sub-tab** (2 chế độ xem):

#### Sub-tab "Bữa ăn" — Xem và chỉnh sửa thực đơn

Hiển thị 3 phần theo thứ tự:

- **🌅 Bữa Sáng** (Breakfast)
- **☀️ Bữa Trưa** (Lunch)
- **🌙 Bữa Tối** (Dinner)

Mỗi bữa hiển thị:

- Danh sách các món đã thêm (tên, calo, protein)
- Nút **"Thêm món"** để thêm món từ thư viện
- Tổng calo + protein của bữa đó

Phía dưới cùng là **thanh tổng hợp mini**: hiển thị tổng calo đã ăn, calo còn lại so với mục tiêu, và protein đã nạp.

#### Sub-tab "Dinh dưỡng" — Xem thống kê chi tiết

Hiển thị:

- **Mục tiêu ngày**: X calo, Yg Protein
- **Biểu đồ tròn**: tỷ lệ Protein / Chất béo / Tinh bột
- **Thanh tiến trình**: Đã ăn bao nhiêu so với mục tiêu
- **Thống kê từng bữa**: Calo và macro của sáng/trưa/tối

### Thêm món vào bữa ăn

Khi nhấn **"Thêm món"** hoặc **"Lên kế hoạch"**, một cửa sổ mở ra với:

1. **Danh sách món nhanh**: Những món bạn hay dùng, hiển thị kèm calo và protein. Nhấn 1 lần để thêm.
2. **Tìm kiếm**: Gõ tên món để lọc.
3. **Chọn bữa đích**: Sáng / Trưa / Tối — nhấn vào tên bữa để chuyển.

Sau khi chọn xong tất cả món, nhấn **"Xác nhận"** để lưu kế hoạch.

### Tính năng nâng cao

| Tính năng                | Cách sử dụng                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Copy kế hoạch**        | Nhấn biểu tượng copy → chọn ngày nguồn → chọn ngày đích. Ví dụ: copy thực đơn thứ Hai sang thứ Ba.               |
| **Lưu template**         | Nhấn biểu tượng lưu → đặt tên (VD: "Ngày ăn nhiều đạm"). Lần sau dùng lại chỉ cần chọn template.                 |
| **Xóa kế hoạch**         | Nhấn biểu tượng xóa → chọn phạm vi: xóa 1 ngày, 1 tuần, hoặc 1 tháng.                                            |
| **Gợi ý AI**             | Nhấn nút gợi ý → AI đề xuất thực đơn cả ngày phù hợp mục tiêu calo/protein. Bạn duyệt và chấp nhận hoặc từ chối. |
| **Điều chỉnh khẩu phần** | Mỗi món có thể nhân khẩu phần (1x, 2x, 3x) nếu bạn ăn nhiều hơn.                                                 |

---

## 4. Thư viện nguyên liệu & món ăn — Tab Thư viện

Tab Thư viện là **kho lưu trữ** tất cả nguyên liệu và công thức món ăn của bạn. Đây là nền tảng cho mọi tính toán dinh dưỡng trong app.

### 2 phần chính

Tab Thư viện chia thành 2 sub-tab:

#### A. Nguyên liệu (Ingredients)

Nguyên liệu là **thực phẩm cơ bản** — những thứ bạn mua ở chợ/siêu thị. Ví dụ: ức gà, trứng, gạo lứt, bông cải xanh, khoai lang...

Mỗi nguyên liệu lưu trữ thông tin **dinh dưỡng trên 100g**:

- **Calo** (năng lượng)
- **Protein** (đạm) — tính bằng gam
- **Carbs** (tinh bột) — tính bằng gam
- **Fat** (chất béo) — tính bằng gam
- **Chất xơ** (fiber) — tính bằng gam (tùy chọn)

**App đã có sẵn 10 nguyên liệu mẫu** khi bạn hoàn tất Onboarding:

| #   | Nguyên liệu     | Calo/100g | Protein | Carbs | Fat |
| --- | --------------- | --------- | ------- | ----- | --- |
| 1   | Ức gà           | 165       | 31g     | 0g    | 4g  |
| 2   | Trứng gà        | 155       | 13g     | 1g    | 11g |
| 3   | Yến mạch        | 389       | 17g     | 66g   | 7g  |
| 4   | Sữa chua Hy Lạp | 59        | 10g     | 4g    | 0g  |
| 5   | Khoai lang      | 86        | 2g      | 20g   | 0g  |
| 6   | Bông cải xanh   | 34        | 3g      | 7g    | 0g  |
| 7   | Thịt bò         | 250       | 26g     | 0g    | 15g |
| 8   | Gạo lứt         | 111       | 3g      | 23g   | 1g  |
| 9   | Cá hồi          | 208       | 20g     | 0g    | 13g |
| 10  | Hạt chia        | 486       | 17g     | 42g   | 31g |

Bạn có thể **thêm nguyên liệu mới** bất cứ lúc nào. Khi thêm, app cho phép dùng AI để **tự động tra cứu** dinh dưỡng — bạn chỉ cần gõ tên nguyên liệu, AI sẽ điền sẵn các con số (cần internet).

**Các thao tác với nguyên liệu:**

- Tìm kiếm theo tên
- Sắp xếp theo: tên, calo, protein
- Sửa thông tin dinh dưỡng
- Xóa (app cảnh báo nếu nguyên liệu đang được dùng trong món ăn nào)
- Chọn đơn vị (gam, ml, muỗng, miếng...)

#### B. Món ăn (Dishes)

Món ăn là **công thức** — kết hợp nhiều nguyên liệu với khẩu phần cụ thể. Ví dụ: "Ức gà áp chảo" = 200g ức gà + 10ml dầu ô-liu + 50g rau.

Mỗi món ăn bao gồm:

- **Tên món** (tiếng Việt, có thể thêm tên tiếng Anh)
- **Danh sách nguyên liệu**: Mỗi dòng ghi tên + khẩu phần (VD: Ức gà 200g)
- **Loại bữa**: Sáng / Trưa / Tối (một món có thể thuộc nhiều bữa)
- **Đánh giá**: 1-5 sao (để bạn nhớ món nào ngon)
- **Dinh dưỡng tổng**: App **tự động tính** từ nguyên liệu — bạn KHÔNG cần nhập

**App đã có sẵn 5 món mẫu:**

| #   | Món ăn             | Calo | Protein | Bữa       |
| --- | ------------------ | ---- | ------- | --------- |
| 1   | Yến mạch sữa chua  | 332  | 25g     | Sáng      |
| 2   | Ức gà áp chảo      | 330  | 62g     | Trưa, Tối |
| 3   | Khoai lang luộc    | 129  | 3g      | Trưa, Tối |
| 4   | Bông cải xanh luộc | 51   | 5g      | Trưa, Tối |
| 5   | Trứng ốp la        | 155  | 13g     | Sáng, Tối |

**Các thao tác với món ăn:**

- Tạo món mới từ nguyên liệu có sẵn
- Sửa công thức (thêm/bớt nguyên liệu, đổi khẩu phần)
- Sao chép (duplicate) để tạo biến thể
- So sánh 2 món cạnh nhau (để chọn món nào phù hợp hơn)
- Sắp xếp theo: tên, calo, protein, số nguyên liệu, đánh giá sao
- Tìm kiếm, lọc theo loại bữa

### Chuỗi tính toán dinh dưỡng

Đây là cách app tính toán tự động:

```
Nguyên liệu (dinh dưỡng/100g)
    ↓ nhân với khẩu phần
Món ăn (tổng dinh dưỡng = tổng các nguyên liệu)
    ↓ thêm vào bữa ăn
Bữa ăn (tổng = tổng các món)
    ↓ cộng 3 bữa
Tổng ngày (so sánh với mục tiêu)
```

> **Ví dụ**: Bạn ăn sáng "Trứng ốp la" (155 calo) + "Yến mạch sữa chua" (332 calo) = Bữa sáng 487 calo. Cộng với trưa 510 calo + tối 330 calo = Tổng ngày 1327 calo. Mục tiêu 2091 calo → Còn lại 764 calo.

---

## 5. Phân tích AI — Tab AI

Tab AI dùng **trí tuệ nhân tạo** (Google Gemini) để giúp bạn tiết kiệm thời gian nhập liệu và nhận gợi ý thông minh.

> **Lưu ý**: Các tính năng AI **cần kết nối internet** để hoạt động. Các tab khác vẫn hoạt động bình thường khi không có mạng.

### 3 tính năng AI chính

#### A. Phân tích ảnh thức ăn

Đây là tính năng nổi bật nhất:

1. **Chụp ảnh** món ăn trước mặt bạn (hoặc chọn ảnh từ thư viện điện thoại)
2. Nhấn **"Phân tích"**
3. AI **nhận diện** món ăn, ước tính:
   - Tên món
   - Danh sách nguyên liệu có thể
   - Khẩu phần ước tính
   - Dinh dưỡng (calo, protein, carbs, fat)
4. Bạn **xem kết quả**, chỉnh sửa nếu cần
5. Nhấn **"Lưu"** để thêm vào thư viện món ăn

> **Ví dụ**: Chụp ảnh đĩa cơm gà → AI nhận diện: "Cơm gà xối mỡ" — Gạo trắng 200g, Đùi gà 150g, Dầu ăn 15ml, Rau xà lách 30g → Tổng ~550 calo, 35g protein.

#### B. Gợi ý thực đơn

Khi bạn muốn app tự lên thực đơn cho mình:

1. Vào tab Lịch → nhấn **"Gợi ý AI"**
2. AI xem xét:
   - Mục tiêu calo/protein của bạn
   - Các món trong thư viện của bạn
   - Món nào phù hợp bữa sáng/trưa/tối
3. AI đề xuất **thực đơn cả ngày** (sáng + trưa + tối)
4. Bạn **duyệt**, chỉnh sửa, rồi chấp nhận

#### C. Tra cứu dinh dưỡng tự động

Khi thêm nguyên liệu mới:

1. Gõ tên nguyên liệu (VD: "Đậu hũ")
2. Nhấn nút **"AI tra cứu"**
3. AI tự điền: 76 calo, 8g protein, 2g carbs, 4g fat /100g
4. Bạn kiểm tra lại và lưu

> Tính năng này tiết kiệm rất nhiều thời gian vì bạn không cần tự tra bảng dinh dưỡng.

---

## 6. Tập luyện & Thể dục — Tab Fitness

Tab Fitness giúp bạn **lên kế hoạch tập luyện** và **ghi lại quá trình tập** mỗi ngày. Được thiết kế cho cả người mới bắt đầu lẫn người tập lâu năm.

### 3 phần chính

#### A. Kế hoạch tập (Plan)

App hỗ trợ nhiều kiểu chia lịch tập (gọi là "split"):

| Kiểu chia          | Mô tả                               | Phù hợp với                   |
| ------------------ | ----------------------------------- | ----------------------------- |
| **Full Body**      | Tập toàn thân mỗi buổi              | Người mới, tập 3 buổi/tuần    |
| **Upper/Lower**    | Xen kẽ: thân trên / chân            | Trung cấp, 4 buổi/tuần        |
| **Push/Pull/Legs** | Đẩy (ngực, vai) / Kéo (lưng) / Chân | Cao cấp, 5-6 buổi/tuần        |
| **Bro Split**      | Mỗi ngày 1 nhóm cơ                  | Tập trung từng phần, 5-6 buổi |
| **Tùy chỉnh**      | Bạn tự thiết kế                     | Ai muốn tự lên lịch           |

**Lịch tập hiển thị theo tuần:**

- Mỗi ngày ghi rõ: nhóm cơ nào, bài tập gì
- Ngày nghỉ đánh dấu riêng
- Nhấn vào ngày để xem chi tiết bài tập

**Bạn có thể:**

- Dùng **kế hoạch AI tạo sẵn** (dựa trên profile ở Onboarding)
- Chọn từ **thư viện template** có sẵn (nhiều mẫu kế hoạch)
- **Tự tạo** kế hoạch hoàn toàn mới
- **Chỉnh sửa** bất kỳ ngày nào: thêm/bớt/đổi bài tập
- **Đổi kiểu chia** (split) nếu muốn thay đổi

#### B. Ghi log tập luyện (Workout Logging)

Khi đến giờ tập, bạn mở tab Fitness và nhấn **"Bắt đầu tập"**:

**Tập sức mạnh (Strength):**

- Chọn bài tập (VD: Bench Press, Squat...)
- Ghi từng set: cân nặng (kg) × số lần (reps)
- Đánh giá mức độ khó (RPE — thang 1-10)
- Hẹn giờ nghỉ giữa set
- App tự tính tổng khối lượng (volume)

**Tập cardio:**

- Chọn loại: Chạy bộ, Đạp xe, Bơi, HIIT...
- Ghi: thời gian, khoảng cách, cường độ
- App tự tính calo đốt ước tính

#### C. Theo dõi tiến độ (Progress)

App tự động theo dõi và hiển thị:

- **Biểu đồ cân nặng**: Xu hướng tăng/giảm theo thời gian
- **Kỷ lục cá nhân (PR)**: Mức tạ nặng nhất bạn từng nâng cho mỗi bài tập
- **Streak tập luyện**: Số ngày liên tiếp bạn tập — động lực giữ thói quen
- **Thống kê tuần**: Tổng buổi tập, tổng khối lượng, thời gian tập

> **Mẹo**: Ghi log đều đặn giúp bạn thấy rõ tiến bộ theo thời gian. Đừng bỏ qua buổi tập nào!

---

## 7. Bảng điều khiển — Tab Dashboard

Dashboard là **trang tổng hợp** — cho bạn cái nhìn nhanh về tình hình hôm nay chỉ trong vài giây.

### Các phần trên Dashboard

#### A. Phần đầu — Tổng quan nhanh

Hiển thị ngay khi mở:

- **Cân nặng hôm nay** (nếu đã ghi) với mũi tên xu hướng ↑↓
- **Điểm số ngày** (0-100%): Đánh giá tổng hợp dựa trên:
  - Bạn đã ăn gần đúng mục tiêu calo chưa? ✓
  - Đã đủ protein chưa? ✓
  - Đã tập luyện chưa? ✓
  - Đã ghi cân chưa? ✓
  - Streak tập luyện còn duy trì không? ✓
- **Màu sắc trực quan**: Xanh (tốt) / Vàng (tạm) / Xám (chưa đạt)

#### B. Thẻ dinh dưỡng hôm nay

- **Thanh tiến trình calo**: Đã ăn X / Mục tiêu Y calo
- **Thanh tiến trình protein**: Đã nạp Xg / Mục tiêu Yg
- Nhấn vào để xem **chi tiết đầy đủ**: BMR, TDEE, Mục tiêu, chia theo bữa

#### C. Gợi ý thông minh (AI Insights)

AI phân tích thói quen của bạn và đưa gợi ý:

- "Hôm nay bạn còn thiếu 20g protein — thêm 1 quả trứng vào bữa tối"
- "Bạn đã tập 5 ngày liên tiếp — tuyệt vời!"
- "Calo hôm nay vượt mục tiêu 200 calo — giảm nhẹ ngày mai"

#### D. Thao tác nhanh (Quick Actions)

Các nút bấm để làm nhanh các việc thường ngày:

- 📝 **Ghi cân** — nhập cân nặng hôm nay
- 💪 **Log tập** — mở ghi log workout
- 🍽️ **Lên thực đơn** — mở tab Lịch
- 🛒 **Xem đi chợ** — mở danh sách mua sắm
- ⚙️ **Chỉnh mục tiêu** — mở cài đặt nhanh

#### E. Thống kê tuần

Tóm tắt 7 ngày gần nhất:

- Số ngày đã tập
- Xu hướng cân nặng
- Tổng calo trung bình/ngày
- Protein trung bình/ngày

---

## 8. Danh sách đi chợ

Tính năng **Danh sách đi chợ** (Grocery List) giúp bạn biết cần mua gì dựa trên kế hoạch bữa ăn.

### Cách hoạt động

1. Bạn đã lên kế hoạch bữa ăn cho 1 ngày hoặc 1 tuần (ở tab Lịch)
2. Mở danh sách đi chợ
3. App **tự động tổng hợp** tất cả nguyên liệu cần thiết
4. Phân loại theo nhóm thực phẩm

### Phân loại nguyên liệu

| Nhóm                       | Ví dụ                          |
| -------------------------- | ------------------------------ |
| **Đạm** (Protein)          | Ức gà, thịt bò, cá hồi, trứng  |
| **Sữa & chế phẩm** (Dairy) | Sữa chua, phô mai              |
| **Ngũ cốc** (Grains)       | Gạo lứt, yến mạch, bánh mì     |
| **Rau củ quả** (Produce)   | Bông cải, khoai lang, rau xanh |
| **Khác**                   | Dầu ăn, gia vị, hạt chia       |

### Tính năng

- **Chọn phạm vi**: Hôm nay / Tuần này / Tùy chọn ngày
- **Check off** ✓: Đánh dấu khi đã mua xong
- **Số lượng**: App cộng dồn nếu nhiều món cùng dùng 1 nguyên liệu (VD: 3 món dùng ức gà → tổng 600g ức gà)
- **Xem nguồn**: Biết nguyên liệu này dùng cho món nào

---

## 9. Cài đặt & Sao lưu dữ liệu

Nhấn biểu tượng **⚙️ bánh răng** ở góc trên bên phải để mở trang Cài đặt. Đây là nơi bạn tùy chỉnh mọi thứ.

### A. Hồ sơ sức khỏe

Chỉnh sửa lại thông tin đã nhập ở Onboarding:

- Tên, giới tính, ngày sinh
- Chiều cao, cân nặng
- Mức độ vận động
- Tỉ lệ mỡ cơ thể (tùy chọn, cho kết quả chính xác hơn)
- Tỷ lệ protein (g/kg cân nặng)
- Ghi đè BMR thủ công (nếu bạn biết chính xác BMR của mình)

> **Quan trọng**: Khi bạn thay đổi cân nặng hoặc mức vận động, app **tự động tính lại** tất cả chỉ số: BMR → TDEE → Mục tiêu calo → Tỷ lệ macro. Bạn không cần tính toán thủ công.

### B. Mục tiêu dinh dưỡng

Thay đổi mục tiêu:

- **Kiểu**: Giảm cân / Tăng cân / Giữ cân
- **Tốc độ**: Chậm / Vừa / Nhanh
- Xem ngay **offset calo** (giảm/tăng bao nhiêu so với TDEE)
- Lưu → Toàn bộ app cập nhật theo mục tiêu mới

### C. Hồ sơ tập luyện

Chỉnh sửa thông tin tập luyện:

- Kinh nghiệm, mục tiêu tập
- Số ngày tập/tuần
- Thiết bị, chấn thương
- Nhóm cơ ưu tiên

### D. Giao diện — Chế độ tối (Dark Mode)

App hỗ trợ **4 chế độ hiển thị**:

| Chế độ                 | Mô tả                                   |
| ---------------------- | --------------------------------------- |
| **Sáng** (Light)       | Nền trắng, chữ đen — mặc định           |
| **Tối** (Dark)         | Nền đen, chữ trắng — dễ nhìn ban đêm    |
| **Hệ thống** (System)  | Theo cài đặt của điện thoại             |
| **Tự động** (Schedule) | Tự chuyển: 6h sáng → sáng, 6h tối → tối |

### E. Sao lưu & Khôi phục dữ liệu

Đây là phần **cực kỳ quan trọng** — đảm bảo bạn không mất dữ liệu.

**3 cách sao lưu:**

| Cách               | Mô tả                                                | Khi nào dùng                                   |
| ------------------ | ---------------------------------------------------- | ---------------------------------------------- |
| **Lưu file local** | Tải file sao lưu (.json) về máy tính hoặc điện thoại | Sao lưu thủ công, chuyển sang thiết bị khác    |
| **Google Drive**   | Đồng bộ lên Google Drive                             | Sao lưu tự động, an toàn trên đám mây          |
| **Chia sẻ**        | Xuất file sao lưu → gửi qua Zalo, email...           | Chia sẻ cho người khác hoặc gửi cho chính mình |

**Đồng bộ Google Drive:**

1. Nhấn **"Đăng nhập Google"**
2. Chọn tài khoản Google
3. Nhấn **"Tải lên"** để sao lưu
4. Nhấn **"Tải xuống"** để khôi phục
5. Nếu dữ liệu trên Drive khác với trên điện thoại, app hỏi bạn muốn giữ bản nào

**Khôi phục dữ liệu:**

- Cài app mới → Cài đặt → Khôi phục → Chọn file sao lưu hoặc đăng nhập Google Drive
- Tất cả dữ liệu (nguyên liệu, món ăn, kế hoạch, workout, cân nặng) được phục hồi

> **Khuyến nghị**: Sao lưu **ít nhất 1 lần/tuần** lên Google Drive để không mất dữ liệu nếu điện thoại gặp sự cố.

---

## 10. Cách dữ liệu kết nối với nhau

Một trong những điểm mạnh nhất của Smart Meal Planner là **mọi thứ kết nối với nhau**. Thay đổi ở một nơi sẽ tự động cập nhật ở mọi nơi khác.

### Pipeline dinh dưỡng (từ nguyên liệu → mục tiêu)

```
Bạn nhập NGUYÊN LIỆU (calo, protein, carbs, fat /100g)
         ↓
Tạo MÓN ĂN (kết hợp nguyên liệu → app tính tổng dinh dưỡng)
         ↓
Lên BỮA ĂN trong ngày (sáng/trưa/tối → app cộng tổng)
         ↓
Tổng DINH DƯỠNG NGÀY (so sánh với mục tiêu)
         ↓
Hiển thị trên DASHBOARD (điểm số, tiến trình, gợi ý)
```

### Pipeline tập luyện (từ profile → tiến độ)

```
Bạn nhập HỒ SƠ SỨC KHỎE (cân nặng, chiều cao, tuổi)
         ↓
Chọn MỤC TIÊU TẬP (sức mạnh, cơ bắp, sức bền)
         ↓
App tạo KẾ HOẠCH TẬP (lịch tuần, bài tập mỗi ngày)
         ↓
Bạn GHI LOG tập luyện (bài tập, tạ, set, rep)
         ↓
App theo dõi TIẾN ĐỘ (PR, streak, biểu đồ cân nặng)
```

### Cầu nối giữa dinh dưỡng và tập luyện

Hai pipeline trên **kết nối chặt chẽ** qua các điểm sau:

| Điểm kết nối     | Giải thích                                                       |
| ---------------- | ---------------------------------------------------------------- |
| **Cân nặng**     | Ảnh hưởng đến cả TDEE (calo cần) lẫn mục tiêu protein (g/kg)     |
| **Mức vận động** | Tập nhiều hơn → TDEE cao hơn → cần ăn nhiều hơn                  |
| **Mục tiêu**     | Muốn giảm cân → ăn ít hơn TDEE; Muốn tăng cơ → ăn nhiều hơn TDEE |
| **Dashboard**    | Gộp cả dinh dưỡng + tập luyện vào 1 điểm số duy nhất             |
| **AI**           | Gợi ý thực đơn dựa trên cả mục tiêu ăn uống lẫn kế hoạch tập     |

### Khi bạn thay đổi 1 thông tin...

**Ví dụ: Bạn cập nhật cân nặng từ 75kg → 80kg**

App tự động cập nhật:

1. ✅ BMR tăng (cơ thể nặng hơn đốt nhiều calo hơn khi nghỉ)
2. ✅ TDEE tăng theo
3. ✅ Mục tiêu calo điều chỉnh
4. ✅ Mục tiêu protein tăng (2g × 80kg = 160g thay vì 150g)
5. ✅ Dashboard hiển thị số mới
6. ✅ Tab Lịch cập nhật thanh tiến trình
7. ✅ Biểu đồ cân nặng ghi nhận điểm mới

Bạn **không cần làm gì thêm** — app xử lý tất cả.

### Hoạt động khi không có internet (Offline)

| Tính năng                 | Offline | Online |
| ------------------------- | ------- | ------ |
| Xem/chỉnh kế hoạch bữa ăn | ✅      | ✅     |
| Thêm nguyên liệu/món ăn   | ✅      | ✅     |
| Ghi log tập luyện         | ✅      | ✅     |
| Xem Dashboard/tiến độ     | ✅      | ✅     |
| Danh sách đi chợ          | ✅      | ✅     |
| Sao lưu file local        | ✅      | ✅     |
| **Phân tích ảnh AI**      | ❌      | ✅     |
| **Gợi ý thực đơn AI**     | ❌      | ✅     |
| **Tra cứu dinh dưỡng AI** | ❌      | ✅     |
| **Đồng bộ Google Drive**  | ❌      | ✅     |

> Nói cách khác: **90% tính năng hoạt động không cần mạng**. Chỉ AI và đồng bộ đám mây cần internet.

### Bảo mật & Quyền riêng tư

- **Dữ liệu nằm trên điện thoại**: Tất cả nguyên liệu, món ăn, kế hoạch, workout, cân nặng — lưu trong cơ sở dữ liệu ngay trên thiết bị của bạn
- **Không gửi lên server**: App KHÔNG có server riêng, không thu thập dữ liệu người dùng
- **AI là ngoại lệ duy nhất**: Khi dùng tính năng AI, ảnh/thông tin được gửi đến Google Gemini để xử lý — nhưng chỉ khi bạn chủ động nhấn nút
- **Google Drive là tùy chọn**: Chỉ đồng bộ nếu bạn tự đăng nhập và nhấn "Tải lên"
- **Xóa app = xóa hết**: Nếu gỡ app, tất cả dữ liệu bị xóa (trừ khi đã sao lưu)

---

## 11. Tính năng dự kiến trong tương lai

Smart Meal Planner đang tiếp tục phát triển. Dưới đây là những tính năng có thể được bổ sung trong các phiên bản tiếp theo:

### Đang cân nhắc phát triển

| Tính năng                  | Mô tả                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| **Phiên bản iOS**          | Hiện tại app chỉ có trên Android. Phiên bản iPhone/iPad đang được cân nhắc.              |
| **Đồng bộ nhiều thiết bị** | Dùng cùng tài khoản trên nhiều thiết bị, dữ liệu tự đồng bộ.                             |
| **Chia sẻ thực đơn**       | Gửi kế hoạch bữa ăn cho bạn bè, gia đình.                                                |
| **Theo dõi nước uống**     | Nhắc nhở uống nước và ghi lượng nước mỗi ngày.                                           |
| **Barcode scanner**        | Quét mã vạch sản phẩm tại siêu thị → tự động nhập dinh dưỡng.                            |
| **Kết nối smartwatch**     | Đồng bộ dữ liệu calo đốt, nhịp tim từ đồng hồ thông minh.                                |
| **Báo cáo hàng tháng**     | Tổng hợp tiến độ 30 ngày: xu hướng cân nặng, tuân thủ dinh dưỡng, consistency tập luyện. |
| **Chế độ ăn đặc biệt**     | Hỗ trợ Keto, Low-carb, Vegetarian, Vegan — lọc và gợi ý phù hợp.                         |
| **Nhắc nhở thông minh**    | Thông báo nhắc ăn, nhắc tập, nhắc ghi cân theo lịch bạn đặt.                             |
| **Nhiều ngôn ngữ**         | Hiện tại giao diện chính bằng tiếng Việt. Có thể thêm tiếng Anh đầy đủ.                  |

---

## Tóm tắt nhanh

| Bạn muốn...       | Mở tab...                | Làm gì...                         |
| ----------------- | ------------------------ | --------------------------------- |
| Xem hôm nay ăn gì | 📅 Lịch                  | Xem kế hoạch sáng/trưa/tối        |
| Thêm món mới      | 📅 Lịch → Thêm món       | Chọn từ thư viện hoặc tìm kiếm    |
| Tạo công thức     | 📦 Thư viện → Món ăn     | Nhấn "Tạo món" → thêm nguyên liệu |
| Chụp ảnh thức ăn  | 🤖 AI                    | Chụp → Phân tích → Lưu            |
| Xem kế hoạch tập  | 💪 Fitness               | Xem lịch tuần, bài tập mỗi ngày   |
| Ghi log tập       | 💪 Fitness → Bắt đầu tập | Ghi set, rep, cân nặng            |
| Xem tiến độ       | 📊 Dashboard             | Điểm số, biểu đồ, thống kê        |
| Đi chợ            | 🛒 Danh sách đi chợ      | Check off từng món                |
| Đổi mục tiêu      | ⚙️ Cài đặt               | Mục tiêu dinh dưỡng → Lưu         |
| Sao lưu           | ⚙️ Cài đặt → Sao lưu     | Google Drive hoặc file local      |

---

> **Smart Meal Planner** — Ăn đúng. Tập đúng. Sống khỏe.
