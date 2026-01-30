import {
  runPlaywriter,
  goToPage,
  takeScreenshot,
  getCurrentUrl,
} from '../src/browser/automation';

async function runTests(): Promise<void> {
  console.log('=== Playwriter 브라우저 자동화 테스트 ===\n');
  console.log('⚠️  테스트 전 확인사항:');
  console.log('   1. Chrome에서 Playwriter 확장 프로그램이 실행 중인지');
  console.log('   2. "playwriter session new"로 세션을 생성했는지\n');

  // 테스트 1: 페이지 이동
  console.log('테스트 1: Google 페이지 이동');
  try {
    const result = await goToPage('https://www.google.com');
    console.log('✅ 성공: 페이지 이동 완료\n');
  } catch (err: any) {
    console.log('❌ 실패:', err.error, '\n');
  }

  // 잠시 대기
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 테스트 2: 현재 URL 확인
  console.log('테스트 2: 현재 URL 확인');
  try {
    const result = await getCurrentUrl();
    console.log('✅ 성공:', result.output, '\n');
  } catch (err: any) {
    console.log('❌ 실패:', err.error, '\n');
  }

  // 테스트 3: 스크린샷
  console.log('테스트 3: 스크린샷 캡처');
  try {
    const result = await takeScreenshot('test-screenshot.png');
    console.log('✅ 성공: test-screenshot.png 저장됨\n');
  } catch (err: any) {
    console.log('❌ 실패:', err.error, '\n');
  }

  // 테스트 4: 커스텀 코드 실행
  console.log('테스트 4: 페이지 타이틀 가져오기');
  try {
    const result = await runPlaywriter('await page.title()');
    console.log('✅ 성공:', result.output, '\n');
  } catch (err: any) {
    console.log('❌ 실패:', err.error, '\n');
  }

  // 테스트 5: 검색창에 입력
  console.log('테스트 5: Google 검색창에 텍스트 입력');
  try {
    await runPlaywriter(`await page.fill('textarea[name="q"]', 'Playwriter test')`);
    console.log('✅ 성공: 텍스트 입력 완료\n');
  } catch (err: any) {
    console.log('❌ 실패:', err.error, '\n');
  }

  console.log('=== 테스트 완료 ===');
  console.log('📁 스크린샷이 프로젝트 폴더에 저장되었는지 확인하세요.');
}

runTests();
