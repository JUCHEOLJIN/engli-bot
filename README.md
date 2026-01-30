# Engli Bot

Slack에서 사용하는 **개인용 AI 비서**입니다.

```
@Engli Bot package.json 파일 읽어줘
@Engli Bot README에서 "설치" 부분 찾아줘
@Engli Bot React 최신 트렌드 검색해줘
```

---

## 주요 기능

| 기능              | 설명                                      |
| ----------------- | ----------------------------------------- |
| **파일 작업**     | 읽기, 쓰기, 편집, 검색                    |
| **웹 검색**       | 실시간 웹 검색 및 페이지 내용 가져오기    |
| **대화 기억**     | 채널/DM별 대화 맥락 유지                  |
| **MCP 연동**      | Model Context Protocol 서버 확장 가능     |

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

### 파일 작업

```
@Engli Bot package.json 파일 읽어줘
@Engli Bot src 폴더에서 "agent" 단어가 포함된 파일 찾아줘
@Engli Bot README.md에서 "설치" 섹션 찾아줘
```

### 웹 검색

```
@Engli Bot TypeScript 5.0 새로운 기능 검색해줘
@Engli Bot React 공식 문서에서 Hooks 설명 가져와줘
```

### 대화 기억

```
@Engli Bot 아까 본 파일 다시 읽어줘
@Engli Bot 우리가 논의한 내용 요약해줘
```

DM으로도 동일하게 사용 가능합니다.

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

## 허용된 도구

보안을 위해 다음 도구만 허용됩니다:

| 도구         | 설명                        |
| ------------ | --------------------------- |
| `Read`       | 파일 읽기                   |
| `Write`      | 파일 쓰기                   |
| `Edit`       | 파일 편집                   |
| `Glob`       | 파일 패턴 검색              |
| `Grep`       | 파일 내용 검색              |
| `WebSearch`  | 웹 검색                     |
| `WebFetch`   | 웹 페이지 내용 가져오기     |
| `Task`       | 복잡한 작업을 하위 에이전트에 위임 |

`Bash` 등 위험한 도구는 제외되어 있습니다.

---

## MCP 서버 연동

`mcp-servers.json` 파일에서 MCP 서버를 설정할 수 있습니다.

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"]
    }
  }
}
```

---

## 프로젝트 구조

```
engli-bot/
├── src/
│   ├── ai/
│   │   └── agent.ts        # Claude Code Agent 래퍼
│   └── slack/
│       └── bot.ts          # Slack 봇 메인
├── scripts/
│   └── setup.js            # 초기 설정 마법사
├── mcp-servers.json        # MCP 서버 설정
├── install.sh              # 설치 스크립트
├── package.json
└── tsconfig.json
```

---

## 기술 스택

- **Runtime**: Node.js + TypeScript
- **AI**: Claude Code Agent SDK (@anthropic-ai/claude-code)
- **Slack**: @slack/bolt (Socket Mode)
- **MCP**: Model Context Protocol 지원

---
