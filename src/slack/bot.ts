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
  } catch {
    // 업데이트 실패 무시
  }
}

// 새 메시지 전송 헬퍼
async function postMessage(channel: string, text: string): Promise<void> {
  try {
    await app.client.chat.postMessage({
      token: SLACK_BOT_TOKEN,
      channel,
      text,
    });
  } catch {
    // 전송 실패 무시
  }
}

// diff인지 확인
function isDiff(status: string): boolean {
  return status.includes("```diff");
}

// @멘션 핸들러
app.event("app_mention", async ({ event, say }) => {
  if (event.user !== MY_SLACK_USER_ID) {
    return;
  }

  const userMessage = event.text.replace(/<@[A-Z0-9]+>/g, "").trim();

  if (!userMessage) {
    await say(
      "안녕하세요! 무엇이든 물어보세요.\n\n" +
        "사용 가능한 기능:\n" +
        "• 파일 읽기/쓰기/편집\n" +
        "• 웹 검색\n" +
        "• 코드 분석\n\n" +
        '"초기화" - 대화 기록 초기화',
    );
    return;
  }

  if (userMessage === "초기화" || userMessage === "리셋") {
    clearConversation(event.channel);
    await say("🔄 대화 기록이 초기화되었습니다.");
    return;
  }

  const processingMsg = await say(`🤔 처리 중...\n\n> ${userMessage}`);
  const msgTs = (processingMsg as any).ts;

  let lastStatus = "";

  try {
    const response = await runAgent(userMessage, event.channel, async (status) => {
      if (status !== lastStatus) {
        lastStatus = status;

        // diff는 별도 메시지로 전송
        if (isDiff(status)) {
          await postMessage(event.channel, status);
        } else {
          await updateMessage(event.channel, msgTs, `${status}\n\n> ${userMessage}`);
        }
      }
    });

    await updateMessage(event.channel, msgTs, response);
  } catch (error: any) {
    console.error("Agent error:", error);
    await updateMessage(event.channel, msgTs, `❌ 오류: ${error.message}`);
  }
});

// DM 핸들러
app.event("message", async ({ event, say }) => {
  if ((event as any).bot_id) return;
  if (event.channel_type !== "im") return;
  if ((event as any).user !== MY_SLACK_USER_ID) return;

  const userMessage = (event as any).text?.trim();
  if (!userMessage) return;

  if (userMessage === "초기화" || userMessage === "리셋") {
    clearConversation(event.channel);
    await say("🔄 대화 기록이 초기화되었습니다.");
    return;
  }

  const processingMsg = await say(`🤔 처리 중...\n\n> ${userMessage}`);
  const msgTs = (processingMsg as any).ts;

  let lastStatus = "";

  try {
    const response = await runAgent(userMessage, event.channel, async (status) => {
      if (status !== lastStatus) {
        lastStatus = status;

        // diff는 별도 메시지로 전송
        if (isDiff(status)) {
          await postMessage(event.channel, status);
        } else {
          await updateMessage(event.channel, msgTs, `${status}\n\n> ${userMessage}`);
        }
      }
    });

    await updateMessage(event.channel, msgTs, response);
  } catch (error: any) {
    console.error("Agent error:", error);
    await updateMessage(event.channel, msgTs, `❌ 오류: ${error.message}`);
  }
});

// 앱 시작
async function startApp(): Promise<void> {
  try {
    await app.start();
    console.log("⚡️ Engli Bot 실행됨");
    console.log(`   Slack ID: ${MY_SLACK_USER_ID}`);
    console.log("");
    console.log("   허용된 도구: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Task");
    console.log("   (Bash 등 위험한 도구는 제외됨)");
  } catch (error) {
    console.error("❌ 앱 시작 실패:", error);
    process.exit(1);
  }
}

startApp();
