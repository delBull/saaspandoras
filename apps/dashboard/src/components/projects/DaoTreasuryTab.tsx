'use client';

import { useState, useEffect, useCallback } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { toast } from 'sonner';

interface DaoTreasuryTabProps {
  project: any;
}

type TransferStep = 'idle' | 'nominate' | 'accept';

export function DaoTreasuryTab({ project }: DaoTreasuryTabProps) {
  const account = useActiveAccount();

  const [controllerInfo, setControllerInfo] = useState<{
    address: string;
    balance: string;
    dailyLimit: string;
    spentToday: string;
    remaining: string;
    owner: string;
    pendingOwner: string;
    delegate: string;
  } | null>(null);

  const [safeAddress, setSafeAddress] = useState(project.allowanceControllerAddress || '');
  const [controllerAddress, setControllerAddress] = useState('');
  const [pendingRewards, setPendingRewards] = useState<{
    total: string;
    count: number;
    nonce: number;
    usdcBalance: string;
  } | null>(null);

  const [deployingSafe, setDeployingSafe] = useState(false);
  const [deployingController, setDeployingController] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawTo, setWithdrawTo] = useState('');
  const [preparingWithdraw, setPreparingWithdraw] = useState(false);
  const [broadcastingWithdraw, setBroadcastingWithdraw] = useState(false);
  const [preparedWithdraw, setPreparedWithdraw] = useState<any>(null);
  const [withdrawResult, setWithdrawResult] = useState<string | null>(null);

  // Transfer ownership (two-step)
  const [transferStep, setTransferStep] = useState<TransferStep>('idle');
  const [preparingTransfer, setPreparingTransfer] = useState(false);
  const [preparedTransfer, setPreparedTransfer] = useState<any>(null);
  const [broadcastingTransfer, setBroadcastingTransfer] = useState(false);

  // Modal toggle
  const [showGuide, setShowGuide] = useState<'transfer' | 'rescue' | null>(null);

  const fetchControllerInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/dao/controller-info?projectId=${project.id}`);
      if (res.ok) {
        const data = await res.json();
        if (!data.error) setControllerInfo(data);
      }
    } catch {}
  }, [project.id]);

  const fetchPendingRewards = useCallback(async () => {
    if (!account?.address) return;
    try {
      const res = await fetch(`/api/dao/rewards?address=${account.address}&projectId=${project.id}`);
      if (res.ok) {
        const data = await res.json();
        setPendingRewards(data);
      }
    } catch {}
  }, [account?.address, project.id]);

  useEffect(() => {
    fetchControllerInfo();
    fetchPendingRewards();
  }, [fetchControllerInfo, fetchPendingRewards]);

  const handleDeploySafe = async () => {
    if (!account?.address) return toast.error('Connect wallet first');
    setDeployingSafe(true);
    try {
      const res = await fetch('/api/dao/deploy-safe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSafeAddress(data.safeAddress);
      toast.success(`Safe deployed: ${data.safeAddress.slice(0, 10)}...`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeployingSafe(false);
    }
  };

  const handleDeployController = async () => {
    if (!account?.address) return toast.error('Connect wallet first');
    setDeployingController(true);
    try {
      const res = await fetch('/api/dao/deploy-controller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, ownerAddress: account.address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setControllerAddress(data.controllerAddress);
      toast.success(`Controller deployed: ${data.controllerAddress.slice(0, 10)}...`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeployingController(false);
    }
  };

  const handleClaim = async () => {
    if (!account?.address || !pendingRewards || pendingRewards.count === 0) return;

    setClaiming(true);
    try {
      const message = `Claim ${pendingRewards.total} USDC rewards | Project ${project.id} | Nonce ${pendingRewards.nonce}`;
      const signature = await account.signMessage({ message });

      const res = await fetch('/api/dao/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: account.address,
          projectId: project.id,
          walletSignature: signature,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Claimed ${data.amount} USDC`);
      setPendingRewards(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setClaiming(false);
    }
  };

  const handlePrepareWithdraw = async () => {
    if (!account?.address) return toast.error('Connect wallet first');
    if (!withdrawTo || !withdrawAmount) return toast.error('Enter recipient and amount');

    setPreparingWithdraw(true);
    setPreparedWithdraw(null);
    setWithdrawResult(null);

    try {
      const res = await fetch('/api/dao/owner-withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          mode: 'prepare',
          amount: withdrawAmount,
          to: withdrawTo,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreparedWithdraw(data);
      toast.success('Transaction prepared — review and sign in your wallet');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPreparingWithdraw(false);
    }
  };

  const handleBroadcastWithdraw = async () => {
    if (!account?.address || !preparedWithdraw) return;

    setBroadcastingWithdraw(true);
    try {
      const raw = preparedWithdraw.tx;
      const result = await account.sendTransaction({
        to: raw.to,
        data: raw.data,
        value: 0n,
        gas: BigInt(raw.gas),
        maxFeePerGas: BigInt(raw.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(raw.maxPriorityFeePerGas),
        nonce: raw.nonce,
        chainId: raw.chainId as number,
      });

      const txHash = typeof result === 'string' ? result : result.transactionHash;
      setWithdrawResult(`Broadcasted! TX: ${txHash}`);
      toast.success(`Withdraw broadcasted: ${txHash.slice(0, 14)}...`);
      fetchControllerInfo();
    } catch (e: any) {
      toast.error(e.message || 'Transaction rejected');
    } finally {
      setBroadcastingWithdraw(false);
    }
  };

  // ── Transfer ownership (two-step) ────────────────────────────────────
  const handlePrepareTransfer = async () => {
    if (!account?.address) return toast.error('Connect wallet first');
    setPreparingTransfer(true);
    setTransferStep('idle');
    try {
      const res = await fetch('/api/dao/controller-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.step === 'done') {
        toast.success('Already owned by Safe');
        fetchControllerInfo();
        return;
      }
      if (data.step === 'accept') {
        setTransferStep('accept');
        setPreparedTransfer(data);
        toast.success('Safe is nominated — ready for Step 2');
        return;
      }
      // step === 'nominate'
      setTransferStep('nominate');
      setPreparedTransfer(data);
      toast.success('Transfer prepared — sign in wallet');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPreparingTransfer(false);
    }
  };

  const handleBroadcastTransfer = async () => {
    if (!account?.address || !preparedTransfer) return;
    setBroadcastingTransfer(true);
    try {
      const raw = preparedTransfer.tx;
      const result = await account.sendTransaction({
        to: raw.to,
        data: raw.data,
        value: 0n,
        gas: BigInt(raw.gas),
        maxFeePerGas: BigInt(raw.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(raw.maxPriorityFeePerGas),
        nonce: raw.nonce,
        chainId: raw.chainId as number,
      });

      const txHash = typeof result === 'string' ? result : result.transactionHash;
      toast.success(`Nomination broadcasted: ${txHash.slice(0, 14)}...`);
      setPreparedTransfer(null);
      setTransferStep('idle');
      // Refetch — should show pendingOwner now
      setTimeout(fetchControllerInfo, 2000);
    } catch (e: any) {
      toast.error(e.message || 'Transaction rejected');
    } finally {
      setBroadcastingTransfer(false);
    }
  };

  const currentOwner = controllerInfo?.owner ?? '';
  const pendingOwner = controllerInfo?.pendingOwner ?? '';
  const isOwner = account?.address && currentOwner.toLowerCase() === account.address.toLowerCase();
  const isPendingSafe = pendingOwner && safeAddress && pendingOwner.toLowerCase() === safeAddress.toLowerCase();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">DAO Treasury</h2>
        {account?.address && (
          <span className="text-sm text-zinc-500 font-mono">
            {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </span>
        )}
      </div>

      {/* Controller Status */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">AllowanceController</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-800/30 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-1">Address</p>
            <p className="text-sm text-white font-mono truncate">
              {controllerAddress || project.allowanceControllerAddress || 'Not deployed'}
            </p>
          </div>
          <div className="bg-zinc-800/30 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-1">Balance</p>
            <p className="text-xl text-emerald-400 font-bold">
              {controllerInfo ? `${controllerInfo.balance} USDC` : '...'}
            </p>
          </div>
          <div className="bg-zinc-800/30 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-1">Daily Limit</p>
            <p className="text-xl text-white font-bold">
              {controllerInfo ? `${controllerInfo.dailyLimit} USDC` : '...'}
            </p>
          </div>
          <div className="bg-zinc-800/30 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-1">Spent Today</p>
            <p className="text-xl text-yellow-400 font-bold">
              {controllerInfo ? `${controllerInfo.spentToday} USDC` : '...'}
            </p>
          </div>
        </div>
        {/* Owner + Pending Owner status */}
        {controllerInfo && (
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="bg-zinc-800/20 rounded-lg px-3 py-1.5">
              <span className="text-zinc-500">Owner: </span>
              <span className="text-white font-mono">{controllerInfo.owner.slice(0, 8)}...{controllerInfo.owner.slice(-4)}</span>
            </div>
            {controllerInfo.pendingOwner && controllerInfo.pendingOwner !== '0x0000000000000000000000000000000000000000' && (
              <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg px-3 py-1.5">
                <span className="text-amber-400">⏳ Pending Owner: </span>
                <span className="text-amber-200 font-mono">{controllerInfo.pendingOwner.slice(0, 8)}...{controllerInfo.pendingOwner.slice(-4)}</span>
                <span className="text-amber-400 ml-2">(awaiting accept)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deploy Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-3">
          <h3 className="text-lg font-bold text-white">
            Safe Multisig
            {safeAddress && <span className="text-emerald-400 text-sm ml-2">✅</span>}
          </h3>
          <p className="text-sm text-zinc-400">
            Deploy a Safe multisig wallet for this project. The Safe can become the owner of the AllowanceController.
          </p>
          {safeAddress ? (
            <p className="text-xs text-zinc-500 font-mono bg-zinc-800/30 rounded-lg p-2 truncate">
              {safeAddress}
            </p>
          ) : (
            <button
              onClick={handleDeploySafe}
              disabled={deployingSafe}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 text-white rounded-xl font-bold text-sm transition-colors"
            >
              {deployingSafe ? 'Deploying...' : 'Deploy Safe'}
            </button>
          )}
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-3">
          <h3 className="text-lg font-bold text-white">
            Project Controller
            {(controllerAddress || project.allowanceControllerAddress) && (
              <span className="text-emerald-400 text-sm ml-2">✅</span>
            )}
          </h3>
          <p className="text-sm text-zinc-400">
            Deploy a per-project AllowanceController. You will be the owner and the admin wallet is the delegate.
          </p>
          <button
            onClick={handleDeployController}
            disabled={deployingController || !!project.allowanceControllerAddress}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white rounded-xl font-bold text-sm transition-colors"
          >
            {project.allowanceControllerAddress
              ? 'Deployed'
              : deployingController
                ? 'Deploying...'
                : 'Deploy Controller'}
          </button>
        </div>
      </div>

      {/* Transfer Ownership (two-step) */}
      {safeAddress && (controllerAddress || project.allowanceControllerAddress) && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Transfer Ownership to Safe</h3>
            <button
              onClick={() => setShowGuide(showGuide === 'transfer' ? null : 'transfer')}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              {showGuide === 'transfer' ? '▲ Hide guide' : '▼ How this works'}
            </button>
          </div>

          {/* Guide modal / toggle */}
          {showGuide === 'transfer' && (
            <div className="bg-blue-950/30 border border-blue-800/50 rounded-xl p-4 space-y-3 text-sm">
              <h4 className="font-bold text-blue-300">How ownership transfer works</h4>
              <div className="space-y-2 text-zinc-300">
                <p><span className="text-blue-400 font-bold">Step 1 — Nominate:</span> The current owner calls <code className="text-emerald-400">transferOwnership(Safe)</code>. This nominates the Safe as the new owner. The current owner <strong>does not lose any powers yet</strong>.</p>
                <p><span className="text-blue-400 font-bold">Step 2 — Accept:</span> The Safe calls <code className="text-emerald-400">acceptOwnership()</code>. This completes the transfer. Only the nominated Safe can call this.</p>
                <p className="text-xs text-zinc-500 mt-2">💡 The current owner can cancel any time before Step 2 by nominating a different address (including themselves).</p>
              </div>
            </div>
          )}

          {/* Step 1: Nominate */}
          {transferStep !== 'accept' && (
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-bold text-sm">Step 1</span>
                <span className="text-zinc-400 text-sm">— Nominate Safe as pending owner</span>
                {isPendingSafe && <span className="text-amber-400 text-xs ml-auto">⏳ Pending</span>}
              </div>
              <p className="text-xs text-zinc-400">
                Sign a transaction to nominate <code className="text-emerald-400 font-mono">{safeAddress.slice(0, 8)}...{safeAddress.slice(-4)}</code> as the new owner.
                {isOwner && ' You are the current owner.'}
              </p>

              {!preparedTransfer && (
                <button
                  onClick={handlePrepareTransfer}
                  disabled={preparingTransfer || !isOwner}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 text-white rounded-lg font-bold text-sm transition-colors"
                >
                  {preparingTransfer ? 'Preparing...' : isOwner ? 'Prepare Nomination' : 'Connect as owner to nominate'}
                </button>
              )}

              {preparedTransfer && preparedTransfer.tx && (
                <div className="space-y-3">
                  <div className="bg-zinc-900 rounded-lg p-3 space-y-1 text-xs font-mono">
                    <p className="text-zinc-400">Controller: <span className="text-white">{preparedTransfer.controllerAddress}</span></p>
                    <p className="text-zinc-400">Nominate: <span className="text-white">{preparedTransfer.newOwner || safeAddress}</span></p>
                    <p className="text-zinc-400">Nonce: <span className="text-white">{preparedTransfer.tx.nonce}</span></p>
                    <p className="text-zinc-400">Gas: <span className="text-white">{preparedTransfer.tx.gas}</span></p>
                  </div>
                  <button
                    onClick={handleBroadcastTransfer}
                    disabled={broadcastingTransfer}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 text-white rounded-lg font-bold text-sm transition-colors"
                  >
                    {broadcastingTransfer ? 'Broadcasting...' : 'Sign & Broadcast in Wallet'}
                  </button>
                  <button
                    onClick={() => { setPreparedTransfer(null); setTransferStep('idle'); }}
                    className="w-full py-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Accept */}
          {(transferStep === 'accept' || isPendingSafe) && (
            <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-sm">Step 2</span>
                <span className="text-zinc-400 text-sm">— Accept ownership from Safe</span>
              </div>
              <p className="text-xs text-zinc-400">
                The Safe has been nominated. Go to your Safe multisig interface and execute a transaction calling{' '}
                <code className="text-emerald-400">acceptOwnership()</code> on the AllowanceController at{' '}
                <code className="text-zinc-300 font-mono text-xs break-all">{controllerAddress || project.allowanceControllerAddress}</code>.
              </p>
              <div className="bg-zinc-900 rounded-lg p-3 text-xs font-mono space-y-1">
                <p className="text-zinc-400">Contract to call:</p>
                <p className="text-white break-all">{controllerAddress || project.allowanceControllerAddress}</p>
                <p className="text-zinc-400 mt-1">Method:</p>
                <p className="text-emerald-400">acceptOwnership()</p>
                <p className="text-zinc-400 mt-1">Calldata:</p>
                <p className="text-zinc-300 break-all">{preparedTransfer?.acceptTx?.data || '0xe96b6566' /* acceptOwnership() sig */}</p>
              </div>
              <p className="text-xs text-zinc-500">
                💡 Only the nominated Safe can call this. After successful execution, refresh to confirm.
              </p>
              <button
                onClick={fetchControllerInfo}
                className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-bold text-sm transition-colors"
              >
                Refresh Status
              </button>
            </div>
          )}

          {/* Already done */}
          {currentOwner && safeAddress && currentOwner.toLowerCase() === safeAddress.toLowerCase() && (
            <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-xl p-4 text-center">
              <p className="text-emerald-400 font-bold text-sm">✅ Ownership transferred to Safe</p>
            </div>
          )}
        </div>
      )}

      {/* Controller Operations — Owner Withdraw */}
      {(controllerAddress || project.allowanceControllerAddress) && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Controller Operations</h3>
          <p className="text-sm text-zinc-400">
            Manage funds inside the AllowanceController. The Owner can withdraw USDC without daily limit.
          </p>

          <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4 space-y-4">
            <h4 className="font-bold text-red-400">Owner Withdraw</h4>
            <p className="text-xs text-zinc-400">
              Withdraw USDC directly from the AllowanceController. Only the contract owner can execute this.
            </p>

            {!preparedWithdraw && !withdrawResult && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Recipient address (0x...)"
                  value={withdrawTo}
                  onChange={(e) => setWithdrawTo(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 font-mono"
                />
                <input
                  type="number"
                  placeholder="Amount in USDC"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500"
                />
                <button
                  onClick={handlePrepareWithdraw}
                  disabled={preparingWithdraw || !withdrawAmount || !withdrawTo}
                  className="w-full py-2 bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 text-white rounded-lg font-bold text-sm transition-colors"
                >
                  {preparingWithdraw ? 'Preparing...' : 'Prepare Withdraw'}
                </button>
              </div>
            )}

            {preparedWithdraw && !withdrawResult && (
              <div className="space-y-3">
                <div className="bg-zinc-900 rounded-lg p-3 space-y-1 text-xs font-mono">
                  <p className="text-zinc-400">Controller: <span className="text-white">{preparedWithdraw.controllerAddress}</span></p>
                  <p className="text-zinc-400">Recipient: <span className="text-white">{preparedWithdraw.recipient}</span></p>
                  <p className="text-zinc-400">Amount: <span className="text-white">{preparedWithdraw.amount} USDC</span></p>
                  <p className="text-zinc-400">Nonce: <span className="text-white">{preparedWithdraw.tx.nonce}</span></p>
                  <p className="text-zinc-400">Gas: <span className="text-white">{preparedWithdraw.tx.gas}</span></p>
                </div>
                <button
                  onClick={handleBroadcastWithdraw}
                  disabled={broadcastingWithdraw}
                  className="w-full py-2 bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 text-white rounded-lg font-bold text-sm transition-colors"
                >
                  {broadcastingWithdraw ? 'Broadcasting...' : 'Sign & Broadcast in Wallet'}
                </button>
                <button
                  onClick={() => { setPreparedWithdraw(null); setWithdrawResult(null); setWithdrawAmount(''); setWithdrawTo(''); }}
                  className="w-full py-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {withdrawResult && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400 font-mono break-all">{withdrawResult}</p>
                <button
                  onClick={() => { setPreparedWithdraw(null); setWithdrawResult(null); setWithdrawAmount(''); setWithdrawTo(''); }}
                  className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-bold text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rescue Tokens — with security info */}
      {(controllerAddress || project.allowanceControllerAddress) && (
        <div className="bg-zinc-900/50 border border-amber-800/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Rescue Tokens</h3>
            <button
              onClick={() => setShowGuide(showGuide === 'rescue' ? null : 'rescue')}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
            >
              {showGuide === 'rescue' ? '▲ Hide guide' : '▼ Security info'}
            </button>
          </div>

          {showGuide === 'rescue' && (
            <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4 space-y-3 text-sm">
              <h4 className="font-bold text-amber-300">RescueERC20 — Security Model</h4>
              <div className="space-y-2 text-zinc-300">
                <p><span className="text-emerald-400">✅ Safe by default:</span> The Pool contracts block rescue of their own USDC (depositor funds). Only non-USDC tokens can be rescued.</p>
                <p><span className="text-amber-400">⚠️ Use with multisig:</span> For mainnet, the Pool owner should be a Safe multisig (not an EOA). This prevents a single compromised key from draining rescued tokens.</p>
                <p><span className="text-zinc-400">🔐 Recommended flow:</span> Transfer Pool ownership to Safe → Only Safe signers can execute rescue → Hardware wallet for Safe signers.</p>
                <p className="text-xs text-zinc-500 mt-2">This feature is read-only in the dashboard. Rescue execution requires a Safe multisig transaction.</p>
              </div>
            </div>
          )}

          <p className="text-sm text-zinc-400">
            If non-USDC tokens get stuck in the Pool, the admin can rescue them. USDC is permanently protected.
            Requires Pool ownership in a Safe multisig for secure execution.
          </p>

          <div className="bg-zinc-800/20 rounded-xl p-4 text-center">
            <p className="text-xs text-zinc-500">
              🔒 Token rescue is handled on-chain via Safe multisig. Use your Safe interface to call <code className="text-emerald-400">rescueERC20(token, to, amount)</code> on the Pool contract.
            </p>
          </div>
        </div>
      )}

      {/* Claim Rewards */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">Claim Rewards</h3>
        {!account?.address ? (
          <p className="text-sm text-zinc-500">Connect your wallet to see pending rewards</p>
        ) : pendingRewards && pendingRewards.count > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-4">
              <div>
                <p className="text-sm text-zinc-400">Pending Rewards</p>
                <p className="text-2xl text-emerald-400 font-bold">{pendingRewards.total} USDC</p>
                <p className="text-xs text-zinc-500">{pendingRewards.count} rewards</p>
              </div>
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white rounded-xl font-bold text-sm transition-colors"
              >
                {claiming ? 'Claiming...' : 'Claim All'}
              </button>
            </div>
            <p className="text-xs text-zinc-500">Balance: {pendingRewards.usdcBalance} USDC | Nonce: {pendingRewards.nonce}</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-zinc-500">No pending rewards</p>
            <p className="text-xs text-zinc-600 mt-1">Rewards appear here after a distribution is processed</p>
          </div>
        )}
      </div>
    </div>
  );
}
