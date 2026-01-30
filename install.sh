#!/bin/bash

set -e  # 에러 발생 시 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로고 출력
echo ""
echo -e "${BLUE}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║                                       ║"
echo "  ║     Engli Bot 설치 스크립트              ║"
echo "  ║                                       ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# 설치 디렉토리
INSTALL_DIR="$HOME/.engli-bot"
BIN_DIR="$HOME/.local/bin"

# GitHub 저장소 (본인 계정으로 변경하세요)
REPO_URL="https://github.com/JUCHEOLJIN/engli-bot"
BRANCH="main"

# ========================================
# 1. 시스템 확인
# ========================================
echo -e "${YELLOW}[1/5]${NC} 시스템 확인 중..."

# OS 확인
OS="$(uname -s)"
case "$OS" in
    Linux*)     OS_TYPE="linux";;
    Darwin*)    OS_TYPE="macos";;
    MINGW*|MSYS*|CYGWIN*)    OS_TYPE="windows";;
    *)          OS_TYPE="unknown";;
esac

echo "       운영체제: $OS_TYPE"

# ========================================
# 2. Node.js 확인
# ========================================
echo -e "${YELLOW}[2/5]${NC} Node.js 확인 중..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "       Node.js 버전: ${GREEN}$NODE_VERSION${NC}"

    # 버전 체크 (v18 이상 권장)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        echo -e "${YELLOW}       ⚠️  Node.js v18 이상을 권장합니다.${NC}"
    fi
else
    echo -e "${RED}❌ Node.js가 설치되어 있지 않습니다.${NC}"
    echo ""
    echo "   Node.js를 먼저 설치해주세요:"
    echo ""
    if [ "$OS_TYPE" = "macos" ]; then
        echo "   brew install node"
    elif [ "$OS_TYPE" = "linux" ]; then
        echo "   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
        echo "   sudo apt-get install -y nodejs"
    else
        echo "   https://nodejs.org 에서 다운로드"
    fi
    exit 1
fi

# npm 확인
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm이 설치되어 있지 않습니다.${NC}"
    exit 1
fi

# ========================================
# 3. 설치 디렉토리 준비
# ========================================
echo -e "${YELLOW}[3/5]${NC} 설치 디렉토리 준비 중..."

# 기존 설치 확인
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}       기존 설치가 발견되었습니다. 업데이트합니다...${NC}"
    rm -rf "$INSTALL_DIR"
fi

mkdir -p "$INSTALL_DIR"
mkdir -p "$BIN_DIR"

echo "       설치 경로: $INSTALL_DIR"

# ========================================
# 4. 패키지 다운로드 및 설치
# ========================================
echo -e "${YELLOW}[4/5]${NC} 패키지 다운로드 중..."

cd "$INSTALL_DIR"

echo "       저장소: $REPO_URL"

# git이 있으면 clone, 없으면 zip 다운로드
if command -v git &> /dev/null; then
    git clone --depth 1 --branch "$BRANCH" "$REPO_URL.git" . 2>/dev/null || {
        echo -e "${RED}❌ 저장소 클론 실패${NC}"
        echo "   REPO_URL을 확인하세요: $REPO_URL"
        exit 1
    }
else
    echo "       git이 없어서 zip으로 다운로드합니다..."
    curl -fsSL "$REPO_URL/archive/$BRANCH.zip" -o repo.zip || {
        echo -e "${RED}❌ 다운로드 실패${NC}"
        exit 1
    }
    unzip -q repo.zip
    mv engli-bot-$BRANCH/* .
    rm -rf engli-bot-$BRANCH repo.zip
fi

# 의존성 설치
echo -e "${YELLOW}[5/5]${NC} 의존성 설치 중..."

if command -v pnpm &> /dev/null; then
    pnpm install --silent 2>/dev/null || pnpm install
else
    npm install --silent 2>/dev/null || npm install
fi

# TypeScript 빌드
echo "       TypeScript 빌드 중..."
npm run build --silent 2>/dev/null || npm run build

# ========================================
# 5. 실행 스크립트 생성
# ========================================
echo "       실행 스크립트 생성 중..."

# engli-bot 명령어 생성
cat > "$BIN_DIR/engli-bot" << 'SCRIPT'
#!/bin/bash
ENGLI_DIR="$HOME/.engli-bot"

case "$1" in
    setup)
        node "$ENGLI_DIR/scripts/setup.js"
        ;;
    start)
        if [ ! -f "$ENGLI_DIR/.env" ]; then
            echo "❌ 설정 파일이 없습니다."
            echo "   먼저 'engli-bot setup'을 실행하세요."
            exit 1
        fi
        cd "$ENGLI_DIR"
        echo "🤖 Engli Bot을 시작합니다..."
        node dist/slack/bot.js
        ;;
    stop)
        pkill -f "node.*engli-bot" 2>/dev/null || true
        echo "✅ Engli Bot을 종료했습니다."
        ;;
    status)
        if pgrep -f "node.*engli-bot" > /dev/null; then
            echo "🟢 Engli Bot이 실행 중입니다."
        else
            echo "🔴 Engli Bot이 실행 중이 아닙니다."
        fi
        ;;
    update)
        echo "🔄 업데이트 중..."
        cd "$ENGLI_DIR"
        if [ -d ".git" ]; then
            git pull origin main
        else
            echo "git 저장소가 아닙니다. 재설치를 권장합니다."
            exit 1
        fi
        npm install --silent 2>/dev/null || npm install
        npm run build --silent 2>/dev/null || npm run build
        echo "✅ 업데이트 완료!"
        ;;
    uninstall)
        echo "🗑️  Engli Bot을 삭제합니다..."
        rm -rf "$ENGLI_DIR"
        rm -f "$HOME/.local/bin/engli-bot"
        echo "✅ 삭제 완료!"
        ;;
    logs)
        cd "$ENGLI_DIR"
        if [ -f "engli-bot.log" ]; then
            tail -f engli-bot.log
        else
            echo "로그 파일이 없습니다."
        fi
        ;;
    *)
        echo "🤖 Engli Bot - 개인용 AI 비서"
        echo ""
        echo "사용법:"
        echo "  engli-bot setup     초기 설정"
        echo "  engli-bot start     봇 시작"
        echo "  engli-bot stop      봇 중지"
        echo "  engli-bot status    상태 확인"
        echo "  engli-bot update    업데이트"
        echo "  engli-bot uninstall 삭제"
        ;;
esac
SCRIPT

chmod +x "$BIN_DIR/engli-bot"

# ========================================
# 6. 완료 메시지
# ========================================
echo ""
echo -e "${GREEN}✅ 설치 완료!${NC}"
echo ""

# PATH에 있는지 확인
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
    echo -e "${YELLOW}⚠️  PATH 설정이 필요합니다.${NC}"
    echo ""
    echo "   다음 줄을 ~/.bashrc 또는 ~/.zshrc에 추가하세요:"
    echo ""
    echo -e "   ${BLUE}export PATH=\"\$HOME/.local/bin:\$PATH\"${NC}"
    echo ""
    echo "   그 다음 터미널을 재시작하거나 다음 명령어를 실행하세요:"
    echo ""
    if [ -f "$HOME/.zshrc" ]; then
        echo -e "   ${BLUE}source ~/.zshrc${NC}"
    else
        echo -e "   ${BLUE}source ~/.bashrc${NC}"
    fi
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  다음 단계:"
echo ""
echo -e "  1. ${BLUE}engli-bot setup${NC}   ← 초기 설정 (Slack 토큰 등)"
echo -e "  2. ${BLUE}engli-bot start${NC}   ← 봇 시작"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
