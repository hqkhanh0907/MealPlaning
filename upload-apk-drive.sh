#!/bin/bash
# ============================================
# MealPlaning - Upload APK to Google Drive
# Dùng khi đã có APK sẵn, không cần build lại.
#
# Cách dùng:
#   ./upload-apk-drive.sh                          # tự động tìm APK mới nhất trên Desktop
#   ./upload-apk-drive.sh /path/to/MyApp.apk       # chỉ định file APK
#   ./upload-apk-drive.sh /path/to/file.apk <FOLDER_ID>  # override folder ID
# ============================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================
# CẤU HÌNH
# ============================================
GOOGLE_DRIVE_FOLDER_ID="17BHCjT_pHNLJN-r6yxvqa-GUI6ASA21G"
OUTPUT_DIR="$HOME/Desktop"

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  MealPlaning - Upload APK to Google Drive${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# ============================================
# Xác định file APK cần upload
# ============================================
APK_PATH=""

if [ -n "$1" ] && [ -f "$1" ]; then
    # Tham số 1: đường dẫn file APK
    APK_PATH="$1"
    [ -n "$2" ] && GOOGLE_DRIVE_FOLDER_ID="$2"
else
    # Tự động tìm APK MealPlaning mới nhất trên Desktop
    APK_PATH=$(find "$OUTPUT_DIR" -name "MealPlaning_*.apk" -type f \
        -exec stat -f "%m %N" {} \; 2>/dev/null | sort -rn | head -1 | awk '{print $2}')
    
    if [ -z "$APK_PATH" ]; then
        # Fallback: tìm APK ngay trong build output
        ANDROID_DIR="$(cd "$(dirname "$0")" && pwd)/android"
        APK_PATH=$(find "$ANDROID_DIR/app/build" -name "*.apk" -type f \
            -exec stat -f "%m %N" {} \; 2>/dev/null | sort -rn | head -1 | awk '{print $2}')
    fi
fi

if [ -z "$APK_PATH" ] || [ ! -f "$APK_PATH" ]; then
    echo -e "${RED}Loi: Khong tim thay file APK nao!${NC}"
    echo ""
    echo -e "${YELLOW}Goi y:${NC}"
    echo -e "  - Build APK truoc: ${CYAN}./build-apk.sh${NC}"
    echo -e "  - Hoac chi dinh file: ${CYAN}./upload-apk-drive.sh /path/to/your.apk${NC}"
    exit 1
fi

APK_NAME=$(basename "$APK_PATH")
APK_SIZE=$(du -h "$APK_PATH" | cut -f1)

echo -e "  File:       ${CYAN}${APK_NAME}${NC}"
echo -e "  Kich thuoc: ${CYAN}${APK_SIZE}${NC}"
echo -e "  Drive ID:   ${CYAN}${GOOGLE_DRIVE_FOLDER_ID}${NC}"
echo ""

# ============================================
# Kiểm tra gdrive CLI
# ============================================
if ! command -v gdrive &> /dev/null; then
    echo -e "${RED}Loi: gdrive CLI chua duoc cai dat!${NC}"
    echo ""
    echo -e "${CYAN}Huong dan cai dat:${NC}"
    echo -e "  1. Tai gdrive tu: ${CYAN}https://github.com/glotlabs/gdrive/releases${NC}"
    echo -e "     Chon: ${CYAN}gdrive_macos-arm64.tar.gz${NC} (Apple Silicon)"
    echo -e "          ${CYAN}gdrive_macos-x64.tar.gz${NC}   (Intel Mac)"
    echo ""
    echo -e "  2. Giai nen va chuyen vao PATH:"
    echo -e "     ${CYAN}tar -xzf gdrive_macos-*.tar.gz${NC}"
    echo -e "     ${CYAN}sudo mv gdrive /usr/local/bin/${NC}"
    echo ""
    echo -e "  3. Dang nhap Google (chi can 1 lan):"
    echo -e "     ${CYAN}gdrive account add${NC}"
    exit 1
fi

# Kiểm tra đã đăng nhập chưa
if ! gdrive account list &>/dev/null; then
    echo -e "${RED}Loi: Chua dang nhap Google Drive!${NC}"
    echo -e "${YELLOW}Chay:${NC} ${CYAN}gdrive account add${NC}"
    exit 1
fi

# ============================================
# Xóa file APK cũ trên Drive
# ============================================
echo -e "${YELLOW}Dang xoa file APK cu tren Drive...${NC}"
OLD_FILES=$(gdrive files list --parent "$GOOGLE_DRIVE_FOLDER_ID" --skip-header 2>/dev/null \
    | grep "MealPlaning_" | awk '{print $1}')

if [ -n "$OLD_FILES" ]; then
    DELETED_COUNT=0
    while IFS= read -r file_id; do
        if gdrive files delete "$file_id" > /dev/null 2>&1; then
            echo -e "  Da xoa: $file_id"
            DELETED_COUNT=$((DELETED_COUNT + 1))
        fi
    done <<< "$OLD_FILES"
    echo -e "${GREEN}Da xoa ${DELETED_COUNT} file cu.${NC}"
else
    echo -e "  Drive folder sach, khong co file cu."
fi
echo ""

# ============================================
# Upload APK mới
# ============================================
echo -e "${YELLOW}Dang upload ${CYAN}${APK_NAME}${YELLOW} len Drive...${NC}"
UPLOAD_RESULT=$(gdrive files upload --parent "$GOOGLE_DRIVE_FOLDER_ID" "$APK_PATH" 2>&1)
UPLOAD_EXIT=$?

if [ $UPLOAD_EXIT -eq 0 ]; then
    # Trích xuất file ID từ output
    UPLOADED_FILE_ID=$(echo "$UPLOAD_RESULT" | grep -i "^Id:" | awk '{print $2}' | tr -d '[:space:]')
    if [ -z "$UPLOADED_FILE_ID" ]; then
        UPLOADED_FILE_ID=$(echo "$UPLOAD_RESULT" | grep -oE '[a-zA-Z0-9_-]{28,}' | grep -v '\.' | head -1)
    fi
    DRIVE_LINK="https://drive.google.com/file/d/${UPLOADED_FILE_ID}/view"

    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  UPLOAD THANH CONG!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo -e "  File:       ${CYAN}${APK_NAME}${NC}"
    echo -e "  Kich thuoc: ${CYAN}${APK_SIZE}${NC}"
    echo -e "  Drive link: ${CYAN}${DRIVE_LINK}${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}============================================${NC}"
    echo -e "${RED}  UPLOAD THAT BAI!${NC}"
    echo -e "${RED}============================================${NC}"
    echo -e "${RED}${UPLOAD_RESULT}${NC}"
    exit 1
fi
