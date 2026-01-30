import Anthropic from "@anthropic-ai/sdk";
import * as dotenv from "dotenv";
import { executeCommand } from "../terminal/executor";
import { callSlackApi } from "../slack/api";

dotenv.config();

import {
  goToPage,
  takeScreenshot,
  clickElement,
  fillInput,
  getCurrentUrl,
} from "../browser/automation";

interface ToolResult {
  success: boolean;
  output: string;
}

// 대화 컨텍스트 저장소 (채널/DM별)
const conversations = new Map<string, Anthropic.MessageParam[]>();
const MAX_MESSAGES = 20; // 최근 20개 메시지만 유지

// 대화 초기화
export function clearConversation(conversationId: string): void {
  conversations.delete(conversationId);
}

// 메시지 히스토리 가져오기
function getMessages(conversationId: string): Anthropic.MessageParam[] {
  return conversations.get(conversationId) || [];
}

// 메시지 히스토리 저장 (최대 개수 제한)
function saveMessages(conversationId: string, messages: Anthropic.MessageParam[]): void {
  // 최근 MAX_MESSAGES개만 유지
  const trimmed = messages.slice(-MAX_MESSAGES);
  conversations.set(conversationId, trimmed);
}

// 도구 정의
const tools: Anthropic.Tool[] = [
  {
    name: "execute_terminal",
    description:
      "터미널에서 명령어를 실행합니다. ls, pwd, echo 등 안전한 명령어만 실행 가능합니다.",
    input_schema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "실행할 터미널 명령어 (예: ls -la, pwd, echo hello)",
        },
      },
      required: ["command"],
    },
  },
  {
    name: "open_webpage",
    description: "브라우저에서 웹페이지를 엽니다.",
    input_schema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "열 웹페이지 URL (예: https://google.com)",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "take_screenshot",
    description: "현재 브라우저 화면의 스크린샷을 캡처합니다.",
    input_schema: {
      type: "object",
      properties: {
        filename: {
          type: "string",
          description: "저장할 파일명 (예: screenshot.png)",
        },
      },
      required: ["filename"],
    },
  },
  {
    name: "click_element",
    description: "웹페이지에서 특정 요소를 클릭합니다.",
    input_schema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description:
            "CSS 선택자 또는 텍스트 (예: button#submit, text=로그인)",
        },
      },
      required: ["selector"],
    },
  },
  {
    name: "fill_input",
    description: "웹페이지의 입력 필드에 텍스트를 입력합니다.",
    input_schema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "입력 필드의 CSS 선택자 (예: input[name=q], #search)",
        },
        text: {
          type: "string",
          description: "입력할 텍스트",
        },
      },
      required: ["selector", "text"],
    },
  },
  {
    name: "get_current_url",
    description: "현재 브라우저에서 열려있는 페이지의 URL을 가져옵니다.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "slack_api",
    description: `Slack API를 호출합니다. 메시지 읽기, 채널/사용자 정보 조회가 가능합니다.

사용 가능한 메서드:
- conversations.replies: 스레드 메시지 읽기 (필수 params: channel, ts)
- conversations.history: 채널 최근 메시지 (필수 params: channel)
- conversations.list: 채널 목록 조회
- conversations.info: 채널 정보 (필수 params: channel)
- users.info: 사용자 정보 (필수 params: user)
- users.list: 전체 사용자 목록

Slack URL에서 정보 추출하는 법:
- URL 예시: https://xxx.slack.com/archives/C07K9UZDY4Z/p1737012345678901
- channel: archives/ 다음의 문자열 → C07K9UZDY4Z
- ts: p 다음 숫자를 10자리.6자리로 변환 → 1737012345.678901`,
    input_schema: {
      type: "object",
      properties: {
        method: {
          type: "string",
          description: "Slack API 메서드명 (예: conversations.replies)",
        },
        params: {
          type: "object",
          description:
            "API 파라미터 객체 (예: { channel: 'C01234567', ts: '1234567890.123456' })",
        },
      },
      required: ["method", "params"],
    },
  },
];

// 도구 실행
async function executeTool(name: string, input: any): Promise<ToolResult> {
  try {
    switch (name) {
      case "execute_terminal": {
        const result = await executeCommand(input.command);
        return {
          success: true,
          output: result.stdout || "명령어 실행 완료 (출력 없음)",
        };
      }

      case "open_webpage": {
        await goToPage(input.url);
        return { success: true, output: `${input.url} 페이지를 열었습니다.` };
      }

      case "take_screenshot": {
        await takeScreenshot(input.filename);
        return {
          success: true,
          output: `스크린샷을 ${input.filename}으로 저장했습니다.`,
        };
      }

      case "click_element": {
        await clickElement(input.selector);
        return {
          success: true,
          output: `${input.selector} 요소를 클릭했습니다.`,
        };
      }

      case "fill_input": {
        await fillInput(input.selector, input.text);
        return {
          success: true,
          output: `${input.selector}에 "${input.text}"를 입력했습니다.`,
        };
      }

      case "get_current_url": {
        const result = await getCurrentUrl();
        return { success: true, output: `현재 URL: ${result.output}` };
      }

      case "slack_api": {
        const result = await callSlackApi(input.method, input.params);
        return result;
      }

      default:
        return { success: false, output: `알 수 없는 도구: ${name}` };
    }
  } catch (error: any) {
    return {
      success: false,
      output: `오류 발생: ${error.error || error.message}`,
    };
  }
}

// 에이전트 로직
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function runAgent(userMessage: string, conversationId: string): Promise<string> {
  // 기존 대화 히스토리 가져오기
  const history = getMessages(conversationId);

  // 새 사용자 메시지 추가
  const messages: Anthropic.MessageParam[] = [
    ...history,
    {
      role: "user",
      content: userMessage,
    },
  ];

  const systemPrompt = `당신은 사용자의 AI 비서입니다.
사용자의 요청을 이해하고 적절한 도구를 사용해서 작업을 수행하세요.

사용 가능한 도구:
- execute_terminal: 터미널 명령 실행 (ls, pwd 등)
- open_webpage: 웹페이지 열기
- take_screenshot: 스크린샷 캡처
- click_element: 웹 요소 클릭
- fill_input: 입력 필드에 텍스트 입력
- get_current_url: 현재 URL 확인
- slack_api: Slack API 호출 (스레드 읽기, 채널/사용자 조회)

Slack URL을 받으면:
1. archives/ 다음 문자열이 channel ID
2. /p 다음 숫자를 10자리.6자리로 나눠서 ts로 사용
3. conversations.replies 메서드로 스레드 읽기

예시: https://xxx.slack.com/archives/C07ABC123/p1737012345678901
→ channel: "C07ABC123", ts: "1737012345.678901"

한국어로 친절하게 응답하세요.
도구를 사용한 후에는 결과를 요약해서 알려주세요.

이전 대화 내용을 기억하고 있으니, 사용자가 "아까 그 파일", "방금 열었던 페이지" 등으로 언급하면 맥락을 파악해서 처리하세요.`;

  let response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    tools,
    messages,
  });

  while (response.stop_reason === "tool_use") {
    const toolUseBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    if (!toolUseBlock) break;

    const toolResult = await executeTool(toolUseBlock.name, toolUseBlock.input);

    messages.push({
      role: "assistant",
      content: response.content,
    });

    messages.push({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: toolUseBlock.id,
          content: toolResult.output,
        },
      ],
    });

    response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages,
    });
  }

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text",
  );

  // 최종 assistant 응답 추가
  messages.push({
    role: "assistant",
    content: response.content,
  });

  // 대화 히스토리 저장
  saveMessages(conversationId, messages);

  return textBlock?.text || "작업을 완료했습니다.";
}
