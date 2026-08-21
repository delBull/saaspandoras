'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageCircle, Send, CheckCircle2, AlertTriangle, Mail, Disc as DiscordIcon, UserCheck } from 'lucide-react';
import { getChannelsConfig, saveTelegramConfig, saveWhatsAppConfig, getHandoffAlertConfig, saveHandoffAlertConfig, HandoffAlertConfig } from './actions';
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

  useEffect(() => {
    Promise.all([
      getChannelsConfig(organizationSlug),
      getHandoffAlertConfig(organizationSlug)
    ]).then(([config, alertConfig]) => {
      if (config.telegramBotToken) setTelegramToken(config.telegramBotToken);
      if (config.whatsappToken) setWhatsappToken(config.whatsappToken);
      if (config.whatsappPhoneId) setWhatsappPhoneId(config.whatsappPhoneId);

      if (alertConfig) {
        setAlertChannel(alertConfig.preferredChannel || 'email');
        setAlertEmail(alertConfig.email || '');
        setAlertTgChatId(alertConfig.telegramChatId || '');
        setAlertWaPhone(alertConfig.whatsappPhone || '');
        setAlertDiscordUrl(alertConfig.discordWebhookUrl || '');
      }

      setLoading(false);
    });
  }, [organizationSlug]);

  const handleSaveTelegram = async () => {
    setSavingTg(true);
    await saveTelegramConfig(organizationSlug, telegramToken);
    setSavingTg(false);
    toast.success('Configuración de Telegram guardada');
  };

  const handleSaveWhatsApp = async () => {
    setSavingWa(true);
    await saveWhatsAppConfig(organizationSlug, whatsappToken, whatsappPhoneId);
    setSavingWa(false);
    toast.success('Configuración de WhatsApp guardada');
  };

  const handleSaveHandoffAlert = async () => {
    setSavingAlert(true);
    await saveHandoffAlertConfig(organizationSlug, {
      preferredChannel: alertChannel,
      email: alertEmail,
      telegramChatId: alertTgChatId,
      whatsappPhone: alertWaPhone,
      discordWebhookUrl: alertDiscordUrl,
    });
    setSavingAlert(false);
    toast.success('Canal de escalación humana guardado exitosamente');
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

          {/* Formulario e Instrucciones Dinámicas */}
          {alertChannel === 'email' && (
            <div className="space-y-3 bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
              <Label className="text-xs text-neutral-300">Correo Electrónico para Recibir Alertas</Label>
              <Input
                type="email"
                placeholder="operaciones@tuempresa.com"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                className="bg-neutral-900 border-neutral-700 text-white"
              />
              <p className="text-[11px] text-neutral-400">
                ℹ️ Recibirás un correo formateado inmediatamente con el motivo de la escalación, número del cliente y el último mensaje enviado.
              </p>
            </div>
          )}

          {alertChannel === 'telegram' && (
            <div className="space-y-3 bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
              <Label className="text-xs text-neutral-300">Telegram Chat ID (Usuario o Grupo)</Label>
              <Input
                placeholder="123456789 (o -100123456789 para grupo)"
                value={alertTgChatId}
                onChange={(e) => setAlertTgChatId(e.target.value)}
                className="bg-neutral-900 border-neutral-700 text-white font-mono text-sm"
              />
              <div className="text-[11px] text-neutral-300 bg-neutral-900/90 p-3 rounded-lg border border-neutral-800 space-y-1.5">
                <p className="font-semibold text-blue-300">¿Cómo obtener tu Telegram Chat ID?</p>
                <ol className="list-decimal list-inside space-y-1 text-neutral-400">
                  <li>Abre Telegram y busca a <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">@userinfobot</a> o <a href="https://t.me/RawDataBot" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">@RawDataBot</a>.</li>
                  <li>Envía cualquier mensaje y el bot te responderá con tu número de <strong>ID</strong>.</li>
                  <li>Pega ese número aquí arriba.</li>
                </ol>
              </div>
            </div>
          )}

          {alertChannel === 'whatsapp' && (
            <div className="space-y-3 bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
              <Label className="text-xs text-neutral-300">Número de WhatsApp del Operador (con código de país)</Label>
              <Input
                placeholder="5213221234567"
                value={alertWaPhone}
                onChange={(e) => setAlertWaPhone(e.target.value)}
                className="bg-neutral-900 border-neutral-700 text-white font-mono text-sm"
              />
              <p className="text-[11px] text-neutral-400">
                ℹ️ Ingresa el número en formato internacional sin el signo '+' ni espacios (ej: 5213221234567 para México o 14155552671 para USA).
              </p>
            </div>
          )}

          {alertChannel === 'discord' && (
            <div className="space-y-3 bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
              <Label className="text-xs text-neutral-300">Discord Webhook URL</Label>
              <Input
                placeholder="https://discord.com/api/webhooks/..."
                value={alertDiscordUrl}
                onChange={(e) => setAlertDiscordUrl(e.target.value)}
                className="bg-neutral-900 border-neutral-700 text-white font-mono text-xs"
              />
              <div className="text-[11px] text-neutral-300 bg-neutral-900/90 p-3 rounded-lg border border-neutral-800 space-y-1.5">
                <p className="font-semibold text-purple-300">¿Cómo crear un Webhook en Discord?</p>
                <ol className="list-decimal list-inside space-y-1 text-neutral-400">
                  <li>En tu servidor de Discord, entra a la configuración del canal donde deseas las alertas (⚙️ Editar Canal).</li>
                  <li>Ve a la pestaña <strong>Integraciones</strong> ➔ <strong>Webhooks</strong>.</li>
                  <li>Haz clic en <strong>Crear Webhook</strong>, asígnale el nombre "Hermes Alerts" y haz clic en <strong>Copiar URL del Webhook</strong>.</li>
                  <li>Pega la URL copiada aquí arriba.</li>
                </ol>
              </div>
            </div>
          )}

          <Button
            onClick={handleSaveHandoffAlert}
            disabled={savingAlert}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-indigo-600/20"
          >
            {savingAlert ? 'Guardando Alerta...' : '💾 Guardar Canal de Escalación'}
          </Button>
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
                <li>Una vez guardado, Hermes configurará automáticamente el Webhook para escuchar los mensajes de tu bot.</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label className="text-neutral-300">Bot Token</Label>
              <Input 
                value={telegramToken}
                onChange={e => setTelegramToken(e.target.value)}
                placeholder="123456789:ABCDEF..."
                className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600"
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

            <Button 
              onClick={handleSaveTelegram} 
              disabled={savingTg}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {savingTg ? 'Guardando...' : 'Guardar Telegram'}
            </Button>
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
                <li>Añade el producto <strong>WhatsApp</strong> a tu App.</li>
                <li>En la configuración de la API, genera un <strong>Access Token permanente</strong>.</li>
                <li>Copia el <strong>Phone Number ID</strong> (Identificador del número de teléfono).</li>
                <li>Guarda las credenciales aquí. Hermes enrutará automáticamente todos los mensajes entrantes dirigidos a este número hacia tu motor cognitivo.</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label className="text-neutral-300">Access Token (Permanente)</Label>
              <Input 
                value={whatsappToken}
                onChange={e => setWhatsappToken(e.target.value)}
                placeholder="EAAB..."
                className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600"
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-300">Phone Number ID</Label>
              <Input 
                value={whatsappPhoneId}
                onChange={e => setWhatsappPhoneId(e.target.value)}
                placeholder="102345678901234"
                className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600"
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

            <Button 
              onClick={handleSaveWhatsApp} 
              disabled={savingWa}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {savingWa ? 'Guardando...' : 'Guardar WhatsApp'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
