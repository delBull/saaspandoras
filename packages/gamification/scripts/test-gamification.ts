const TEST_WALLET = "0xdeeb671deda720a75b07e9874e4371c194e38919";
const BASE_URL = "http://127.0.0.1:3000/api/gamification";

async function fetchAPI(endpoint: string, method = 'GET', body?: any) {
    try {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'x-wallet-address': TEST_WALLET
            },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) {
            console.error(`Status: ${res.status} ${res.statusText}`);
            console.error(`Body: ${await res.text()}`);
            return null;
        }
        return await res.json();
    } catch (e) {
        console.error("Fetch Error:", e);
        return null;
    }
}

async function runTests() {
    console.log("🎮 Starting Gamification Integration Tests (Direct API)...");
    console.log(`👤 User: ${TEST_WALLET}`);

    // Get Baseline
    const baseline = await fetchAPI(`/profile/${TEST_WALLET}`);
    const startPoints = baseline?.profile?.totalPoints || 0;
    console.log(`   Initial Points: ${startPoints}`);

    // 1. Learning Loop Test
    console.log("\n🧪 Test 1: Learning Loop (Course Completion)");
    const res1 = await fetchAPI('/track-event', 'POST', {
        userId: TEST_WALLET,
        eventType: 'course_completed',
        metadata: {
            courseId: "test-course-script",
            courseName: "Scripted Test Course",
            completionBonus: 100
        }
    });
    console.log("   Result:", JSON.stringify(res1, null, 2));

    const afterCourse = await fetchAPI(`/profile/${TEST_WALLET}`);
    const points1 = afterCourse?.profile?.totalPoints || 0;
    console.log(`   Points after Course: ${points1} (+${points1 - startPoints})`);

    if (points1 > startPoints) console.log("   ✅ PASS: Points awarded.");
    else console.log("   ❌ FAIL: Points did not increase.");

    // 2. Builder Loop Test
    console.log("\n🧪 Test 2: Builder Loop (Protocol Deployed)");
    await fetchAPI('/track-event', 'POST', {
        userId: TEST_WALLET,
        eventType: 'protocol_deployed',
        metadata: { protocolName: "Test Protocol Script", chainId: 11155111 }
    });

    const afterDeploy = await fetchAPI(`/profile/${TEST_WALLET}`);
    const points2 = afterDeploy?.profile?.totalPoints || 0;
    console.log(`   Points after Deploy: ${points2} (+${points2 - points1})`);

    if (points2 > points1) console.log("   ✅ PASS: Deploy reward received.");
    else console.log("   ❌ FAIL: No reward.");

    // 3. Persistence/Spam Test
    console.log("\n🧪 Test 3: Anti-Farming (Rapid Spam)");
    const promises = [];
    for (let i = 0; i < 5; i++) {
        promises.push(fetchAPI('/track-event', 'POST', {
            userId: TEST_WALLET,
            eventType: 'daily_login',
            metadata: { runId: `spam-${i}` }
        }));
    }
    await Promise.all(promises);

    const finalState = await fetchAPI(`/profile/${TEST_WALLET}`);
    const finalPoints = finalState?.profile?.totalPoints || 0;
    const spamDiff = finalPoints - points2;
    console.log(`   Points after Spam: ${finalPoints} (+${spamDiff})`);

    if (spamDiff <= 10) console.log("   ✅ PASS: Spam filtered (Max 1 login counted).");
    else console.log(`   ⚠️ WARNING: Gained ${spamDiff} points from spam.`);

    console.log("\n🏁 Done.");
}

runTests();
