"use client";

interface DevicePieChartProps {
  data: { device: string; count: number; percentage?: number }[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  const d = [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");

  return d;
}

export function DevicePieChart({ data }: DevicePieChartProps) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No hay datos para mostrar
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const centerX = 100;
  const centerY = 100;
  const radius = 80;

  let currentAngle = 0;

  return (
    <div className="w-full flex flex-col items-center">
      <svg width="200" height="200" className="w-full max-w-xs">
        {data.map((item, index) => {
          const percentage = (item.count / total) * 100;
          const angle = (percentage / 100) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;

          const pathData = describeArc(centerX, centerY, radius, startAngle, endAngle);

          // Calculate label position
          const labelAngle = startAngle + angle / 2;
          const labelPos = polarToCartesian(centerX, centerY, radius * 0.65, labelAngle);

          currentAngle = endAngle;

          if (percentage < 5) return null; // Skip very small slices

          return (
            <g key={index}>
              <path
                d={pathData}
                fill={COLORS[index % COLORS.length]}
                stroke="#ffffff"
                strokeWidth="1"
                className="hover:opacity-70 cursor-pointer"
              >
                <title>{`${item.device}: ${item.count} (${percentage.toFixed(1)}%)`}</title>
              </path>

              {percentage > 10 && (
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-medium fill-white"
                  style={{ fontSize: '10px' }}
                >
                  {percentage.toFixed(0)}%
                </text>
              )}
            </g>
          );
        })}

        {/* Center circle for donut effect */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius * 0.3}
          fill="#ffffff"
        />

        {/* Total in center */}
        <text
          x={centerX}
          y={centerY - 8}
          textAnchor="middle"
          className="text-sm font-bold fill-gray-700"
        >
          {total}
        </text>
        <text
          x={centerX}
          y={centerY + 8}
          textAnchor="middle"
          className="text-xs fill-gray-500"
        >
          Total
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            ></div>
            <span className="text-sm text-gray-600">
              {item.device} ({item.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
