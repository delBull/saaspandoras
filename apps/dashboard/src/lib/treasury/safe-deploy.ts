import {
  createPublicClient,
  http,
  encodeFunctionData,
  parseAbi,
  keccak256,
  encodeAbiParameters,
  getAddress,
  toHex,
  concat,
  slice,
  type Log,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, base } from "viem/chains";

const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
const SAFE_SINGLETON = "0x41675C099F32341bf84BFc5382aF534df5C7461a";
const SAFE_PROXY_FACTORY = "0xC22834581EbC8527d974F8a1c97E1bEA4EF910BC";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const PROXY_CREATION_EVENT = keccak256(toHex("ProxyCreation(address,address)"));

const MULTICALL3_ABI = parseAbi([
  "struct Call { address target; bytes callData; }",
  "struct Result { bool success; bytes returnData; }",
  "function aggregate(Call[] calls) payable returns (uint256 blockNumber, bytes[] returnData)",
  "function tryAggregate(bool requireSuccess, Call[] calls) payable returns (Result[] returnData)",
]);

const PROXY_FACTORY_ABI = parseAbi([
  "function createProxyWithNonce(address _singleton, bytes memory initializer, uint256 saltNonce) returns (address proxy)",
  "function proxyCreationCode() pure returns (bytes memory)",
]);

const SAFE_ABI = parseAbi([
  "function setup(address[] _owners, uint256 _threshold, address to, bytes data, address fallbackHandler, address paymentToken, uint256 payment, address paymentReceiver)",
]);

function getViemChain() {
  return process.env.NODE_ENV === 'production' ? base : sepolia;
}

function getPrivateKey(): `0x${string}` {
  const key = process.env.PROTOCOL_ADMIN_PRIVATE_KEY;
  if (!key) throw new Error("Protocol admin private key not configured");
  return (key.startsWith('0x') ? key : `0x${key}`) as `0x${string}`;
}

function getAdminAccount() {
  return privateKeyToAccount(getPrivateKey());
}

function buildSetupData(owners: `0x${string}`[], threshold: bigint): `0x${string}` {
  return encodeFunctionData({
    abi: SAFE_ABI,
    functionName: "setup",
    args: [
      owners,
      threshold,
      ZERO_ADDRESS,
      "0x" as `0x${string}`,
      ZERO_ADDRESS as `0x${string}`,
      ZERO_ADDRESS as `0x${string}`,
      0n,
      ZERO_ADDRESS as `0x${string}`,
    ],
  });
}

async function computeSafeAddress(
  setupData: `0x${string}`,
  saltNonce: bigint,
): Promise<string | null> {
  try {
    const chain = getViemChain();
    const publicClient = createPublicClient({ chain, transport: http() });
    const creationCode = await publicClient.readContract({
      address: SAFE_PROXY_FACTORY as `0x${string}`,
      abi: PROXY_FACTORY_ABI,
      functionName: "proxyCreationCode",
    }) as `0x${string}`;

    const singletonArg = encodeAbiParameters(
      [{ type: 'address' }],
      [SAFE_SINGLETON as `0x${string}`]
    );
    const initCode = concat([creationCode, singletonArg]) as `0x${string}`;

    const salt = keccak256(
      concat([
        SAFE_SINGLETON as `0x${string}`,
        setupData,
        toHex(saltNonce, { size: 32 }),
      ])
    );

    const raw = concat([
      "0xff" as `0x${string}`,
      SAFE_PROXY_FACTORY as `0x${string}`,
      salt,
      keccak256(initCode),
    ]);

    const hash = keccak256(raw);
    return getAddress(`0x${hash.slice(26)}`) as `0x${string}`;
  } catch {
    return null;
  }
}

function extractAddressFromTopic(topic: `0x${string}`): `0x${string}` {
  return getAddress(`0x${topic.slice(26)}`) as `0x${string}`;
}

export interface DeploySafeResult {
  ok: true;
  safeAddress: string;
  txHash: string;
  computedAddress: string;
  match: boolean;
}

export interface DeploySafeError {
  ok: false;
  error: string;
}

export async function deploySafeViaMulticall(
  owners?: `0x${string}`[],
  threshold?: bigint,
): Promise<DeploySafeResult | DeploySafeError> {
  try {
    const adminAccount = getAdminAccount();
    const chain = getViemChain();
    const publicClient = createPublicClient({ chain, transport: http() });

    const safeOwners = owners ?? [adminAccount.address] as `0x${string}`[];
    const safeThreshold = threshold ?? 1n;
    const setupData = buildSetupData(safeOwners, safeThreshold);
    const adminNonce = await publicClient.getTransactionCount({ address: adminAccount.address });
    const saltNonce = BigInt(keccak256(encodeAbiParameters(
      [{ type: 'address' }, { type: 'uint256' }, { type: 'uint256' }],
      [adminAccount.address, BigInt(adminNonce), BigInt(Date.now())],
    )));

    const factoryData = encodeFunctionData({
      abi: PROXY_FACTORY_ABI,
      functionName: "createProxyWithNonce",
      args: [SAFE_SINGLETON as `0x${string}`, setupData, saltNonce],
    });

    const multicallData = encodeFunctionData({
      abi: MULTICALL3_ABI,
      functionName: "aggregate",
      args: [[{ target: SAFE_PROXY_FACTORY as `0x${string}`, callData: factoryData }]],
    });

    const gas = await publicClient.estimateGas({
      account: adminAccount,
      to: MULTICALL3_ADDRESS as `0x${string}`,
      data: multicallData,
    });

    const fee = await publicClient.estimateFeesPerGas();
    const nonce = await publicClient.getTransactionCount({ address: adminAccount.address });
    const cid = await publicClient.getChainId();

    const signedTx = await adminAccount.signTransaction({
      to: MULTICALL3_ADDRESS as `0x${string}`,
      data: multicallData,
      gas,
      maxFeePerGas: fee.maxFeePerGas,
      maxPriorityFeePerGas: fee.maxPriorityFeePerGas,
      nonce,
      chainId: cid,
    });

    const txHash = await publicClient.sendRawTransaction({ serializedTransaction: signedTx });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status !== 'success') {
      return { ok: false, error: `Safe deploy transaction reverted. Hash: ${txHash}` };
    }

    const proxyLog = receipt.logs.find(
      (log: Log) =>
        log.address.toLowerCase() === SAFE_PROXY_FACTORY.toLowerCase() &&
        log.topics[0] === PROXY_CREATION_EVENT,
    );

    const computedAddress = await computeSafeAddress(setupData, saltNonce);

    if (!proxyLog || !proxyLog.topics[1]) {
      if (!computedAddress) {
        return { ok: false, error: "Safe deployed but could not determine address from event or CREATE2 computation" };
      }
      return {
        ok: true,
        safeAddress: computedAddress,
        txHash: receipt.transactionHash,
        computedAddress,
        match: true,
      };
    }

    const safeAddress = extractAddressFromTopic(proxyLog.topics[1] as `0x${string}`);

    return {
      ok: true,
      safeAddress,
      txHash: receipt.transactionHash,
      computedAddress: computedAddress ?? safeAddress,
      match: computedAddress ? safeAddress.toLowerCase() === computedAddress.toLowerCase() : true,
    };
  } catch (e: any) {
    return { ok: false, error: `Safe deploy via Multicall3 failed: ${e.message}` };
  }
}
