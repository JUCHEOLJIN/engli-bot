import { App, LogLevel } from "@slack/bolt";
import * as dotenv from "dotenv";
import { runAgent } from "../ai/agent";

dotenv.config();

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MY_SLACK_USER_ID = process.env.MY_SLACK_USER_ID;

// 환경 변수 확인
if (!SLACK_BOT_TOKEN || !SLACK_SIGNING_SECRET || !SLACK_APP_TOKEN) {
  console.error("❌ Slack 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

if (!ANTHROPIC_API_KEY) {
  console.error("❌ ANTHROPIC_API_KEY가 설정되지 않았습니다.");
  process.exit(1);
}

if (!MY_SLACK_USER_ID) {
  console.error("❌ MY_SLACK_USER_ID가 설정되지 않았습니다.");
  console.error("   Slack에서 본인 프로필 > 더보기 > 멤버 ID 복사");
  process.exit(1);
}

// 슬랙 초기화
const app = new App({
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: SLACK_APP_TOKEN,
  logLevel: LogLevel.INFO,
});

// @멘션 핸들러
app.event("app_mention", async ({ event, say }) => {
  // 내가 보낸 메시지만 처리 (발신자 필터링)
  if (event.user !== MY_SLACK_USER_ID) {
    console.log(`무시: ${event.user}의 메시지 (내 ID: ${MY_SLACK_USER_ID})`);
    return;
  }

  // 멘션 부분 제거
  const userMessage = event.text.replace(/<@[A-Z0-9]+>/g, "").trim();

  if (!userMessage) {
    await say(
      "안녕하세요! 저는 AI 비서 Engli Bot입니다. \n\n" +
        "무엇이든 말씀해주세요! 예시:\n" +
        '• "현재 폴더 파일 보여줘"\n' +
        '• "구글 열어줘"\n' +
        '• "깃허브 스크린샷 찍어줘"',
    );
    return;
  }

  // 처리 중 메시지
  await say(`🤔 "${userMessage}" 작업 중...`);

  try {
    // AI 에이전트 실행
    const response = await runAgent(userMessage);
    await say(response);
  } catch (error: any) {
    console.error("Agent error:", error);
    await say(`❌ 오류가 발생했습니다: ${error.message}`);
  }
});

// DM 핸들러
app.event("message", async ({ event, say }) => {
  // 봇 자신의 메시지 무시
  if ((event as any).bot_id) return;

  // DM이 아닌 경우 무시
  if (event.channel_type !== "im") return;

  // 내가 보낸 메시지만 처리 (발신자 필터링)
  if ((event as any).user !== MY_SLACK_USER_ID) {
    console.log(`무시: ${(event as any).user}의 DM (내 ID: ${MY_SLACK_USER_ID})`);
    return;
  }

  const userMessage = (event as any).text?.trim();

  if (!userMessage) return;

  await say(`🤔 처리 중...`);

  try {
    const response = await runAgent(userMessage);
    await say(response);
  } catch (error: any) {
    console.error("Agent error:", error);
    await say(`❌ 오류가 발생했습니다: ${error.message}`);
  }
});

// 앱 시작
async function startApp(): Promise<void> {
  try {
    await app.start();
    console.log("⚡️ AI 비서 Engli Bot이 실행되었습니다!");
    console.log("");
    console.log(`   내 Slack ID: ${MY_SLACK_USER_ID}`);
    console.log("   이 ID의 메시지만 처리합니다.");
    console.log("");
    console.log("   슬랙에서 @Engli Bot을 멘션하거나 DM을 보내세요!");
    console.log("");
    console.log("   예시:");
    console.log("   • @Engli Bot 현재 폴더 파일 보여줘");
    console.log("   • @Engli Bot 구글 열어줘");
    console.log("   • @Engli Bot 스크린샷 찍어줘");
  } catch (error) {
    console.error("❌ 앱 시작 실패:", error);
    process.exit(1);
  }
}

startApp();
