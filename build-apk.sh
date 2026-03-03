#!/bin/bash
# ============================================
# MealPlaning - Build APK Script
# ============================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================
# CẤU HÌNH GOOGLE DRIVE
# Thay GOOGLE_DRIVE_FOLDER_ID bằng ID thư mục Google Drive của bạn.
# ID lấy từ URL: https://drive.google.com/drive/folders/<FOLDER_ID>
# Để trống "" nếu không muốn upload.
# ============================================
GOOGLE_DRIVE_FOLDER_ID="17BHCjT_pHNLJN-r6yxvqa-GUI6ASA21G"

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ANDROID_DIR="$PROJECT_DIR/android"
APK_SOURCE="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
APK_SOURCE_ALT="$ANDROID_DIR/app/build/outputs/app-debug.apk"

CURRENT_DATE=$(date +"%d-%m-%Y_%H-%M-%S")
APK_NAME="MealPlaning_${CURRENT_DATE}.apk"
OUTPUT_DIR="$HOME/Desktop"
OUTPUT_APK="$OUTPUT_DIR/$APK_NAME"

# Cho phép override folder ID qua tham số dòng lệnh
# VD: ./build-apk.sh 1AbCdEfGhIjKlMnOpQrStUvWxYz
if [ -n "$1" ]; then
    GOOGLE_DRIVE_FOLDER_ID="$1"
fi

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  MealPlaning - Build APK${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

echo -e "${YELLOW}[1/4] Building web app...${NC}"
cd "$PROJECT_DIR"
npm run build
echo -e "${GREEN}Web build hoan tat!${NC}"
echo ""

echo -e "${YELLOW}[2/4] Syncing Capacitor...${NC}"
npx cap sync android
echo -e "${GREEN}Capacitor sync hoan tat!${NC}"
echo ""

echo -e "${YELLOW}[3/4] Building APK...${NC}"
cd "$ANDROID_DIR"
chmod +x gradlew
./gradlew assembleDebug
echo -e "${GREEN}APK build hoan tat!${NC}"
echo ""

echo -e "${YELLOW}Xoa file APK cu tren Desktop...${NC}"
OLD_APKS=$(find "$OUTPUT_DIR" -name "MealPlaning_*.apk" -type f 2>/dev/null)
if [ -n "$OLD_APKS" ]; then
    echo "$OLD_APKS" | while read -r f; do
        rm -f "$f"
        echo -e "  Da xoa: $(basename "$f")"
    done
    echo -e "${GREEN}Da xoa het file APK cu!${NC}"
else
    echo -e "  Khong co file APK cu nao."
fi
echo ""

echo -e "${YELLOW}Copying APK...${NC}"

if [ -f "$APK_SOURCE" ]; then
    cp -f "$APK_SOURCE" "$OUTPUT_APK"
elif [ -f "$APK_SOURCE_ALT" ]; then
    cp -f "$APK_SOURCE_ALT" "$OUTPUT_APK"
else
    FOUND_APK=$(find "$ANDROID_DIR/app/build" -name "*.apk" -type f | head -1)
    if [ -n "$FOUND_APK" ]; then
        cp -f "$FOUND_APK" "$OUTPUT_APK"
    else
        echo -e "${RED}Khong tim thay file APK!${NC}"
        exit 1
    fi
fi

APK_SIZE=$(du -h "$OUTPUT_APK" | cut -f1)

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
            UPLOADED_FILE_ID=$(echo "$UPLOAD_RESULT" | grep -i "^Id:" | awk '{print $2}' | tr -d '[:space:]')
            if [ -z "$UPLOADED_FILE_ID" ]; then
                UPLOADED_FILE_ID=$(echo "$UPLOAD_RESULT" | grep -oE '[a-zA-Z0-9_-]{28,}' | grep -v '\.' | head -1)
            fi
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

# Tu dong mo Finder va highlight file APK
open -R "$OUTPUT_APK"

