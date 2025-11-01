import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { ChartBarIcon, EyeIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

// Activity interface
interface ActivityItem {
  id: string;
  type: 'login' | 'referral' | 'other';
  points: number;
  reason: string;
  category: string;
  createdAt: Date;
  date: string;
  time: string;
}

interface ActivityHistoryCardProps {
  walletAddress: string | undefined;
}

export function ActivityHistoryCard({ walletAddress }: ActivityHistoryCardProps) {
  const [realActivity, setRealActivity] = useState<ActivityItem[]>([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real activity data
  useEffect(() => {
    const fetchActivity = async () => {
      if (!walletAddress) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/gamification/activity/${walletAddress}`);
        if (response.ok) {
          const data = (await response.json()) as { activities?: ActivityItem[] };
          const activityData = (data as { activities?: ActivityItem[] }).activities ?? [];
          setRealActivity(activityData);
        } else {
          console.warn('Failed to fetch activity data');
          setRealActivity([]);
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
        setRealActivity([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchActivity();
  }, [walletAddress]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-blue-400" />
            Historial de Actividad Reciente
          </CardTitle>
          <CardDescription>
            Todos tus logros, tokens y transacciones por fecha
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {realActivity.slice(0, 5).map((activity: ActivityItem) => (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'referral' ? 'bg-green-500/20' :
                      activity.type === 'login' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                    }`}>
                      <span className={`text-sm ${
                        activity.type === 'referral' ? 'text-green-400' :
                        activity.type === 'login' ? 'text-blue-400' : 'text-purple-400'
                      }`}>
                        {activity.type === 'referral' ? '👥' :
                         activity.type === 'login' ? '🔗' : '🎯'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{activity.reason}</p>
                      <p className="text-xs text-gray-400">
                        {activity.date} • {activity.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-400">
                      +{activity.points} tokens
                    </span>
                    <div className={`px-2 py-1 rounded text-xs ${
                      activity.category === 'referral_made' ? 'bg-green-900/50 text-green-400' :
                      activity.category === 'daily_login' ? 'bg-blue-900/50 text-blue-400' :
                      'bg-purple-900/50 text-purple-400'
                    }`}>
                      {activity.category === 'referral_made' ? 'Referido' :
                       activity.category === 'daily_login' ? 'Login' : 'Especial'}
                    </div>
                  </div>
                </div>
              ))}

              {realActivity.length > 5 && (
                <div className="pt-4 border-t border-zinc-700">
                  <p className="text-xs text-gray-400 text-center">
                    Mostrando las últimas 5 transacciones
                  </p>
                  <div className="flex justify-center gap-2 mt-2">
                    <button
                      onClick={() => setShowActivityModal(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      <EyeIcon className="w-3 h-3" />
                      Ver Historial Completo
                    </button>
                  </div>
                </div>
              )}

              {realActivity.length === 0 && (
                <div className="text-center py-8">
                  <ChartBarIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">
                    No hay actividad registrada aún
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Tu historial de tokens y logros aparecerá aquí
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Modal */}
      <AnimatePresence>
        {showActivityModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Historial de Actividad Completo</CardTitle>
                  <button
                    onClick={() => setShowActivityModal(false)}
                    className="px-2 py-1 hover:bg-zinc-800 rounded"
                  >
                    ✕
                  </button>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {realActivity.map((activity: ActivityItem) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded border border-zinc-700/30">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            activity.type === 'referral' ? 'bg-green-500/20' :
                            activity.type === 'login' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                          }`}>
                            <span className={`text-xs ${
                              activity.type === 'referral' ? 'text-green-400' :
                              activity.type === 'login' ? 'text-blue-400' : 'text-purple-400'
                            }`}>
                              {activity.type === 'referral' ? '👥' :
                               activity.type === 'login' ? '🔗' : '🎯'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{activity.reason}</p>
                            <p className="text-xs text-gray-400">{activity.date} • {activity.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-green-400">
                            +{activity.points} tokens
                          </span>
                          <div className={`inline-block px-2 py-1 mt-1 rounded text-xs ${
                            activity.category === 'referral_made' ? 'bg-green-900/50 text-green-400' :
                            activity.category === 'daily_login' ? 'bg-blue-900/50 text-blue-400' :
                            'bg-purple-900/50 text-purple-400'
                          }`}>
                            {activity.category === 'referral_made' ? 'Referido' :
                             activity.category === 'daily_login' ? 'Login' : 'Especial'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
