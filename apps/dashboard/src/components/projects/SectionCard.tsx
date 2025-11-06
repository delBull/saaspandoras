'use client';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  icon: React.ElementType;
}

export default function SectionCard({ title, children, icon: Icon }: SectionCardProps) {
  return (
    <div className="p-6 bg-zinc-800 rounded-xl border border-zinc-700/50">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5 text-lime-400" />
        {title}
      </h3>
      <div className="text-zinc-300 space-y-3">
        {children}
      </div>
    </div>
  );
}