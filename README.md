# Engli Bot

Slack에서 내 PC를 제어하는 **개인용 AI 비서**입니다.

```
@Engli Bot 파일 목록 보여줘
@Engli Bot 구글 열어줘
@Engli Bot 이 스레드 요약해줘 [URL]
```

---

## 주요 기능

| 기능              | 설명                                |
| ----------------- | ----------------------------------- |
| **터미널 명령**   | `ls`, `pwd` 등 안전한 명령어 실행   |
| **브라우저 제어** | 웹페이지 열기, 스크린샷, 클릭, 입력 |
| **Slack 연동**    | 스레드/채널 메시지 읽기, 요약       |

---

## 설치

### 방법 1: One-liner (권장)

```bash
curl -fsSL https://raw.githubusercontent.com/JUCHEOLJIN/engli-bot/main/install.sh | bash
```

### 방법 2: 직접 설치

```bash
git clone https://github.com/YOUR_USERNAME/engli-bot.git
cd engli-bot
pnpm install
pnpm build
```

---

## 초기 설정

```bash
# One-liner로 설치한 경우
engli-bot setup

# 직접 설치한 경우
pnpm setup
```

### 필요한 정보

| 항목                   | 설명           | 얻는 곳                                            |
| ---------------------- | -------------- | -------------------------------------------------- |
| `SLACK_BOT_TOKEN`      | xoxb-로 시작   | Slack 앱 > OAuth & Permissions                     |
| `SLACK_SIGNING_SECRET` | 서명 시크릿    | Slack 앱 > Basic Information                       |
| `SLACK_APP_TOKEN`      | xapp-로 시작   | Slack 앱 > App-Level Tokens                        |
| `ANTHROPIC_API_KEY`    | sk-ant-로 시작 | [Anthropic Console](https://console.anthropic.com) |
| `MY_SLACK_USER_ID`     | U로 시작       | Slack 프로필 > 더보기 > 멤버 ID 복사               |

---

## 실행

```bash
# One-liner로 설치한 경우
engli-bot start

# 직접 설치한 경우
pnpm start:bot
```

---

## Slack 앱 설정

### 1. 앱 생성

https://api.slack.com/apps 에서 **Create New App** > **From scratch**

### 2. Socket Mode 활성화

**Settings > Socket Mode** > Enable Socket Mode > 토큰 생성 (`xapp-...`)

### 3. Event Subscriptions

**Features > Event Subscriptions** > Enable Events

**Subscribe to bot events:**

- `app_mention`
- `message.im`

### 4. OAuth Scopes

**Features > OAuth & Permissions > Scopes > Bot Token Scopes:**

| Scope               | 용도             |
| ------------------- | ---------------- |
| `app_mentions:read` | @멘션 읽기       |
| `chat:write`        | 메시지 보내기    |
| `im:history`        | DM 읽기          |
| `channels:history`  | 채널 메시지 읽기 |
| `channels:read`     | 채널 목록 조회   |
| `users:read`        | 사용자 정보 조회 |

### 5. 앱 설치

**Settings > Install App** > Install to Workspace

---

## 사용 예시

### 터미널

```
@Engli Bot 현재 폴더 파일 보여줘
@Engli Bot pwd
```

### 브라우저

```
@Engli Bot 구글 열어줘
@Engli Bot 스크린샷 찍어줘
@Engli Bot 검색창에 "날씨" 입력해줘
```

### Slack

```
@Engli Bot 이 스레드 요약해줘 https://xxx.slack.com/archives/C.../p...
@Engli Bot 채널 목록 보여줘
```

---

## 명령어 (One-liner 설치 시)

| 명령어                | 설명      |
| --------------------- | --------- |
| `engli-bot setup`     | 초기 설정 |
| `engli-bot start`     | 봇 시작   |
| `engli-bot stop`      | 봇 중지   |
| `engli-bot status`    | 상태 확인 |
| `engli-bot update`    | 업데이트  |
| `engli-bot uninstall` | 삭제      |

---

## 팀원과 공유하기

같은 Slack 워크스페이스에서 여러 명이 사용할 수 있습니다.

### 공유할 정보

```
SLACK_BOT_TOKEN=xoxb-xxx (공유)
SLACK_SIGNING_SECRET=xxx (공유)
SLACK_APP_TOKEN=xapp-xxx (공유)
```

### 각자 설정할 정보

```
ANTHROPIC_API_KEY=본인 것
MY_SLACK_USER_ID=본인 Slack ID
```

각자 자기 PC에서 봇을 실행하면, **자기가 보낸 메시지만 자기 PC에서 처리**됩니다.

---

## 프로젝트 구조

```
engli-bot/
├── src/
│   ├── ai/
│   │   └── agent.ts        # Claude API + Tool Use
│   ├── slack/
│   │   ├── bot.ts          # Slack 봇 메인
│   │   └── api.ts          # Slack API 호출
│   ├── terminal/
│   │   └── executor.ts     # 터미널 명령 실행
│   └── browser/
│       └── automation.ts   # 브라우저 자동화
├── scripts/
│   └── setup.js            # 초기 설정 마법사
├── install.sh              # 설치 스크립트
├── package.json
└── tsconfig.json
```

---

## 기술 스택

- **Runtime**: Node.js + TypeScript
- **AI**: Claude API (Anthropic)
- **Slack**: @slack/bolt (Socket Mode)
- **Browser**: Playwriter

---
