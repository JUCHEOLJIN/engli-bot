import { WebClient } from "@slack/web-api";
import * as dotenv from "dotenv";

dotenv.config();

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

// 허용된 Slack API 메서드 (안전장치)
const ALLOWED_METHODS = [
  // 메시지 읽기
  "conversations.history",
  "conversations.replies",
  "conversations.list",
  "conversations.info",
  // 사용자 정보
  "users.info",
  "users.list",
];

// Slack URL 파싱 유틸리티
export function parseSlackUrl(
  url: string,
): { channelId: string; messageTs?: string } | null {
  // URL 형식: https://workspace.slack.com/archives/C01234567/p1234567890123456
  const match = url.match(/archives\/([A-Z0-9]+)(?:\/p(\d+))?/);
  if (!match) return null;

  const channelId = match[1];
  const messageTs = match[2]
    ? `${match[2].slice(0, 10)}.${match[2].slice(10)}`
    : undefined;

  return { channelId, messageTs };
}

// 범용 Slack API 호출
export async function callSlackApi(
  method: string,
  params: Record<string, any>,
): Promise<{ success: boolean; output: string; data?: any }> {
  // 안전장치: 허용된 메서드만 실행
  if (!ALLOWED_METHODS.includes(method)) {
    return {
      success: false,
      output: `허용되지 않은 메서드입니다: ${method}\n\n허용된 메서드:\n${ALLOWED_METHODS.map((m) => `- ${m}`).join("\n")}`,
    };
  }

  try {
    // 동적으로 Slack API 메서드 호출
    // 예: "conversations.replies" → client.conversations.replies(params)
    const [namespace, methodName] = method.split(".");
    const apiNamespace = (client as any)[namespace];

    if (!apiNamespace || typeof apiNamespace[methodName] !== "function") {
      return { success: false, output: `잘못된 메서드입니다: ${method}` };
    }

    const result = await apiNamespace[methodName](params);

    // 결과 포맷팅
    return {
      success: true,
      output: formatSlackResponse(method, result),
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      output: `Slack API 오류: ${error.message}`,
    };
  }
}

// 응답 포맷팅
function formatSlackResponse(method: string, result: any): string {
  switch (method) {
    case "conversations.history":
    case "conversations.replies": {
      if (!result.messages?.length) {
        return "메시지가 없습니다.";
      }
      const messages = result.messages.map((msg: any) => {
        const user = msg.user || "Unknown";
        const text = msg.text || "(내용 없음)";
        const time = new Date(parseFloat(msg.ts) * 1000).toLocaleString(
          "ko-KR",
        );
        return `[${time}] <@${user}>: ${text}`;
      });

      if (method === "conversations.history") {
        messages.reverse();
      }
      return `메시지 ${messages.length}개:\n\n${messages.join("\n\n")}`;
    }

    case "conversations.list": {
      if (!result.channels?.length) {
        return "채널이 없습니다.";
      }
      const channels = result.channels.map(
        (ch: any) => `- #${ch.name} (ID: ${ch.id})`,
      );
      return `채널 목록 (${channels.length}개):\n${channels.join("\n")}`;
    }

    case "conversations.info": {
      const ch = result.channel;
      return `채널 정보:\n- 이름: #${ch.name}\n- ID: ${ch.id}\n- 멤버 수: ${ch.num_members || "알 수 없음"}\n- 목적: ${ch.purpose?.value || "없음"}`;
    }

    case "users.info": {
      const user = result.user;
      return `사용자 정보:\n- 이름: ${user.real_name || user.name}\n- ID: ${user.id}\n- 표시 이름: ${user.profile?.display_name || "없음"}\n- 상태: ${user.profile?.status_text || "없음"}`;
    }

    case "users.list": {
      if (!result.members?.length) {
        return "멤버가 없습니다.";
      }
      const members = result.members
        .filter((m: any) => !m.is_bot && !m.deleted)
        .map((m: any) => `- ${m.real_name || m.name} (ID: ${m.id})`);
      return `멤버 목록 (${members.length}명):\n${members.join("\n")}`;
    }

    default:
      return JSON.stringify(result, null, 2);
  }
}
