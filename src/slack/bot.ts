import { App, LogLevel } from "@slack/bolt";
import * as dotenv from "dotenv";
import { runAgent, clearConversation } from "../ai/agent";

dotenv.config();

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN;
const MY_SLACK_USER_ID = process.env.MY_SLACK_USER_ID;

// 환경 변수 확인
if (!SLACK_BOT_TOKEN || !SLACK_SIGNING_SECRET || !SLACK_APP_TOKEN) {
  console.error("❌ Slack 환경변수가 설정되지 않았습니다.");
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

// 메시지 업데이트 헬퍼
async function updateMessage(
  channel: string,
  ts: string,
  text: string,
): Promise<void> {
  try {
    await app.client.chat.update({
      token: SLACK_BOT_TOKEN,
      channel,
      ts,
      text,
    });
  } catch (error) {
    // 업데이트 실패 무시 (너무 빠른 업데이트 등)
  }
}

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
      "안녕하세요! 무엇이든 물어보세요. Claude Code의 모든 기능을 사용할 수 있습니다.\n\n" +
        "예시:\n" +
        '• "현재 폴더의 파일 목록 보여줘"\n' +
        '• "package.json 파일 읽어줘"\n' +
        '• "React에 대해 웹 검색해줘"\n' +
        '• "초기화" - 대화 기록 초기화',
    );
    return;
  }

  // 대화 초기화 처리
  if (userMessage === "초기화" || userMessage === "리셋") {
    clearConversation(event.channel);
    await say("🔄 대화 기록이 초기화되었습니다. 새로운 대화를 시작하세요!");
    return;
  }

  // 처리 중 메시지 (나중에 업데이트할 것)
  const processingMsg = await say(`🤔 처리 중...\n\n> ${userMessage}`);
  const msgTs = (processingMsg as any).ts;

  let lastStatus = "";

  try {
    // AI 에이전트 실행 (진행 상황 콜백 전달)
    const response = await runAgent(userMessage, event.channel, async (status) => {
      // 상태가 바뀌었을 때만 업데이트 (rate limit 방지)
      if (status !== lastStatus) {
        lastStatus = status;
        await updateMessage(
          event.channel,
          msgTs,
          `${status}\n\n> ${userMessage}`,
        );
      }
    });

    // 최종 응답
    await updateMessage(event.channel, msgTs, response);
  } catch (error: any) {
    console.error("Agent error:", error);
    await updateMessage(
      event.channel,
      msgTs,
      `❌ 오류가 발생했습니다: ${error.message}`,
    );
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

  // 대화 초기화 처리
  if (userMessage === "초기화" || userMessage === "리셋") {
    clearConversation(event.channel);
    await say("🔄 대화 기록이 초기화되었습니다. 새로운 대화를 시작하세요!");
    return;
  }

  // 처리 중 메시지
  const processingMsg = await say(`🤔 처리 중...\n\n> ${userMessage}`);
  const msgTs = (processingMsg as any).ts;

  let lastStatus = "";

  try {
    // AI 에이전트 실행
    const response = await runAgent(userMessage, event.channel, async (status) => {
      if (status !== lastStatus) {
        lastStatus = status;
        await updateMessage(
          event.channel,
          msgTs,
          `${status}\n\n> ${userMessage}`,
        );
      }
    });

    await updateMessage(event.channel, msgTs, response);
  } catch (error: any) {
    console.error("Agent error:", error);
    await updateMessage(
      event.channel,
      msgTs,
      `❌ 오류가 발생했습니다: ${error.message}`,
    );
  }
});

// 앱 시작
async function startApp(): Promise<void> {
  try {
    await app.start();
    console.log("⚡️ Engli Bot이 실행되었습니다!");
    console.log("");
    console.log(`   내 Slack ID: ${MY_SLACK_USER_ID}`);
    console.log("   이 ID의 메시지만 처리합니다.");
    console.log("");
    console.log("   Claude Code의 모든 기능 사용 가능:");
    console.log("   • 파일 읽기/쓰기/편집");
    console.log("   • 터미널 명령 실행");
    console.log("   • 웹 검색");
    console.log("   • 코드 분석 및 수정");
    console.log("");
  } catch (error) {
    console.error("❌ 앱 시작 실패:", error);
    process.exit(1);
  }
}

startApp();
