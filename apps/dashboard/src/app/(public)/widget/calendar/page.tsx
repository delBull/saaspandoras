import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Investment Calendar - Whitelabel Widget',
  description: 'Embeddable investment calendar for external properties',
};

export default function WhitelabelCalendarWidget({
  searchParams,
}: {
  searchParams: { projectId?: string; theme?: string };
}) {
  const projectId = searchParams.projectId || 'default';
  const isDark = searchParams.theme === 'dark' || !searchParams.theme;

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 transition-colors ${
      isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'
    }`}>
      {/* Widget Header */}
      <div className="w-full max-w-3xl mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold font-serif">
          Upcoming Phases
        </h2>
        <span className="text-xs font-mono opacity-50 uppercase tracking-widest border border-current rounded px-2 py-1">
          Powered by Pandoras
        </span>
      </div>

      {/* Calendar Grid */}
      <div className="w-full max-w-3xl grid gap-4">
        {/* Skeleton/Placeholder for Phases (Since it's a modular widget, it would fetch actual phase data) */}
        {[1, 2, 3].map((phaseIndex) => (
          <div key={phaseIndex} className={`w-full border rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
            isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
          }`}>
            <div className="flex flex-col gap-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                phaseIndex === 1 ? 'text-emerald-500' : 'opacity-50'
              }`}>
                {phaseIndex === 1 ? 'Active Phase' : 'Upcoming'}
              </span>
              <h3 className="text-2xl font-bold font-mono">Phase {phaseIndex}</h3>
              <p className="text-sm opacity-60">
                {phaseIndex === 1 ? 'Closes in 4 days' : 'Opens next month'}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Target Yield</p>
                <p className="font-bold font-mono">{10 + phaseIndex}%</p>
              </div>
              
              <a 
                href={`https://snarai.aztecaz.xyz/invest?phase=${phaseIndex}`}
                target="_parent" // break out of iframe
                className={`px-6 py-2 text-sm font-bold rounded-lg transition-transform hover:scale-105 ${
                  phaseIndex === 1 
                    ? isDark ? 'bg-white text-black' : 'bg-black text-white'
                    : 'bg-transparent border border-current opacity-50 pointer-events-none'
                }`}
              >
                {phaseIndex === 1 ? 'Participate' : 'Locked'}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
