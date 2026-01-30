import { exec, ExecException } from "child_process";

interface PlaywriterOptions {
  sessionId?: number;
  timeout?: number;
}

interface PlaywriterSuccess {
  success: true;
  output: string;
  code: string;
}

interface PlaywriterError {
  success: false;
  error: string;
  code: string;
}

type PlaywriterResult = PlaywriterSuccess | PlaywriterError;

export function runPlaywriter(
  code: string,
  options: PlaywriterOptions = {},
): Promise<PlaywriterSuccess> {
  const sessionId = options.sessionId ?? 1;
  const timeout = options.timeout ?? 30000;

  // 코드에서 따옴표 이스케이프 처리
  const escapedCode = code.replace(/"/g, '\\"');
  const command = `playwriter -s ${sessionId} -e "${escapedCode}"`;

  return new Promise((resolve, reject) => {
    exec(
      command,
      { timeout },
      (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) {
          const result: PlaywriterError = {
            success: false,
            error: error.message,
            code,
          };
          reject(result);
        } else {
          const result: PlaywriterSuccess = {
            success: true,
            output: stdout.trim(),
            code,
          };
          resolve(result);
        }
      },
    );
  });
}

// 페이지 이동
export async function goToPage(
  url: string,
  options?: PlaywriterOptions,
): Promise<PlaywriterSuccess> {
  return runPlaywriter(`await page.goto('${url}')`, options);
}

// 스크린샷 캡처
export async function takeScreenshot(
  path: string,
  options?: PlaywriterOptions,
): Promise<PlaywriterSuccess> {
  return runPlaywriter(`await page.screenshot({ path: '${path}' })`, options);
}

// 요소 클릭
export async function clickElement(
  selector: string,
  options?: PlaywriterOptions,
): Promise<PlaywriterSuccess> {
  return runPlaywriter(`await page.click('${selector}')`, options);
}

// 텍스트 입력
export async function fillInput(
  selector: string,
  text: string,
  options?: PlaywriterOptions,
): Promise<PlaywriterSuccess> {
  return runPlaywriter(`await page.fill('${selector}', '${text}')`, options);
}

// 페이지 텍스트 가져오기
export async function getPageText(
  selector: string,
  options?: PlaywriterOptions,
): Promise<PlaywriterSuccess> {
  return runPlaywriter(`await page.textContent('${selector}')`, options);
}

// 현재 URL 가져오기
export async function getCurrentUrl(
  options?: PlaywriterOptions,
): Promise<PlaywriterSuccess> {
  return runPlaywriter(`page.url()`, options);
}

// 페이지 대기
export async function waitForSelector(
  selector: string,
  options?: PlaywriterOptions,
): Promise<PlaywriterSuccess> {
  return runPlaywriter(`await page.waitForSelector('${selector}')`, options);
}

export function createSession(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec("playwriter session new", (error, stdout, stderr) => {
      if (error) {
        reject(error.message);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

export function listSessions(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec("playwriter session list", (error, stdout, stderr) => {
      if (error) {
        reject(error.message);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}
