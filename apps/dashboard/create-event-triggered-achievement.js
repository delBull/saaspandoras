import { trackGamificationEvent } from './src/lib/gamification/service.js';

async function testEventToAchievementConnection() {
  console.log('🔄 TESTING: Event → Achievement Connection');

  // Test 1: Ejecutar evento DAILY_LOGIN
  console.log('\n📝 Test 1: Triggering DAILY_LOGIN event');
  await trackGamificationEvent('0x00c9f7EE6d1808C09B61E561Af6c787060BFE7C9', 'DAILY_LOGIN');

  // Test 2: Ejecutar evento COURSECOMPLETED
  console.log('\n📝 Test 2: Triggering COURSE_COMPLETED event');
  await trackGamificationEvent('0x00c9f7EE6d1808C09B61E561Af6c787060BFE7C9', 'COURSE_COMPLETED');

  // Test 3: Ejecutar evento PROJECT_APPLICATION_SUBMITTED
  console.log('\n📝 Test 3: Triggering PROJECT_APPLICATION_SUBMITTED event');
  await trackGamificationEvent('0x00c9f7EE6d1808C09B61E561Af6c787060BFE7C9', 'PROJECT_APPLICATION_SUBMITTED');

  console.log('\n✅ Tests completed - Check your achievements page for unlocks!');
}

testEventToAchievementConnection();
