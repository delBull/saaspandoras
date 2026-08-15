'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageCircle, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { getChannelsConfig, saveTelegramConfig, saveWhatsAppConfig } from './actions';

export default function ChannelsDashboard({ organizationSlug }: { organizationSlug: string }) {
  const [telegramToken, setTelegramToken] = useState('');
  const [whatsappToken, setWhatsappToken] = useState('');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [savingTg, setSavingTg] = useState(false);
  const [savingWa, setSavingWa] = useState(false);

  useEffect(() => {
    getChannelsConfig(organizationSlug).then(config => {
      if (config.telegramBotToken) setTelegramToken(config.telegramBotToken);
      if (config.whatsappToken) setWhatsappToken(config.whatsappToken);
      if (config.whatsappPhoneId) setWhatsappPhoneId(config.whatsappPhoneId);
      setLoading(false);
    });
  }, [organizationSlug]);

  const handleSaveTelegram = async () => {
    setSavingTg(true);
    await saveTelegramConfig(organizationSlug, telegramToken);
    setSavingTg(false);
  };

  const handleSaveWhatsApp = async () => {
    setSavingWa(true);
    await saveWhatsAppConfig(organizationSlug, whatsappToken, whatsappPhoneId);
    setSavingWa(false);
  };

  if (loading) return <div className="p-8 text-neutral-400">Cargando canales...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Omnichannel Mesh</h2>
        <p className="text-neutral-400">Conecta a Hermes con el mundo exterior. Configura en qué canales escucha y responde tu agente operativo.</p>
      </div>

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
                  <p className="text-blue-300/80 mt-1">Configura este Webhook en Telegram:</p>
                  <code className="text-xs bg-black/40 px-2 py-1 rounded mt-2 block break-all text-blue-300">
                    https://[tu-dominio]/api/v1/external/telegram/webhook
                  </code>
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
                <li>En la configuración de la API, genera un <strong>Access Token permanente</strong> asociado a un usuario del sistema.</li>
                <li>Copia el <strong>Phone Number ID</strong> (Identificador del número de teléfono) de la sección "Empezar".</li>
                <li>Guarda las credenciales aquí. Luego, configura el Webhook en Meta Developers con la URL que aparecerá abajo. Asegúrate de suscribirte al evento <code className="text-green-300 font-mono">messages</code>.</li>
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
                  <p className="text-green-300/80 mt-1">Configura este Webhook en Meta Developers:</p>
                  <code className="text-xs bg-black/40 px-2 py-1 rounded mt-2 block break-all text-green-300">
                    https://[tu-dominio]/api/v1/external/whatsapp/webhook
                  </code>
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
