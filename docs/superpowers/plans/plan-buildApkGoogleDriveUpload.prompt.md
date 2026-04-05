## KẾ HOẠCH: Tự động upload APK lên Google Drive sau khi build

### Mô tả

Cập nhật `build-apk.sh` để sau khi build APK xong, tự động upload file lên thư mục Google Drive do user chỉ định. Sử dụng `gdrive` CLI — binary nhẹ, không phụ thuộc Python, auth 1 lần qua trình duyệt.

---

### Bước 1: Cài đặt `gdrive` CLI (1 lần duy nhất)

```bash
# Apple Silicon Mac
brew install gdrive

# Hoặc cài thủ công:
curl -L -o gdrive.tar.gz https://github.com/glotlabs/gdrive/releases/latest/download/gdrive_macos-arm64.tar.gz
tar -xzf gdrive.tar.gz
sudo mv gdrive /usr/local/bin/

# Xác thực Google Account (mở trình duyệt, chỉ cần 1 lần)
gdrive account add
```

### Bước 2: Lấy Google Drive Folder ID

Mở Google Drive → vào thư mục muốn upload → URL có dạng:

```
https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz
                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                        Đây là FOLDER_ID
```

### Bước 3: Cập nhật `build-apk.sh`

**Thay đổi chính:**

1. Thêm biến `GOOGLE_DRIVE_FOLDER_ID` ở đầu script (cấu hình cố định hoặc truyền qua argument).
2. Cho phép override folder ID qua tham số dòng lệnh: `./build-apk.sh <FOLDER_ID>`.
3. Thêm **Step 4/4** sau khi copy APK ra Desktop:
   - Kiểm tra `gdrive` CLI đã cài chưa → nếu chưa, in hướng dẫn cài đặt, build vẫn thành công.
   - Xóa file APK cũ (tên `MealPlaning_*`) trên Drive folder để không tích lũy file rác.
   - Upload file APK mới lên Drive folder chỉ định.
   - In ra link Google Drive của file vừa upload.
4. Nếu `GOOGLE_DRIVE_FOLDER_ID` trống → bỏ qua upload, không lỗi.
5. Cập nhật tổng kết cuối script: hiển thị trạng thái upload + Drive link.

**Cách chạy:**

```bash
# Cách 1: Truyền folder ID qua tham số
./build-apk.sh 1AbCdEfGhIjKlMnOpQrStUvWxYz

# Cách 2: Cấu hình cố định trong script (dòng GOOGLE_DRIVE_FOLDER_ID)
GOOGLE_DRIVE_FOLDER_ID="1AbCdEfGhIjKlMnOpQrStUvWxYz"
./build-apk.sh
```

---

### Chi tiết code thay đổi trong `build-apk.sh`

#### Thêm cấu hình ở đầu file (sau dòng NC=)

```bash
# ============================================
# CẤU HÌNH GOOGLE DRIVE
# Thay GOOGLE_DRIVE_FOLDER_ID bằng ID thư mục Google Drive của bạn.
# ID lấy từ URL: https://drive.google.com/drive/folders/<FOLDER_ID>
# Để trống "" nếu không muốn upload.
# ============================================
GOOGLE_DRIVE_FOLDER_ID=""
```

#### Thêm override qua argument (sau khai báo OUTPUT_APK)

```bash
# Cho phép override folder ID qua tham số dòng lệnh
# VD: ./build-apk.sh 1AbCdEfGhIjKlMnOpQrStUvWxYz
if [ -n "$1" ]; then
    GOOGLE_DRIVE_FOLDER_ID="$1"
fi
```

#### Đổi step labels từ `[x/3]` → `[x/4]`

#### Thêm Step 4 (sau khi tính APK_SIZE, trước tổng kết)

```bash
# ------------------------------------------
# Step 4: Upload lên Google Drive
# ------------------------------------------
UPLOAD_STATUS="KHONG UPLOAD (chua cau hinh folder ID)"
DRIVE_LINK=""

if [ -n "$GOOGLE_DRIVE_FOLDER_ID" ]; then
    echo ""
    echo -e "${YELLOW}[4/4] Uploading to Google Drive...${NC}"

    # Kiểm tra gdrive CLI đã cài chưa
    if ! command -v gdrive &> /dev/null; then
        echo -e "${RED}gdrive CLI chua duoc cai dat!${NC}"
        echo ""
        echo -e "${CYAN}Huong dan cai dat:${NC}"
        echo -e "  1. Tai gdrive tu: ${CYAN}https://github.com/glotlabs/gdrive/releases${NC}"
        echo -e "     Chon file: ${CYAN}gdrive_macos-arm64.tar.gz${NC} (Apple Silicon)"
        echo -e "     Hoac:      ${CYAN}gdrive_macos-x64.tar.gz${NC} (Intel Mac)"
        echo ""
        echo -e "  2. Giai nen va di chuyen vao PATH:"
        echo -e "     ${CYAN}tar -xzf gdrive_macos-*.tar.gz${NC}"
        echo -e "     ${CYAN}sudo mv gdrive /usr/local/bin/${NC}"
        echo ""
        echo -e "  3. Xac thuc Google Account (chi can 1 lan):"
        echo -e "     ${CYAN}gdrive account add${NC}"
        echo ""
        echo -e "  4. Chay lai script nay."
        echo ""
        UPLOAD_STATUS="THAT BAI (gdrive chua cai dat)"
    else
        # Xóa file APK cũ trên Google Drive (cùng thư mục)
        echo -e "  Dang xoa file APK cu tren Drive..."
        OLD_FILES=$(gdrive files list --parent "$GOOGLE_DRIVE_FOLDER_ID" --skip-header 2>/dev/null \
            | grep "MealPlaning_" | awk '{print $1}')
        if [ -n "$OLD_FILES" ]; then
            echo "$OLD_FILES" | while read -r file_id; do
                gdrive files delete "$file_id" > /dev/null 2>&1 \
                    && echo -e "    Da xoa file ID: $file_id" || true
            done
        fi

        # Upload file mới
        echo -e "  Dang upload ${CYAN}${APK_NAME}${NC} ..."
        UPLOAD_RESULT=$(gdrive files upload --parent "$GOOGLE_DRIVE_FOLDER_ID" "$OUTPUT_APK" 2>&1)

        if [ $? -eq 0 ]; then
            UPLOADED_FILE_ID=$(echo "$UPLOAD_RESULT" | grep -oE '[a-zA-Z0-9_-]{25,}' | head -1)
            DRIVE_LINK="https://drive.google.com/file/d/${UPLOADED_FILE_ID}/view"
            echo -e "${GREEN}Upload thanh cong!${NC}"
            UPLOAD_STATUS="THANH CONG"
        else
            echo -e "${RED}Upload that bai!${NC}"
            echo -e "${RED}${UPLOAD_RESULT}${NC}"
            UPLOAD_STATUS="THAT BAI"
        fi
    fi
else
    echo ""
    echo -e "${YELLOW}[4/4] Bo qua upload (GOOGLE_DRIVE_FOLDER_ID chua duoc cau hinh)${NC}"
fi
```

#### Cập nhật tổng kết cuối script

```bash
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  BUILD THANH CONG!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "  File APK:   ${CYAN}${OUTPUT_APK}${NC}"
echo -e "  Kich thuoc: ${CYAN}${APK_SIZE}${NC}"
echo -e "  Upload:     ${CYAN}${UPLOAD_STATUS}${NC}"
if [ -n "$DRIVE_LINK" ]; then
    echo -e "  Drive link: ${CYAN}${DRIVE_LINK}${NC}"
fi
echo -e "${GREEN}============================================${NC}"
echo ""
```

---

### Thiết kế đảm bảo nguyên tắc

- **Fail-safe**: Upload thất bại không ảnh hưởng build. APK vẫn nằm trên Desktop.
- **KISS**: Chỉ 1 tool (`gdrive`), 1 biến cấu hình (`GOOGLE_DRIVE_FOLDER_ID`).
- **DRY**: Dọn file cũ trên cả Desktop + Drive, cùng pattern `MealPlaning_*`.
- **YAGNI**: Không thêm OAuth flow phức tạp, không viết Python script riêng.
- **Secret Management**: Folder ID không phải secret, nhưng nếu cần ẩn thì truyền qua env var hoặc argument thay vì hardcode.
- **Backward Compatible**: Nếu không cấu hình folder ID → script hoạt động y hệt bản cũ.
