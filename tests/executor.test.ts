import { executeCommand, isCommandSafe } from '../src/terminal/executor';

async function runTests(): Promise<void> {
  console.log('=== 터미널 실행 모듈 테스트 ===\n');

  // 테스트 1: 안전한 명령어
  console.log('테스트 1: ls 명령어');
  try {
    const result = await executeCommand('ls -la');
    console.log('✅ 성공:', result.stdout.slice(0, 100) + '...\n');
  } catch (err: any) {
    console.log('❌ 실패:', err.error, '\n');
  }

  // 테스트 2: 현재 경로
  console.log('테스트 2: pwd 명령어');
  try {
    const result = await executeCommand('pwd');
    console.log('✅ 성공:', result.stdout, '\n');
  } catch (err: any) {
    console.log('❌ 실패:', err.error, '\n');
  }

  // 테스트 3: echo
  console.log('테스트 3: echo 명령어');
  try {
    const result = await executeCommand('echo "Hello, World!"');
    console.log('✅ 성공:', result.stdout, '\n');
  } catch (err: any) {
    console.log('❌ 실패:', err.error, '\n');
  }

  // 테스트 4: 위험한 명령어 (차단되어야 함)
  console.log('테스트 4: rm -rf (차단되어야 함)');
  try {
    await executeCommand('rm -rf /');
    console.log('❌ 차단 실패! 이 명령이 실행되면 안됩니다!\n');
  } catch (err: any) {
    console.log('✅ 정상 차단:', err.error, '\n');
  }

  // 테스트 5: sudo (차단되어야 함)
  console.log('테스트 5: sudo (차단되어야 함)');
  try {
    await executeCommand('sudo ls');
    console.log('❌ 차단 실패!\n');
  } catch (err: any) {
    console.log('✅ 정상 차단:', err.error, '\n');
  }

  // 테스트 6: isCommandSafe 함수 직접 테스트
  console.log('테스트 6: isCommandSafe 함수');
  console.log('  ls -la:', isCommandSafe('ls -la') ? '✅ 안전' : '❌ 위험');
  console.log('  pwd:', isCommandSafe('pwd') ? '✅ 안전' : '❌ 위험');
  console.log('  rm -rf /:', isCommandSafe('rm -rf /') ? '❌ 안전?' : '✅ 위험');
  console.log('  sudo apt:', isCommandSafe('sudo apt') ? '❌ 안전?' : '✅ 위험');

  console.log('\n=== 테스트 완료 ===');
}

runTests();
