import { Card, CardContent } from "@saasfly/ui/card";

interface StatsCardProps {
  title: string;
  value: string;
  unit?: string;
  className?: string;
}

export function StatsCard({ title, value, unit, className }: StatsCardProps) {
  return (
    <Card className={`bg-card/50 backdrop-blur-sm ${className}`}>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-mono">{value}</h2>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );
}