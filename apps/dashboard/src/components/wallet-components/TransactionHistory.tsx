import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { useActiveAccount } from 'thirdweb/react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, ArrowRightLeft, ShieldCheck, CoinsIcon, MessageSquare } from 'lucide-react';

export function TransactionHistory() {
  const account = useActiveAccount();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account?.address) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/user/history?wallet=${account.address}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error("Failed to fetch history", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [account?.address]);

  if (!account) return null;

  const getIcon = (type: string) => {
    if (type.includes('project') || type.includes('deployed')) return <ShieldCheck className="w-5 h-5 text-purple-400" />;
    if (type.includes('investment') || type.includes('deposit')) return <CoinsIcon className="w-5 h-5 text-green-400" />;
    if (type.includes('post') || type.includes('forum')) return <MessageSquare className="w-5 h-5 text-blue-400" />;
    return <ArrowRightLeft className="w-5 h-5 text-gray-400" />;
  };

  return (
    <Card className="bg-gradient-to-r from-zinc-900/30 to-zinc-800/30 border border-zinc-700/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Actividad Reciente</CardTitle>
        <CardDescription className="text-zinc-400">
          Tus últimas interacciones en el ecosistema Pandora
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="flex items-center gap-4 p-3 bg-zinc-900/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="p-2 bg-zinc-800 rounded-full">
                  {getIcon(event.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white capitalize">
                    {event.type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, locale: es })}
                  </p>
                </div>
                {event.points > 0 && (
                  <span className="text-sm font-bold text-green-400 bg-green-900/20 px-2 py-1 rounded">
                    +{event.points} pts
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500">
            No hay actividad reciente.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
