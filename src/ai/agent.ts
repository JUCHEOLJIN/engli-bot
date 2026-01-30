import { spawn } from "child_process";
import * as dotenv from "dotenv";

dotenv.config();

// 세션 저장소 (채널/DM별 세션 ID)
const sessions = new Map<string, string>();

// 대화 초기화
export function clearConversation(conversationId: string): void {
  sessions.delete(conversationId);
}

interface StructuredPatch {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

interface ToolUseResult {
  filePath?: string;
  oldString?: string;
  newString?: string;
  structuredPatch?: StructuredPatch[];
}

interface ClaudeMessage {
  type: string;
  session_id?: string;
  result?: string;
  subtype?: string;
  tool_use_result?: ToolUseResult;
  content?: Array<{ type: string; text?: string }>;
  [key: string]: any;
}

// 진행 상황 콜백 타입
export type ProgressCallback = (status: string) => void;

// 에이전트 실행
export async function runAgent(
  userMessage: string,
  conversationId: string,
  onProgress?: ProgressCallback,
): Promise<string> {
  const existingSessionId = sessions.get(conversationId);

  return new Promise((resolve, reject) => {
    const args = [
      "--print",
      "--verbose",
      "--output-format",
      "stream-json",
      "--permission-mode",
      "acceptEdits",
    ];

    // 세션 이어받기
    if (existingSessionId) {
      args.push("--resume", existingSessionId);
    }

    // 프롬프트 추가
    args.push(userMessage);

    const claude = spawn("claude", args, {
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let result = "";
    let newSessionId: string | undefined;
    let buffer = "";
    let stderrOutput = "";

    claude.stderr.on("data", (data: Buffer) => {
      stderrOutput += data.toString();
    });

    claude.stdout.on("data", (data: Buffer) => {
      buffer += data.toString();

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const message: ClaudeMessage = JSON.parse(line);

          // 진행 상황 콜백
          logProgress(message, onProgress);

          // 세션 ID 저장
          if (message.type === "system" && message.session_id) {
            newSessionId = message.session_id;
          }

          // 결과 수집
          if (message.type === "result" && message.result) {
            result = message.result;
          }

          // assistant 메시지에서 텍스트 추출
          if (message.type === "assistant" && message.content) {
            for (const block of message.content) {
              if (block.type === "text" && block.text) {
                result = block.text;
              }
            }
          }
        } catch {
          // JSON 파싱 실패 무시
        }
      }
    });

    claude.on("close", (code) => {
      if (newSessionId) {
        sessions.set(conversationId, newSessionId);
      }

      if (code === 0) {
        resolve(result || "작업을 완료했습니다.");
      } else {
        const errorMsg = stderrOutput.trim() || `exit code ${code}`;
        reject(new Error(`Claude 오류: ${errorMsg}`));
      }
    });

    claude.on("error", (err) => {
      reject(new Error(`Claude 실행 실패: ${err.message}`));
    });
  });
}

// diff 포맷팅
function formatDiff(filePath: string, patches: StructuredPatch[]): string {
  const lines: string[] = [`📝 *${filePath}*`, "```diff"];

  for (const patch of patches) {
    lines.push(`@@ -${patch.oldStart},${patch.oldLines} +${patch.newStart},${patch.newLines} @@`);
    for (const line of patch.lines) {
      lines.push(line);
    }
  }

  lines.push("```");
  return lines.join("\n");
}

// 진행 상황 콜백
function logProgress(
  message: ClaudeMessage,
  onProgress?: ProgressCallback,
): void {
  if (!onProgress) return;

  let status = "";

  switch (message.type) {
    case "system":
      if (message.subtype === "init") {
        status = "🔄 세션 시작...";
      }
      break;

    case "user":
      // Edit 도구 결과에서 diff 추출
      if (message.tool_use_result?.structuredPatch && message.tool_use_result?.filePath) {
        const diff = formatDiff(
          message.tool_use_result.filePath,
          message.tool_use_result.structuredPatch,
        );
        status = diff;
      }
      break;

    case "assistant":
      if (message.content) {
        for (const block of message.content) {
          if (block.type === "tool_use") {
            const toolName = (block as any).name || "도구";
            status = `🔧 ${toolName} 실행 중...`;
            break;
          }
        }
      }
      break;

    case "result":
      status = "✨ 완료!";
      break;
  }

  if (status) {
    onProgress(status);
  }
}
