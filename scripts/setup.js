#!/usr/bin/env node

const readline = require("readline");
const fs = require("fs");
const path = require("path");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 색상
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function color(c, text) {
  return `${colors[c]}${text}${colors.reset}`;
}

console.log(`
${color("blue", "╔═══════════════════════════════════════╗")}
${color("blue", "║")}     Engli Bot 초기 설정 마법사         ${color("blue", "║")}
${color("blue", "╚═══════════════════════════════════════╝")}
`);

const questions = [
  {
    key: "SLACK_BOT_TOKEN",
    prompt: "Slack Bot Token (xoxb-...): ",
    hint: "Slack 앱 > OAuth & Permissions > Bot User OAuth Token",
    validate: (v) => v.startsWith("xoxb-"),
    error: "xoxb-로 시작해야 합니다",
  },
  {
    key: "SLACK_SIGNING_SECRET",
    prompt: "Slack Signing Secret: ",
    hint: "Slack 앱 > Basic Information > Signing Secret",
    validate: (v) => v.length > 10,
    error: "올바른 값을 입력하세요",
  },
  {
    key: "SLACK_APP_TOKEN",
    prompt: "Slack App Token (xapp-...): ",
    hint: "Slack 앱 > Basic Information > App-Level Tokens",
    validate: (v) => v.startsWith("xapp-"),
    error: "xapp-로 시작해야 합니다",
  },
  {
    key: "ANTHROPIC_API_KEY",
    prompt: "Anthropic API Key (sk-ant-...): ",
    hint: "https://console.anthropic.com/settings/keys",
    validate: (v) => v.startsWith("sk-ant-"),
    error: "sk-ant-로 시작해야 합니다",
  },
  {
    key: "MY_SLACK_USER_ID",
    prompt: "내 Slack User ID (U로 시작): ",
    hint: "Slack에서 본인 프로필 > 더보기 > 멤버 ID 복사",
    validate: (v) => v.startsWith("U"),
    error: "U로 시작해야 합니다",
  },
];

async function ask(q) {
  console.log(`\n${color("cyan", "💡 " + q.hint)}`);

  return new Promise((resolve) => {
    const askQuestion = () => {
      rl.question(q.prompt, (answer) => {
        answer = answer.trim();

        if (!answer) {
          console.log(color("yellow", "   ⚠️  값을 입력해주세요"));
          askQuestion();
          return;
        }

        if (q.validate && !q.validate(answer)) {
          console.log(color("yellow", `   ⚠️  ${q.error}`));
          askQuestion();
          return;
        }

        resolve({ key: q.key, value: answer });
      });
    };
    askQuestion();
  });
}

async function main() {
  console.log("Slack 앱이 없다면 먼저 만들어야 합니다:");
  console.log(color("blue", "https://api.slack.com/apps\n"));

  console.log("필요한 Slack 앱 설정:");
  console.log("  • Socket Mode: 활성화");
  console.log("  • Event Subscriptions: app_mention, message.im");
  console.log("  • Bot Token Scopes:");
  console.log("    - app_mentions:read");
  console.log("    - chat:write");
  console.log("    - im:history");
  console.log("    - channels:history (스레드 읽기용)");
  console.log("    - channels:read (채널 목록용)");
  console.log("    - users:read (사용자 정보용)");

  const answers = [];

  for (const q of questions) {
    const answer = await ask(q);
    answers.push(answer);
  }

  // .env 파일 생성
  const envPath = path.join(__dirname, "..", ".env");
  const envContent =
    "# Engli Bot 설정\n" +
    "# 생성일: " +
    new Date().toLocaleString("ko-KR") +
    "\n\n" +
    answers.map((a) => `${a.key}=${a.value}`).join("\n") +
    "\n";

  fs.writeFileSync(envPath, envContent);

  console.log(`
${color("green", "╔═══════════════════════════════════════╗")}
${color("green", "║")}           설정 완료!                   ${color("green", "║")}
${color("green", "╚═══════════════════════════════════════╝")}

설정 파일: ${envPath}

${color("yellow", "다음 명령어로 봇을 시작하세요:")}

  ${color("blue", "engli-bot start")}

Slack에서 @Engli Bot을 멘션해보세요!
`);

  rl.close();
}

main().catch((err) => {
  console.error("오류:", err);
  rl.close();
  process.exit(1);
});
