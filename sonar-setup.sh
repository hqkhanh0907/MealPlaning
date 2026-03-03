#!/usr/bin/env bash
# sonar-setup.sh
# Tự động:
#   1. Khởi SonarQube bằng docker compose nếu chưa chạy
#   2. Chờ SonarQube sẵn sàng
#   3. Tạo token tự động và lưu vào .sonar.env
#   4. In hướng dẫn source vào shell profile
#
# Sử dụng:
#   bash sonar-setup.sh                         # hỏi mật khẩu tương tác
#   SONAR_ADMIN_PASS=mypass bash sonar-setup.sh  # truyền mật khẩu qua env

set -e

SONAR_URL="http://localhost:9000"
SONAR_ENV_FILE=".sonar.env"
SONAR_ADMIN_USER="${SONAR_ADMIN_USER:-admin}"
TOKEN_NAME="meal-planing-local-$(date +%Y%m%d)"
COMPOSE_FILE="$(cd "$(dirname "$0")" && pwd)/docker-compose.yml"

# ─── Màu sắc ──────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ─── 1. Khởi động SonarQube ───────────────────────────────
start_sonarqube() {
  if curl -sf "$SONAR_URL/api/system/status" > /dev/null 2>&1; then
    success "SonarQube đang chạy tại $SONAR_URL"
    return
  fi

  if [ ! -f "$COMPOSE_FILE" ]; then
    error "Không tìm thấy docker-compose.yml tại: $COMPOSE_FILE"
  fi

  info "Khởi động SonarQube bằng docker compose..."
  docker compose -f "$COMPOSE_FILE" up -d sonarqube
}

# ─── 2. Chờ SonarQube sẵn sàng ───────────────────────────
wait_for_sonarqube() {
  info "Chờ SonarQube khởi động (tối đa 120s)..."
  local max=60 count=0
  until curl -sf "$SONAR_URL/api/system/status" | grep -q '"status":"UP"'; do
    count=$((count + 1))
    if [ $count -ge $max ]; then
      error "SonarQube không sẵn sàng sau ${max}x2s. Kiểm tra: docker logs sonarqube"
    fi
    printf "."
    sleep 2
  done
  echo ""
  success "SonarQube sẵn sàng!"
}

# ─── 3. Xác thực admin ────────────────────────────────────
get_admin_password() {
  # Ưu tiên env var
  if [ -n "$SONAR_ADMIN_PASS" ]; then
    local code
    code=$(curl -so /dev/null -w '%{http_code}' -X POST "$SONAR_URL/api/authentication/login" \
      -d "login=$SONAR_ADMIN_USER&password=$SONAR_ADMIN_PASS")
    if [ "$code" = "200" ]; then
      success "Xác thực admin thành công."
      return 0
    else
      warn "SONAR_ADMIN_PASS không đúng (HTTP $code). Sẽ hỏi tương tác..."
    fi
  fi

  # Hỏi tương tác
  local attempts=0
  while [ $attempts -lt 3 ]; do
    printf "${BLUE}[INPUT]${NC}  Nhập mật khẩu SonarQube admin (user: $SONAR_ADMIN_USER): "
    # Read without echo for password
    if [ -t 0 ]; then
      stty -echo 2>/dev/null || true
      read -r SONAR_ADMIN_PASS
      stty echo 2>/dev/null || true
      echo ""
    else
      read -r SONAR_ADMIN_PASS
    fi

    local code
    code=$(curl -so /dev/null -w '%{http_code}' -X POST "$SONAR_URL/api/authentication/login" \
      -d "login=$SONAR_ADMIN_USER&password=$SONAR_ADMIN_PASS")
    if [ "$code" = "200" ]; then
      success "Xác thực admin thành công."
      return 0
    fi
    attempts=$((attempts + 1))
    warn "Mật khẩu sai (HTTP $code). Thử lại ($attempts/3)..."
  done

  echo ""
  echo -e "${RED}[ERROR]${NC} Không thể xác thực sau 3 lần thử."
  echo ""
  echo "  Tạo token thủ công:"
  echo "  1. Mở http://localhost:9000/account/security"
  echo "  2. Tạo User Token → copy"
  echo "  3. Chạy: echo 'export SONAR_TOKEN=<token>' > .sonar.env"
  echo "  4. source .sonar.env"
  exit 1
}

# ─── 4. Login và lấy cookie session ──────────────────────
login_and_get_cookie() {
  COOKIE_JAR=$(mktemp /tmp/sonar-cookie-XXXXXX.txt)
  local code
  code=$(curl -so /dev/null -w '%{http_code}' -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
    -X POST "$SONAR_URL/api/authentication/login" \
    -d "login=$SONAR_ADMIN_USER&password=$SONAR_ADMIN_PASS")
  if [ "$code" != "200" ]; then
    error "Đăng nhập thất bại (HTTP $code)"
  fi
}

# ─── 5. Tạo token dùng session cookie ────────────────────
generate_token() {
  # Xóa token cũ nếu trùng tên
  curl -sf -o /dev/null -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST \
    "$SONAR_URL/api/user_tokens/revoke" \
    -d "name=$TOKEN_NAME" 2>/dev/null || true

  # Lấy XSRF token từ cookie
  local xsrf_token
  xsrf_token=$(grep -i "XSRF-TOKEN" "$COOKIE_JAR" 2>/dev/null | awk '{print $NF}' | head -1 || true)

  local response
  if [ -n "$xsrf_token" ]; then
    response=$(curl -sf -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
      -H "X-XSRF-TOKEN: $xsrf_token" \
      -X POST "$SONAR_URL/api/user_tokens/generate" \
      -d "name=$TOKEN_NAME" \
      -d "type=USER_TOKEN" 2>/dev/null)
  else
    response=$(curl -sf -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
      -X POST "$SONAR_URL/api/user_tokens/generate" \
      -d "name=$TOKEN_NAME" \
      -d "type=USER_TOKEN" 2>/dev/null)
  fi

  local token
  token=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null || true)

  if [ -z "$token" ]; then
    warn "Cookie session không đủ quyền. Thử dùng admin credentials trực tiếp..."
    # Fallback: dùng basic auth style header  
    response=$(curl -sf \
      -X POST "$SONAR_URL/api/user_tokens/generate" \
      -u "$SONAR_ADMIN_USER:$SONAR_ADMIN_PASS" \
      -d "name=$TOKEN_NAME" \
      -d "type=USER_TOKEN" 2>/dev/null || echo '{}')
    token=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null || true)
  fi

  if [ -z "$token" ]; then
    rm -f "$COOKIE_JAR"
    echo ""
    echo -e "${RED}[ERROR]${NC} Không thể tạo token tự động."
    echo "         SonarQube 26.x yêu cầu tạo token từ giao diện web."
    echo ""
    echo "  Tạo token thủ công:"
    echo "  1. Mở http://localhost:9000/account/security"
    echo "  2. Đăng nhập với user: $SONAR_ADMIN_USER"
    echo "  3. Tạo User Token có tên: $TOKEN_NAME → copy"
    echo "  4. Chạy:"
    echo "     echo \"export SONAR_TOKEN=<token>\" > $(pwd)/$SONAR_ENV_FILE"
    echo "     source $(pwd)/$SONAR_ENV_FILE"
    echo "     echo 'source $(pwd)/$SONAR_ENV_FILE' >> ~/.zshrc"
    echo ""
    exit 1
  fi

  rm -f "$COOKIE_JAR"
  echo "$token"
}

# ─── Main ─────────────────────────────────────────────────
main() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "   SonarQube Setup — MealPlaning Project"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  start_sonarqube
  wait_for_sonarqube
  get_admin_password
  login_and_get_cookie

  info "Tạo token: $TOKEN_NAME ..."
  TOKEN=$(generate_token)
  success "Token được tạo thành công."

  # Lưu vào .sonar.env
  REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
  cat > "$REPO_ROOT/$SONAR_ENV_FILE" <<EOF
# SonarQube token — được tạo tự động bởi sonar-setup.sh
# KHÔNG commit file này lên git (.gitignore đã bao phủ *.env*)
export SONAR_TOKEN=$TOKEN
EOF

  success "Token đã lưu vào $SONAR_ENV_FILE"

  # Thêm auto-source vào ~/.zshrc nếu chưa có
  local shell_profile="$HOME/.zshrc"
  local source_line="[ -f \"$REPO_ROOT/$SONAR_ENV_FILE\" ] && source \"$REPO_ROOT/$SONAR_ENV_FILE\""
  if ! grep -qF "$SONAR_ENV_FILE" "$shell_profile" 2>/dev/null; then
    echo "" >> "$shell_profile"
    echo "# SonarQube token — MealPlaning" >> "$shell_profile"
    echo "$source_line" >> "$shell_profile"
    success "Đã thêm auto-source vào $shell_profile"
  else
    info "Auto-source đã có trong $shell_profile"
  fi

  # Apply ngay cho session hiện tại
  export SONAR_TOKEN="$TOKEN"
  success "SONAR_TOKEN đã được set cho session hiện tại."

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  Dashboard: http://localhost:9000/dashboard?id=meal-planing"
  echo "  Scan thủ công: npm run sonar"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Chạy scan ngay
  local run_scan
  printf "Chạy sonar scan ngay bây giờ? [Y/n] "
  read -r run_scan
  run_scan="${run_scan:-Y}"
  if [[ "$run_scan" =~ ^[Yy]$ ]]; then
    echo ""
    info "Chạy sonar-scanner..."
    SONAR_TOKEN="$TOKEN" npm run sonar
  fi
}

main "$@"

set -e

SONAR_URL="http://localhost:9000"
SONAR_ENV_FILE=".sonar.env"
SONAR_ADMIN_USER="${SONAR_ADMIN_USER:-admin}"
SONAR_ADMIN_PASS="${SONAR_ADMIN_PASS:-admin}"
TOKEN_NAME="meal-planing-local-$(date +%Y%m%d)"
COMPOSE_FILE="$(dirname "$0")/docker-compose.yml"

# ─── Màu sắc ──────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ─── 1. Khởi động SonarQube ───────────────────────────────
start_sonarqube() {
  if curl -sf "$SONAR_URL/api/system/status" > /dev/null 2>&1; then
    success "SonarQube đang chạy tại $SONAR_URL"
    return
  fi

  if [ ! -f "$COMPOSE_FILE" ]; then
    error "Không tìm thấy docker-compose.yml tại: $COMPOSE_FILE"
  fi

  info "Khởi động SonarQube bằng docker compose..."
  docker compose -f "$COMPOSE_FILE" up -d sonarqube
}

# ─── 2. Chờ SonarQube sẵn sàng ───────────────────────────
wait_for_sonarqube() {
  info "Chờ SonarQube khởi động (tối đa 120s)..."
  local max=60 count=0
  until curl -sf "$SONAR_URL/api/system/status" | grep -q '"status":"UP"'; do
    count=$((count + 1))
    if [ $count -ge $max ]; then
      error "SonarQube không sẵn sàng sau ${max}x2s. Kiểm tra: docker logs sonarqube"
    fi
    printf "."
    sleep 2
  done
  echo ""
  success "SonarQube sẵn sàng!"
}

# ─── 3. Đổi mật khẩu admin lần đầu (nếu cần) ─────────────
ensure_admin_password() {
  # Thử với mật khẩu hiện tại trước
  local status
  status=$(curl -sf -o /dev/null -w "%{http_code}" \
    -u "$SONAR_ADMIN_USER:$SONAR_ADMIN_PASS" \
    "$SONAR_URL/api/authentication/validate" 2>/dev/null || echo "000")

  if [ "$status" = "200" ]; then
    return
  fi

  # Thử admin/admin (mật khẩu mặc định)
  status=$(curl -sf -o /dev/null -w "%{http_code}" \
    -u "admin:admin" \
    "$SONAR_URL/api/authentication/validate" 2>/dev/null || echo "000")

  if [ "$status" = "200" ]; then
    warn "Đang dùng mật khẩu mặc định admin/admin"
    warn "Đặt SONAR_ADMIN_PASS=<mật-khẩu-mới> rồi chạy lại để đổi mật khẩu."
    SONAR_ADMIN_PASS="admin"
    return
  fi

  error "Không thể xác thực với SonarQube. Đặt SONAR_ADMIN_USER và SONAR_ADMIN_PASS rồi chạy lại."
}

# ─── 4. Tạo token ─────────────────────────────────────────
generate_token() {
  # Xóa token cũ nếu trùng tên
  curl -sf -o /dev/null -X POST \
    -u "$SONAR_ADMIN_USER:$SONAR_ADMIN_PASS" \
    "$SONAR_URL/api/user_tokens/revoke" \
    -d "name=$TOKEN_NAME" 2>/dev/null || true

  local response
  response=$(curl -sf -X POST \
    -u "$SONAR_ADMIN_USER:$SONAR_ADMIN_PASS" \
    "$SONAR_URL/api/user_tokens/generate" \
    -d "name=$TOKEN_NAME" \
    -d "type=USER_TOKEN" 2>/dev/null)

  local token
  token=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

  if [ -z "$token" ]; then
    error "Không thể tạo token. Response: $response"
  fi

  echo "$token"
}

# ─── Main ─────────────────────────────────────────────────
main() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "   SonarQube Setup — MealPlaning Project"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  start_sonarqube
  wait_for_sonarqube
  ensure_admin_password

  info "Tạo token: $TOKEN_NAME ..."
  TOKEN=$(generate_token)
  success "Token được tạo thành công."

  # Lưu vào .sonar.env
  cat > "$SONAR_ENV_FILE" <<EOF
# SonarQube token — được tạo tự động bởi sonar-setup.sh
# KHÔNG commit file này lên git
export SONAR_TOKEN=$TOKEN
EOF

  success "Token đã lưu vào $SONAR_ENV_FILE"

  # Thêm vào ~/.zshrc nếu chưa có
  local shell_profile="$HOME/.zshrc"
  local source_line="[ -f \"$(pwd)/$SONAR_ENV_FILE\" ] && source \"$(pwd)/$SONAR_ENV_FILE\""
  if ! grep -qF "$SONAR_ENV_FILE" "$shell_profile" 2>/dev/null; then
    echo "" >> "$shell_profile"
    echo "# SonarQube token — MealPlaning" >> "$shell_profile"
    echo "$source_line" >> "$shell_profile"
    success "Đã thêm auto-source vào $shell_profile"
  else
    info "Auto-source đã có trong $shell_profile"
  fi

  # Apply ngay cho session hiện tại
  # shellcheck disable=SC1090
  source "$SONAR_ENV_FILE"
  success "SONAR_TOKEN đã được set cho session hiện tại."

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  Kiểm tra Quality Gate:"
  echo "  http://localhost:9000/dashboard?id=meal-planing"
  echo ""
  echo "  Chạy scan thủ công:"
  echo "  npm run sonar"
  echo ""
  echo "  Mở terminal mới hoặc chạy:"
  echo "  source $SONAR_ENV_FILE"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Chạy scan ngay
  read -r -p "Chạy sonar scan ngay bây giờ? [Y/n] " run_scan
  run_scan="${run_scan:-Y}"
  if [[ "$run_scan" =~ ^[Yy]$ ]]; then
    echo ""
    info "Chạy sonar-scanner..."
    SONAR_TOKEN="$TOKEN" npm run sonar
  fi
}

main "$@"
