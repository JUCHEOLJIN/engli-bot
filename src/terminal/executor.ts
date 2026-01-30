import { ExecException } from "node:child_process";

const { exec } = require("child_process");

const BLOCKED_PATTERNS = [
  "rm -rf",
  "rm -r",
  "rmdir",
  "sudo",
  "shutdown",
  "reboot",
  "mkfs",
  "dd ",
  "format",
  ":(){",
  "> /dev",
  "chmod 777",
  "wget",
  "curl",
] as const;

/**
 * 명령어 안전성 검사
 * @param command - 검사할 명령어
 */
export function isCommandSafe(command: string): boolean {
  const lowerCommand = command.toLowerCase();

  for (const pattern of BLOCKED_PATTERNS) {
    if (lowerCommand.includes(pattern.toLowerCase())) {
      return false;
    }
  }
  return true;
}

export interface ExecuteOptions {
  timeout?: number;
  cwd?: string;
}

export interface ExecuteSuccess {
  success: true;
  stdout: string;
  stderr: string;
  command: string;
}

export interface ExecuteError {
  success: false;
  error: string;
  stderr?: string;
  command: string;
}

export type ExecuteResult = ExecuteSuccess | ExecuteError;

export function executeCommand(
  command: string,
  options: ExecuteOptions = {},
): Promise<ExecuteSuccess> {
  const timeout = options.timeout ?? 30000; // 기본 30초
  const cwd = options.cwd ?? process.cwd(); // 기본 현재 디렉토리

  return new Promise((resolve, reject) => {
    // 1. 안전성 검사
    if (!isCommandSafe(command)) {
      const error: ExecuteError = {
        success: false,
        error: "차단된 명령어입니다",
        command,
      };
      reject(error);
      return;
    }

    // 2. 명령어 실행
    exec(
      command,
      { timeout, cwd },
      (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) {
          const result: ExecuteError = {
            success: false,
            error: error.message,
            stderr,
            command,
          };
          reject(result);
        } else {
          const result: ExecuteSuccess = {
            success: true,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            command,
          };
          resolve(result);
        }
      },
    );
  });
}
