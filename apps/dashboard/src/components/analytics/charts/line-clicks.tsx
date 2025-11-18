"use client";

interface ClicksLineChartProps {
  data: { day: string; count: number }[];
}

export function ClicksLineChart({ data }: ClicksLineChartProps) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No hay datos para mostrar
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.count));
  const chartHeight = 200;
  const chartWidth = 600;
  const padding = 40;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * (chartWidth - 2 * padding) + padding;
    const y = chartHeight - ((point.count / maxValue) * (chartHeight - 2 * padding)) + padding;

    return { x, y: Math.max(y, padding), ...point };
  });

  const pathData = points.map((point, index) =>
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  return (
    <div className="w-full">
      <svg width={chartWidth} height={chartHeight + 40} className="w-full">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(percentage => {
          const y = chartHeight - (percentage / 100 * (chartHeight - 2 * padding)) + padding;
          return (
            <g key={percentage}>
              <line
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <text
                x={padding - 10}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-gray-500"
              >
                {Math.round((percentage / 100) * maxValue)}
              </text>
            </g>
          );
        })}

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#3b82f6"
            className="hover:fill-blue-700 cursor-pointer"
          >
            <title>{`${point.day}: ${point.count} clics`}</title>
          </circle>
        ))}
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between -mt-8 px-10">
        {data.filter((_, index) => index % Math.ceil(data.length / 6) === 0).map((point, index) => (
          <span key={index} className="text-xs text-gray-500 transform -rotate-45 origin-top">
            {new Date(point.day).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
          </span>
        ))}
      </div>
    </div>
  );
}
