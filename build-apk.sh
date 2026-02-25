#!/bin/bash

# ============================================
# 🔧 MealPlaning - Build APK Script
# ============================================

set -e

# Màu sắc cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Thư mục gốc project
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ANDROID_DIR="$PROJECT_DIR/android"
APK_SOURCE="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
APK_SOURCE_ALT="$ANDROID_DIR/app/build/outputs/app-debug.apk"

# Tên file APK output & thư mục đích
APK_NAME="MealPlaning.apk"
OUTPUT_DIR="$PROJECT_DIR"
OUTPUT_APK="$OUTPUT_DIR/$APK_NAME"

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  🍽️  MealPlaning - Build APK${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# ---- Bước 1: Build web app ----
echo -e "${YELLOW}📦 [1/3] Building web app...${NC}"
cd "$PROJECT_DIR"
npm run build
echo -e "${GREEN}✅ Web build hoàn tất!${NC}"
echo ""

# ---- Bước 2: Sync Capacitor ----
echo -e "${YELLOW}🔄 [2/3] Syncing Capacitor...${NC}"
npx cap sync android
echo -e "${GREEN}✅ Capacitor sync hoàn tất!${NC}"
echo ""

# ---- Bước 3: Build APK ----
echo -e "${YELLOW}🔨 [3/3] Building APK...${NC}"
cd "$ANDROID_DIR"
chmod +x gradlew
./gradlew assembleDebug
echo -e "${GREEN}✅ APK build hoàn tất!${NC}"
echo ""

# ---- Copy APK ra ngoài ----
echo -e "${YELLOW}📁 Copying APK...${NC}"

# Tìm file APK (vị trí có thể khác nhau tùy phiên bản AGP)
if [ -f "$APK_SOURCE" ]; then
    cp -f "$APK_SOURCE" "$OUTPUT_APK"
elif [ -f "$APK_SOURCE_ALT" ]; then
    cp -f "$APK_SOURCE_ALT" "$OUTPUT_APK"
else
    # Tìm bất kỳ file apk nào trong build outputs
    FOUND_APK=$(find "$ANDROID_DIR/app/build" -name "*.apk" -type f | head -1)
    if [ -n "$FOUND_APK" ]; then
        cp -f "$FOUND_APK" "$OUTPUT_APK"
    else
        echo -e "${RED}❌ Không tìm thấy file APK!${NC}"
        exit 1
    fi
fi

# Lấy kích thước file
APK_SIZE=$(du -h "$OUTPUT_APK" | cut -f1)

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ✅ BUILD THÀNH CÔNG!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "  📱 File APK: ${CYAN}$OUTPUT_APK${NC}"
echo -e "  📏 Kích thước: ${CYAN}$APK_SIZE${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

