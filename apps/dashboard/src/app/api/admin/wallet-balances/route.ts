import { NextResponse } from 'next/server';

const BASE_RPC = process.env.BASE_RPC_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || ''}`;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_ALERTS || process.env.DISCORD_WEBHOOK_PANDORAS_ALERTS;

// Wallets operacionales monitoreadas (direcciones públicas — sin secretos)
const MONITORED_WALLETS = [
  {
    label: 'Deployer',
    address: '0xC140730099c2D201D61dc931DE4536723E9F6b56',
    description: 'Despliega contratos de nuevos proyectos',
    icon: '🚀',
  },
  {
    label: 'Oracle',
    address: '0xDB798e90256C2FDD341ef525C9AFc48d9c7B90Fd',
    description: 'Oracle principal del protocolo',
    icon: '🔮',
  },
  {
    label: 'Admin / Relayer',
    address: '0x5aeaE3D13F480a4231dD09D873f5A094424A2ed6',
    description: 'Relay de transacciones sin gas',
    icon: '⚡',
  },
];

// Thresholds en ETH
const THRESHOLD_OPTIMAL = 0.05;   // >= 0.05 = verde
const THRESHOLD_WARNING = 0.01;   // >= 0.01 = amarillo + alerta Discord
// < 0.01 = rojo + alerta crítica Discord

async function getEthBalance(address: string): Promise<number> {
  const body = {
    jsonrpc: '2.0',
    method: 'eth_getBalance',
    params: [address, 'latest'],
    id: 1,
  };

  const res = await fetch(BASE_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    next: { revalidate: 60 }, // Cache 60s to avoid RPC spam
  });

  if (!res.ok) throw new Error(`RPC error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  // Convert hex wei → ETH
  const wei = BigInt(data.result);
  return Number(wei) / 1e18;
}

async function sendDiscordWalletAlert(
  wallet: typeof MONITORED_WALLETS[0],
  balanceEth: number,
  severity: 'warning' | 'critical'
) {
  if (!DISCORD_WEBHOOK) return;

  const isWarning = severity === 'warning';
  const color = isWarning ? 0xF59E0B : 0xEF4444; // amber or red
  const emoji = isWarning ? '🟡' : '🔴';
  const title = isWarning
    ? `${emoji} Wallet Baja — ${wallet.label}`
    : `${emoji} Wallet CRÍTICA — ${wallet.label}`;
  const description = isWarning
    ? `La wallet **${wallet.label}** tiene saldo bajo. Considera recargarla pronto para evitar interrupciones en los deploys.`
    : `⚠️ La wallet **${wallet.label}** está por debajo del mínimo operacional. **Los deploys de nuevos proyectos pueden fallar.**`;

  const payload = {
    username: 'Pandoras Infrastructure',
    avatar_url: 'https://dash.pandoras.finance/favicon.ico',
    embeds: [{
      title,
      description,
      color,
      fields: [
        { name: `${wallet.icon} Wallet`, value: wallet.label, inline: true },
        { name: '💰 Balance Actual', value: `\`${balanceEth.toFixed(6)} ETH\``, inline: true },
        { name: '📋 Dirección', value: `\`${wallet.address.slice(0, 10)}...${wallet.address.slice(-8)}\``, inline: false },
        { name: '🛡️ Umbral Mínimo', value: `\`${THRESHOLD_WARNING} ETH\``, inline: true },
        { name: '✅ Balance Óptimo', value: `\`${THRESHOLD_OPTIMAL} ETH\``, inline: true },
        { name: '🔗 Red', value: '**Base Mainnet** (Chain 8453)', inline: false },
        { name: '🎯 Acción Requerida', value: isWarning ? 'Recargar wallet antes de próximo deploy' : '**URGENTE:** Recargar inmediatamente para no bloquear operaciones', inline: false },
      ],
      footer: { text: `Pandoras Growth OS · Wallet Monitor · ${new Date().toISOString()}` },
      timestamp: new Date().toISOString(),
    }],
  };

  try {
    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[WalletMonitor] Discord alert failed:', err);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const triggerAlert = searchParams.get('alert') === 'true';

    const results = await Promise.allSettled(
      MONITORED_WALLETS.map(async (wallet) => {
        const balance = await getEthBalance(wallet.address);
        let status: 'optimal' | 'warning' | 'critical';
        if (balance >= THRESHOLD_OPTIMAL) {
          status = 'optimal';
        } else if (balance >= THRESHOLD_WARNING) {
          status = 'warning';
        } else {
          status = 'critical';
        }

        // Send Discord alerts if requested (called by cron or manual check)
        if (triggerAlert && (status === 'warning' || status === 'critical')) {
          await sendDiscordWalletAlert(wallet, balance, status);
        }

        return {
          label: wallet.label,
          address: wallet.address,
          description: wallet.description,
          icon: wallet.icon,
          balanceEth: balance,
          status,
          thresholds: {
            optimal: THRESHOLD_OPTIMAL,
            warning: THRESHOLD_WARNING,
          },
        };
      })
    );

    const wallets = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      console.error(`[WalletMonitor] Failed to fetch balance for ${MONITORED_WALLETS[i]?.label}:`, r.reason);
      return {
        label: MONITORED_WALLETS[i]?.label ?? 'Unknown',
        address: MONITORED_WALLETS[i]?.address ?? '',
        description: MONITORED_WALLETS[i]?.description ?? '',
        icon: MONITORED_WALLETS[i]?.icon ?? '❓',
        balanceEth: null,
        status: 'error' as const,
        thresholds: { optimal: THRESHOLD_OPTIMAL, warning: THRESHOLD_WARNING },
      };
    });

    return NextResponse.json({ wallets, checkedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[WalletMonitor] Unexpected error:', err);
    return NextResponse.json({ error: 'Failed to fetch wallet balances' }, { status: 500 });
  }
}
