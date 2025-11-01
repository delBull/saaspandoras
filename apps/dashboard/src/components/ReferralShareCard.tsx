'use client';

import { useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Image from 'next/image';

// Icons (usando componente simple por ahora)
const CopyIcon = () => <span className="mr-1">📋</span>;
const QRIcon = () => <span className="mr-1">📱</span>;
const TwitterIcon = () => <span className="mr-1">🐦</span>;
const TelegramIcon = () => <span className="mr-1">📱</span>;

export function ReferralShareCard() {
  const account = useActiveAccount();
  const [showQR, setShowQR] = useState(false);

  // Generar enlace de referido
  const referralLink = account?.address ?
    `${window.location.origin}/join?ref=${account.address}` : '';

  // URL del QR code (usando API externa)
  const qrCodeUrl = referralLink ?
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralLink)}` : '';

  const handleCopyLink = async () => {
    if (!referralLink) return;

    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success('Enlace copiado al portapapeles');
    } catch (err) {
      // Fallback para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = referralLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  const handleShareTwitter = () => {
    if (!referralLink) return;
    const tweetText = encodeURIComponent(`Únete a Pandora's Web3 con este enlace especial y gana puntos! ${referralLink}`);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
    window.open(twitterUrl, '_blank');
  };

  const handleShareTelegram = () => {
    if (!referralLink) return;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Únete a Pandora\'s Web3 con este enlace especial!')}`;
    window.open(telegramUrl, '_blank');
  };

  const handleShareWhatsApp = () => {
    if (!referralLink) return;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Únete a Pandora's Web3 con este enlace especial! ${referralLink}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!account) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            🎁 Compartir & Ganar
          </CardTitle>
          <CardDescription>
            Conecta tu wallet para compartir y ganar puntos por referidos
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2 text-cyan-400">
              🎁 Compartir & Ganar
            </CardTitle>
            <CardDescription>
              Invita amigos y gana <span className="text-cyan-400 font-semibold">+200 puntos</span> por cada uno que se una
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Enlace Personal */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-300">
              Tu enlace personalizado:
            </div>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-gray-300 text-sm font-mono truncate">
                {referralLink}
              </div>
              <Button
                size="sm"
                onClick={handleCopyLink}
                className="bg-zinc-700 hover:bg-zinc-600"
              >
                <CopyIcon /> Copiar
              </Button>
            </div>
          </div>

          {/* Botón QR */}
          <Button
            variant="outline"
            className="w-full border-zinc-700 hover:bg-zinc-800"
            onClick={() => setShowQR(!showQR)}
          >
            <QRIcon /> Generar Código QR
          </Button>

          {/* QR Code Display */}
          {showQR && qrCodeUrl && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-center p-4 bg-zinc-800 rounded-lg"
            >
              <Image
                src={qrCodeUrl}
                alt="Referral QR Code"
                width={128}
                height={128}
                className="w-32 h-32 rounded-lg shadow-sm"
              />
            </motion.div>
          )}

          {/* Compartir Redes */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-300">
              Compartir en redes sociales:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                onClick={handleShareTwitter}
                className="bg-blue-600 hover:bg-blue-700 p-2"
                title="Twitter"
              >
                <TwitterIcon />
              </Button>
              <Button
                size="sm"
                onClick={handleShareTelegram}
                className="bg-blue-500 hover:bg-blue-600 p-2"
                title="Telegram"
              >
                <TelegramIcon />
              </Button>
              <Button
                size="sm"
                onClick={handleShareWhatsApp}
                className="bg-green-600 hover:bg-green-700 p-2"
                title="WhatsApp"
              >
                <span className="mr-1">💬</span>
              </Button>
            </div>
          </div>



          {/* Info adicional */}
          <div className="text-xs text-gray-500 bg-zinc-800/50 p-3 rounded-lg">
            💡 <strong>¿Cómo funciona?</strong> Tu enlace lleva directamente a la wallet address.
            Cuando alguien se conecte usando tu enlace, automáticamente se registra como referido tuyo.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
