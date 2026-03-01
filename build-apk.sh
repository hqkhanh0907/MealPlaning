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

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ANDROID_DIR="$PROJECT_DIR/android"
APK_SOURCE="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
APK_SOURCE_ALT="$ANDROID_DIR/app/build/outputs/app-debug.apk"

CURRENT_DATE=$(date +"%d-%m-%Y_%H-%M-%S")
APK_NAME="MealPlaning_${CURRENT_DATE}.apk"
OUTPUT_DIR="$HOME/Desktop"
OUTPUT_APK="$OUTPUT_DIR/$APK_NAME"

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  MealPlaning - Build APK${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

echo -e "${YELLOW}[1/3] Building web app...${NC}"
cd "$PROJECT_DIR"
npm run build
echo -e "${GREEN}Web build hoan tat!${NC}"
echo ""

echo -e "${YELLOW}[2/3] Syncing Capacitor...${NC}"
npx cap sync android
echo -e "${GREEN}Capacitor sync hoan tat!${NC}"
echo ""

echo -e "${YELLOW}[3/3] Building APK...${NC}"
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

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  BUILD THANH CONG!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "  File APK: ${CYAN}${OUTPUT_APK}${NC}"
echo -e "  Kich thuoc: ${CYAN}${APK_SIZE}${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# Tu dong mo Finder va highlight file APK
open -R "$OUTPUT_APK"

