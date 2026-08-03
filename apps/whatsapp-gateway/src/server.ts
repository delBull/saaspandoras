import express from 'express';
import cors from 'cors';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import * as QRCode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3100;
const SESSIONS_DIR = path.join(__dirname, '../sessions');

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// In-memory session tracking
interface SessionData {
  sock: any;
  status: 'connected' | 'pending_qr' | 'disconnected' | 'reconnecting';
  qr: string | null;
  phoneNumber?: string;
  deviceName?: string;
  lastHeartbeat?: string;
  reconnectAttempts: number;
  qrExpiresAt?: string;
}

const sessions = new Map<string, SessionData>();

// Helper to update session state
function updateSession(id: string, updates: Partial<SessionData>) {
  const existing = sessions.get(id) || {
    sock: null,
    status: 'disconnected',
    qr: null,
    reconnectAttempts: 0
  };
  sessions.set(id, { ...existing, ...updates });
}

async function startBaileysSession(sessionId: string) {
  const sessionPath = path.join(SESSIONS_DIR, sessionId);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }) as any,
    printQRInTerminal: false,
    auth: state,
    browser: ['Pandoras Hermes Gateway', 'Chrome', '1.0.0']
  });

  updateSession(sessionId, { sock, status: 'pending_qr', qr: null });

  sock.ev.on('connection.update', async (update: any) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        const qrDataUrl = await QRCode.toDataURL(qr);
        updateSession(sessionId, { qr: qrDataUrl, status: 'pending_qr', lastHeartbeat: new Date().toISOString() });
      } catch (err) {
        console.error('QR Generate Error', err);
      }
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`Session ${sessionId} connection closed. Reconnecting: ${shouldReconnect}`);
      
      const current = sessions.get(sessionId);
      if (shouldReconnect) {
        updateSession(sessionId, { 
          status: 'reconnecting', 
          reconnectAttempts: (current?.reconnectAttempts || 0) + 1 
        });
        setTimeout(() => startBaileysSession(sessionId), 3000);
      } else {
        updateSession(sessionId, { status: 'disconnected', sock: null, qr: null });
        if (fs.existsSync(sessionPath)) {
          fs.rmSync(sessionPath, { recursive: true, force: true });
        }
      }
    } else if (connection === 'open') {
      console.log(`Session ${sessionId} connected!`);
      const user = sock.user;
      updateSession(sessionId, {
        status: 'connected',
        qr: null,
        reconnectAttempts: 0,
        phoneNumber: user?.id?.split(':')[0],
        deviceName: user?.name,
        lastHeartbeat: new Date().toISOString()
      });
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Incoming messages Webhook to Hermes Dashboard Runtime
  sock.ev.on('messages.upsert', async (m: any) => {
    if (m.type === 'notify') {
      for (const msg of m.messages) {
        if (!msg.key.fromMe && msg.message) {
           // Push to Hermes Runtime Webhook
           // E.g., POST http://localhost:3000/api/v1/tenant/${sessionId}/inbound/whatsapp
           // The dashboard url should be configurable. For now we just log.
           console.log(`[${sessionId}] Inbound message from ${msg.key.remoteJid}: `, msg.message);
        }
      }
    }
  });
}

// REST API
app.post('/sessions', async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

  if (!sessions.has(sessionId)) {
    await startBaileysSession(sessionId);
  }
  
  // Wait a bit for QR or connection state
  await new Promise(resolve => setTimeout(resolve, 1000));
  const session = sessions.get(sessionId);

  res.json({
    sessionId,
    status: session?.status || 'disconnected',
    qr: session?.qr,
    phoneNumber: session?.phoneNumber,
    lastHeartbeat: session?.lastHeartbeat
  });
});

app.get('/sessions/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Not found' });
  
  res.json({
    sessionId: req.params.id,
    status: session.status,
    qr: session.qr,
    phoneNumber: session.phoneNumber,
    deviceName: session.deviceName,
    lastHeartbeat: session.lastHeartbeat,
    reconnectAttempts: session.reconnectAttempts
  });
});

app.delete('/sessions/:id', async (req, res) => {
  const sessionId = req.params.id;
  const session = sessions.get(sessionId);
  if (session?.sock) {
    session.sock.logout();
  }
  const sessionPath = path.join(SESSIONS_DIR, sessionId);
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
  }
  sessions.delete(sessionId);
  res.json({ success: true });
});

app.post('/messages', async (req, res) => {
  const { sessionId, to, text } = req.body;
  const session = sessions.get(sessionId);
  if (!session || session.status !== 'connected' || !session.sock) {
    return res.status(400).json({ error: 'Session not connected' });
  }

  try {
    const sentMsg = await session.sock.sendMessage(to, { text });
    res.json({ success: true, id: sentMsg?.key?.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`WhatsApp Gateway Bridge listening on port ${PORT}`);
});
