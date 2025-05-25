interface BannerProps {
  title: string;
  subtitle: string;
  actionText: string;
  variant: 'purple' | 'green' | 'red';
}

export function PromotionalBanner({ title, subtitle, actionText, variant }: BannerProps) {
  const variantStyles = {
    purple: 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20',
    green: 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20',
    red: 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20'
  };

  return (
    <div className={`rounded-lg border p-6 transition-all ${variantStyles[variant]}`}>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-4">{subtitle}</p>
      <button className="text-sm font-medium px-4 py-2 rounded-lg bg-zinc-900/50 text-white hover:bg-zinc-900">
        {actionText}
      </button>
    </div>
  );
}