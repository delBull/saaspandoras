'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageCircle, Send, CheckCircle2, AlertTriangle, Mail, Disc as DiscordIcon, UserCheck, Activity, Zap, RefreshCw } from 'lucide-react';
import { 
  getChannelsConfig, 
  saveTelegramConfig, 
  saveWhatsAppConfig, 
  getHandoffAlertConfig, 
  saveHandoffAlertConfig, 
  testTelegramConfig,
  testWhatsAppConfig,
  testHandoffAlert,
  HandoffAlertConfig 
} from './actions';
import { toast } from 'sonner';

export default function ChannelsDashboard({ organizationSlug }: { organizationSlug: string }) {
  const [telegramToken, setTelegramToken] = useState('');
  const [whatsappToken, setWhatsappToken] = useState('');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');
  
  // Handoff Alert State
  const [alertChannel, setAlertChannel] = useState<'email' | 'telegram' | 'whatsapp' | 'discord'>('email');
  const [alertEmail, setAlertEmail] = useState('');
  const [alertTgChatId, setAlertTgChatId] = useState('');
  const [alertWaPhone, setAlertWaPhone] = useState('');
  const [alertDiscordUrl, setAlertDiscordUrl] = useState('');

  const [loading, setLoading] = useState(true);
  const [savingTg, setSavingTg] = useState(false);
  const [savingWa, setSavingWa] = useState(false);
  const [savingAlert, setSavingAlert] = useState(false);

  // Testing States
  const [testingTg, setTestingTg] = useState(false);
  const [tgTestResult, setTgTestResult] = useState<any>(null);

  const [testingWa, setTestingWa] = useState(false);
  const [waTestResult, setWaTestResult] = useState<any>(null);

  const [testingAlert, setTestingAlert] = useState(false);

  useEffect(() => {
    Promise.all([
      getChannelsConfig(organizationSlug),
      getHandoffAlertConfig(organizationSlug)
    ]).then(([config, alertConfig]) => {
      if (config.telegramBotTokenMasked) setTelegramToken(config.telegramBotTokenMasked);
      if (config.whatsappTokenMasked) setWhatsappToken(config.whatsappTokenMasked);
      if (config.whatsappPhoneId) setWhatsappPhoneId(config.whatsappPhoneId);

      if (alertConfig) {
        setAlertChannel(alertConfig.preferredChannel || 'email');
        setAlertEmail(alertConfig.email || '');
        setAlertTgChatId(alertConfig.telegramChatId || '');
        setAlertWaPhone(alertConfig.whatsappPhone || '');
        setAlertDiscordUrl(alertConfig.discordWebhookUrl || '');
      }

      setLoading(false);
    }).catch(err => {
      toast.error('Error al cargar configuración');
      setLoading(false);
    });
  }, [organizationSlug]);

  const handleSaveTelegram = async () => {
    setSavingTg(true);
    try {
      await saveTelegramConfig(organizationSlug, telegramToken);
      toast.success('Configuración de Telegram guardada');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar Telegram');
    } finally {
      setSavingTg(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTg(true);
    setTgTestResult(null);
    try {
      const res = await testTelegramConfig(organizationSlug, telegramToken);
      setTgTestResult(res);
      toast.success(`✅ Telegram Bot verificado: @${res.bot.username} (${res.latency}ms)`);
    } catch (err: any) {
      toast.error(err.message || 'Fallo en la prueba de Telegram');
      setTgTestResult({ success: false, error: err.message });
    } finally {
      setTestingTg(false);
    }
  };

  const handleSaveWhatsApp = async () => {
    setSavingWa(true);
    try {
      await saveWhatsAppConfig(organizationSlug, whatsappToken, whatsappPhoneId);
      toast.success('Configuración de WhatsApp guardada');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar WhatsApp');
    } finally {
      setSavingWa(false);
    }
  };

  const handleTestWhatsApp = async () => {
    setTestingWa(true);
    setWaTestResult(null);
    try {
      const res = await testWhatsAppConfig(organizationSlug, whatsappToken, whatsappPhoneId);
      setWaTestResult(res);
      toast.success(`✅ WhatsApp Cloud API verificado: ${res.waba.displayPhoneNumber} (${res.latency}ms)`);
    } catch (err: any) {
      toast.error(err.message || 'Fallo en la prueba de WhatsApp');
      setWaTestResult({ success: false, error: err.message });
    } finally {
      setTestingWa(false);
    }
  };

  const handleSaveHandoffAlert = async () => {
    setSavingAlert(true);
    try {
      await saveHandoffAlertConfig(organizationSlug, {
        preferredChannel: alertChannel,
        email: alertEmail,
        telegramChatId: alertTgChatId,
        whatsappPhone: alertWaPhone,
        discordWebhookUrl: alertDiscordUrl,
      });
      toast.success('Canal de escalación humana guardado exitosamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar canal de escalación');
    } finally {
      setSavingAlert(false);
    }
  };

  const handleTestHandoffAlert = async () => {
    setTestingAlert(true);
    try {
      await testHandoffAlert(organizationSlug, {
        preferredChannel: alertChannel,
        email: alertEmail,
        telegramChatId: alertTgChatId,
        whatsappPhone: alertWaPhone,
        discordWebhookUrl: alertDiscordUrl,
      });
      toast.success(`✅ Notificación de prueba enviada exitosamente a ${alertChannel.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar alerta de prueba');
    } finally {
      setTestingAlert(false);
    }
  };

  if (loading) return <div className="p-8 text-neutral-400">Cargando canales...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Omnichannel Mesh & Escalación</h2>
        <p className="text-neutral-400">Conecta a Hermes con el mundo exterior y define por qué canal notificará a tu equipo humano cuando una consulta requiera intervención.</p>
      </div>

      {/* ── SECCIÓN 1: CANAL DE ESCALACIÓN HUMANA ── */}
      <Card className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-indigo-950/40 border-indigo-500/30 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-400" />
            <CardTitle className="text-white text-lg font-bold">
              Canal Preferido de Escalación a Humano (Human Handoff Alert)
            </CardTitle>
          </div>
          <CardDescription className="text-neutral-300 text-xs">
            Cuando un cliente pregunte algo no confirmado o solicite hablar con una persona real, Hermes pausará su respuesta y te enviará una alerta inmediata al canal que elijas aquí.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Selector de Canal */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'email', label: 'Email', icon: Mail, color: 'text-amber-400' },
              { id: 'telegram', label: 'Telegram', icon: Send, color: 'text-blue-400' },
              { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-400' },
              { id: 'discord', label: 'Discord', icon: DiscordIcon, color: 'text-purple-400' },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = alertChannel === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAlertChannel(item.id as any)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-xs font-semibold">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Formulario según Canal */}
          {alertChannel === 'email' && (
            <div className="space-y-2 bg-neutral-950/60 border border-neutral-800/80 p-4 rounded-xl">
              <Label className="text-neutral-300 text-xs font-medium">Email de Alertas</Label>
              <Input
                type="email"
                placeholder="operaciones@snarai.com"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-600 text-xs"
              />
            </div>
          )}

          {alertChannel === 'telegram' && (
            <div className="space-y-2 bg-neutral-950/60 border border-neutral-800/80 p-4 rounded-xl">
              <Label className="text-neutral-300 text-xs font-medium">Chat ID o ID de Grupo de Telegram</Label>
              <Input
                placeholder="Ej. 123456789 o -100123456789"
                value={alertTgChatId}
                onChange={(e) => setAlertTgChatId(e.target.value)}
                className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-600 text-xs"
              />
              <p className="text-[11px] text-neutral-400">
                Añade tu Bot de Telegram a tu grupo o chat privado y coloca aquí el Chat ID para recibir las alertas.
              </p>
            </div>
          )}

          {alertChannel === 'whatsapp' && (
            <div className="space-y-2 bg-neutral-950/60 border border-neutral-800/80 p-4 rounded-xl">
              <Label className="text-neutral-300 text-xs font-medium">Número de WhatsApp Destino (con código de país)</Label>
              <Input
                placeholder="Ej. +5213221234567"
                value={alertWaPhone}
                onChange={(e) => setAlertWaPhone(e.target.value)}
                className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-600 text-xs"
              />
              <p className="text-[11px] text-neutral-400">
                Hermes te enviará un mensaje directo cuando un cliente necesite escalación.
              </p>
            </div>
          )}

          {alertChannel === 'discord' && (
            <div className="space-y-2 bg-neutral-950/60 border border-neutral-800/80 p-4 rounded-xl">
              <Label className="text-neutral-300 text-xs font-medium">Discord Webhook URL</Label>
              <Input
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={alertDiscordUrl}
                onChange={(e) => setAlertDiscordUrl(e.target.value)}
                className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-600 text-xs"
              />
              <p className="text-[11px] text-neutral-400">
                Crea un Webhook en tu canal de Discord (Ajustes del canal → Integraciones → Webhooks) y pega la URL aquí.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              onClick={handleSaveHandoffAlert}
              disabled={savingAlert}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-indigo-600/20"
            >
              {savingAlert ? 'Guardando Alerta...' : '💾 Guardar Canal de Escalación'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleTestHandoffAlert}
              disabled={testingAlert}
              className="border-indigo-500/40 hover:bg-indigo-950/50 text-indigo-300 hover:text-white text-xs font-semibold py-2.5 rounded-xl flex items-center gap-2"
            >
              <Zap className={`w-3.5 h-3.5 ${testingAlert ? 'animate-spin' : 'text-indigo-400'}`} />
              {testingAlert ? 'Enviando Alerta...' : '🧪 Probar Alerta en Vivo'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── SECCIÓN 2: CANALES EXTERNOS (TELEGRAM & WHATSAPP) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TELEGRAM */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Send className="w-5 h-5 text-blue-400" />
              Telegram Bot
            </CardTitle>
            <CardDescription className="text-neutral-400">
              Conecta tu bot de Telegram configurando el token de BotFather.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-semibold text-white mb-2">Instrucciones de configuración:</h4>
              <ol className="text-xs text-neutral-300 space-y-2 list-decimal list-inside">
                <li>Abre Telegram y busca a <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">@BotFather</a>.</li>
                <li>Envía el comando <code className="text-blue-300 font-mono">/newbot</code> y sigue las instrucciones para crear tu bot.</li>
                <li>Copia el <strong>HTTP API Token</strong> que te proporcione BotFather y pégalo aquí abajo.</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label className="text-neutral-300">Bot Token</Label>
              <Input 
                value={telegramToken}
                onChange={e => setTelegramToken(e.target.value)}
                placeholder="123456789:ABCDEF..."
                className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 font-mono text-xs"
                type="password"
              />
            </div>
            
            {telegramToken && (
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-md flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-200">
                  <p className="font-medium">Bot Configurado</p>
                  <p className="text-blue-300/80 mt-1">Webhook activo automáticamente con Telegram API.</p>
                </div>
              </div>
            )}

            {tgTestResult?.success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-md flex items-start gap-2.5 animate-in fade-in">
                <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-300">
                  <span className="font-bold">Bot Verificado:</span> @{tgTestResult.bot.username} (ID: {tgTestResult.bot.id})
                  <div className="text-emerald-400/80 text-[11px] mt-0.5">
                    Latencia: {tgTestResult.latency}ms • Estado: Conectado a Telegram API
                  </div>
                </div>
              </div>
            )}

            {tgTestResult?.success === false && (
              <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-md flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-300">
                  <span className="font-bold">Fallo en verificación:</span> {tgTestResult.error}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button 
                onClick={handleSaveTelegram} 
                disabled={savingTg}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {savingTg ? 'Guardando...' : 'Guardar Telegram'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleTestTelegram}
                disabled={testingTg || !telegramToken}
                className="border-blue-500/40 hover:bg-blue-950/40 text-blue-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingTg ? 'animate-spin' : ''}`} />
                {testingTg ? 'Probando...' : '🧪 Probar Bot'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WHATSAPP */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <MessageCircle className="w-5 h-5 text-green-500" />
              WhatsApp Business (WABA)
            </CardTitle>
            <CardDescription className="text-neutral-400">
              Conecta tu número oficial a través de la API de WhatsApp Cloud.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-semibold text-white mb-2">Instrucciones de configuración:</h4>
              <ol className="text-xs text-neutral-300 space-y-2 list-decimal list-inside">
                <li>Ve a <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">Meta for Developers</a> y crea una App tipo "Negocios".</li>
                <li>Añade el producto <strong>WhatsApp</strong> y genera un <strong>Access Token</strong>.</li>
                <li>Copia el <strong>Phone Number ID</strong>.</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label className="text-neutral-300">Access Token (Permanente)</Label>
              <Input 
                value={whatsappToken}
                onChange={e => setWhatsappToken(e.target.value)}
                placeholder="EAAB..."
                className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 font-mono text-xs"
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-300">Phone Number ID</Label>
              <Input 
                value={whatsappPhoneId}
                onChange={e => setWhatsappPhoneId(e.target.value)}
                placeholder="102345678901234"
                className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 font-mono text-xs"
              />
            </div>
            
            {whatsappToken && whatsappPhoneId && (
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-md flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div className="text-sm text-green-200">
                  <p className="font-medium">WABA Configurado</p>
                  <p className="text-green-300/80 mt-1">Los mensajes a este PhoneID se enrutarán a tu conocimiento de Hermes.</p>
                </div>
              </div>
            )}

            {waTestResult?.success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-md flex items-start gap-2.5 animate-in fade-in">
                <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-300">
                  <span className="font-bold">WABA Verificado:</span> {waTestResult.waba.verifiedName} ({waTestResult.waba.displayPhoneNumber})
                  <div className="text-emerald-400/80 text-[11px] mt-0.5">
                    Calidad: {waTestResult.waba.qualityRating} • Latencia: {waTestResult.latency}ms • Estado: Conectado a Meta Cloud
                  </div>
                </div>
              </div>
            )}

            {waTestResult?.success === false && (
              <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-md flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-300">
                  <span className="font-bold">Fallo en verificación:</span> {waTestResult.error}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button 
                onClick={handleSaveWhatsApp} 
                disabled={savingWa}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {savingWa ? 'Guardando...' : 'Guardar WhatsApp'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleTestWhatsApp}
                disabled={testingWa || !whatsappPhoneId}
                className="border-green-500/40 hover:bg-green-950/40 text-green-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingWa ? 'animate-spin' : ''}`} />
                {testingWa ? 'Probando...' : '🧪 Probar WABA'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
