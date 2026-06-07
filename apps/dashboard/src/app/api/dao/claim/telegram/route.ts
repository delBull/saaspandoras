import { NextResponse } from "next/server";
import { db } from "~/db";
import { users, daoMembers, projects, userBalances } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { validateTelegramInitData } from "~/lib/telegram";
import {
  lockWithdrawal,
  executeTransfer,
  settleWithdrawal,
} from "~/lib/treasury/withdraw";

export async function POST(req: Request) {
  try {
    const { initData, projectId } = await req.json();

    if (!initData || !projectId) {
      return NextResponse.json(
        { message: "Faltan parámetros requeridos (initData, projectId)" },
        { status: 400 }
      );
    }

    // 1. Validar la identidad de Telegram (Autenticación sin fricción)
    const authResult = validateTelegramInitData(initData);
    if (!authResult.isValid || !authResult.user?.id) {
      return NextResponse.json(
        { message: "Autenticación de Telegram inválida o expirada" },
        { status: 401 }
      );
    }

    const telegramId = authResult.user.id.toString();

    // 2. Buscar el usuario vinculado en la DB
    const userRow = await db.query.users.findFirst({
      where: eq(users.telegramId, telegramId),
    });

    if (!userRow || !userRow.walletAddress) {
      return NextResponse.json(
        { message: "No tienes una wallet Web3 vinculada a tu cuenta de Telegram. Vincula tu wallet primero en tu Perfil." },
        { status: 403 }
      );
    }

    const walletAddress = userRow.walletAddress;

    // 3. Buscar el balance y nonce actual del usuario
    const userBalanceRecord = await db.query.userBalances.findFirst({
      where: eq(userBalances.walletAddress, walletAddress.toLowerCase()),
    });

    if (!userBalanceRecord || parseFloat(userBalanceRecord.usdcBalance) <= 0) {
      return NextResponse.json(
        { message: "No tienes USDC disponibles para reclamar" },
        { status: 400 }
      );
    }

    const amountStr = userBalanceRecord.usdcBalance;
    const currentNonce = userBalanceRecord.nonce;

    // Generar una firma interna (trust) basada en la autenticación de Telegram
    const internalSignature = `telegram_auth_${telegramId}_${Date.now()}`;

    // 4. Iniciar Phase 1 (DB Lock)
    const lockRes = await lockWithdrawal(
      walletAddress,
      projectId,
      amountStr,
      currentNonce,
      internalSignature
    );

    if (!lockRes.ok) {
      // Generalmente indica que el balance no existe, o hubo un race condition
      return NextResponse.json(
        { message: lockRes.error },
        { status: 400 }
      );
    }

    // 5. Iniciar Phase 2a (Blockchain Execution)
    // El backend realiza el retiro on-chain hacia la wallet vinculada del usuario
    const execRes = await executeTransfer(walletAddress, amountStr);

    // 6. Iniciar Phase 2b (Settle)
    if (execRes.ok) {
      await settleWithdrawal(
        lockRes.withdrawalId,
        walletAddress,
        amountStr,
        'completed',
        execRes.txHash
      );
      
      return NextResponse.json({
        message: "Reclamo exitoso",
        txHash: execRes.txHash,
        amount: amountStr,
      });
    } else {
      await settleWithdrawal(
        lockRes.withdrawalId,
        walletAddress,
        amountStr,
        'failed',
        undefined,
        execRes.error
      );
      
      return NextResponse.json(
        { message: `Error on-chain: ${execRes.error}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Telegram Claim Error:", error);
    return NextResponse.json(
      { message: "Error interno procesando el reclamo" },
      { status: 500 }
    );
  }
}
