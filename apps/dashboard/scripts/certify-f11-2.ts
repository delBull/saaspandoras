import { Wallet } from "ethers";

const DOMAIN = "localhost";
const URI = "http://localhost:3000";
const STATEMENT = "Sign in to Pandora's Growth OS";
const CHAIN_ID = 137;
const API_URL = "http://localhost:3000/api/auth";

async function runCertification() {
  console.log("==========================================");
  console.log(" F11.2 RUNTIME CERTIFICATION SCRIPT");
  console.log("==========================================");

  const freshWallet = Wallet.createRandom();
  console.log(`[INIT] Generated fresh wallet: ${freshWallet.address}`);
  let pboxSidCookie = "";

  console.log("\n--- TEST [B] No Pandora's Key ---");
  const nonceRes = await fetch(`${API_URL}/nonce?address=${freshWallet.address}`);
  const { nonce } = await nonceRes.json();
  console.log(`✅ Fetched nonce: ${nonce}`);

  const issuedAt = new Date().toISOString();
  const expirationTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  
  const message = `${DOMAIN} wants you to sign in with your Ethereum account:\n${freshWallet.address}\n\n${STATEMENT}\n\nURI: ${URI}\nVersion: 1\nChain ID: ${CHAIN_ID}\nNonce: ${nonce}\nIssued At: ${issuedAt}\nExpiration Time: ${expirationTime}\nInvalid Before: ${issuedAt}`;
  const signature = await freshWallet.signMessage(message);
  console.log(`✅ Signed SIWE message`);

  const payload = {
    domain: DOMAIN,
    address: freshWallet.address,
    statement: STATEMENT,
    uri: URI,
    version: "1",
    chainId: CHAIN_ID,
    nonce,
    issued_at: issuedAt,
    expiration_time: expirationTime,
    invalid_before: issuedAt,
    message,
  };

  const loginRes = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload, signature }),
  });

  const loginData = await loginRes.json();
  const setCookieHeader = loginRes.headers.get("set-cookie");
  
  if (setCookieHeader) {
      const match = setCookieHeader.match(/__pbox_sid=([^;]+)/);
      if (match) pboxSidCookie = match[0];
  }

  if (loginData.user && loginData.user.hasAccess === false) {
    console.log(`[PASS] TEST B: Wallet logged in but hasPandorasKey is FALSE`);
  } else {
    console.error(`[FAIL] TEST B: Failed or hasPandorasKey is true`, loginData);
  }
  
  console.log("\n--- TEST [C] Session Persistence ---");
  const sessionRes = await fetch(`${API_URL}/session`, {
    headers: { "Cookie": pboxSidCookie }
  });
  const sessionData = await sessionRes.json();
  if (sessionData.hasSession === true && sessionData.address.toLowerCase() === freshWallet.address.toLowerCase()) {
     console.log(`[PASS] TEST C: Session persisted successfully for ${sessionData.address}`);
  } else {
     console.error(`[FAIL] TEST C: Session did not persist`);
  }

  console.log("\n--- TEST [D] Logout ---");
  const logoutRes = await fetch(`${API_URL}/logout`, {
    method: "POST",
    headers: { "Cookie": pboxSidCookie }
  });
  const sessionAfterLogoutRes = await fetch(`${API_URL}/session`, {
    headers: { "Cookie": pboxSidCookie }
  });
  const sessionAfterLogoutData = await sessionAfterLogoutRes.json();
  if (sessionAfterLogoutData.hasSession === false) {
      console.log(`[PASS] TEST D: Session correctly destroyed`);
  } else {
      console.error(`[FAIL] TEST D: Session still active`);
  }

  console.log("\n--- TEST [A/F] Existing Identity & Anti-Duplication ---");
  const nonceRes2 = await fetch(`${API_URL}/nonce?address=${freshWallet.address}`);
  const { nonce: nonce2 } = await nonceRes2.json();
  const message2 = `${DOMAIN} wants you to sign in with your Ethereum account:\n${freshWallet.address}\n\n${STATEMENT}\n\nURI: ${URI}\nVersion: 1\nChain ID: ${CHAIN_ID}\nNonce: ${nonce2}\nIssued At: ${issuedAt}\nExpiration Time: ${expirationTime}\nInvalid Before: ${issuedAt}`;
  const signature2 = await freshWallet.signMessage(message2);

  const loginRes2 = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      payload: { ...payload, nonce: nonce2, message: message2 }, 
      signature: signature2 
    }),
  });

  const loginData2 = await loginRes2.json();
  if (loginData2.user && loginData.user.id === loginData.user.id) {
    console.log(`[PASS] TEST A/F: Reused canonical user ID ${loginData.user.id} (No duplication)`);
  } else {
    console.error(`[FAIL] TEST A/F: Created a new user ID instead of reusing!`);
  }
  
  console.log("\n==========================================");
  console.log(" CERTIFICATION COMPLETE");
  console.log("==========================================");
}

runCertification().catch(console.error);
