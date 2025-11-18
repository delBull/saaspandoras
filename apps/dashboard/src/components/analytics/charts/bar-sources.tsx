"use client";

interface SourcesBarChartProps {
  data: { source: string; count: number }[];
}

export function SourcesBarChart({ data }: SourcesBarChartProps) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No hay datos para mostrar
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.count));
  const topData = data.slice(0, 10); // Top 10 fuentes

  return (
    <div className="w-full">
      <div className="h-64 flex items-end justify-around space-x-2">
        {topData.map((item, index) => {
          const height = (item.count / maxValue) * 80 + 20; // Min 20% height

          return (
            <div key={index} className="flex flex-col items-center space-y-2 flex-1 max-w-12">
              {/* Bar */}
              <div className="relative w-full bg-green-100 rounded-t flex items-end justify-center">
                <div
                  className="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
                  style={{ height: `${height}%` }}
                  title={`${item.source}: ${item.count} clics`}
                >
                  {item.count > maxValue * 0.3 && (
                    <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700">
                      {item.count}
                    </span>
                  )}
                </div>
              </div>

              {/* Label */}
              <div className="text-xs text-gray-600 text-center leading-tight">
                {item.source.length > 8 ? `${item.source.substring(0, 8)}...` : item.source}
              </div>
            </div>
          );
        })}
      </div>

      {/* Y-axis labels */}
      <div className="flex flex-col justify-between h-64 -mt-64 mr-4 text-right">
        <span className="text-xs text-gray-500">{maxValue}</span>
        <span className="text-xs text-gray-500">{Math.round(maxValue * 0.75)}</span>
        <span className="text-xs text-gray-500">{Math.round(maxValue * 0.5)}</span>
        <span className="text-xs text-gray-500">{Math.round(maxValue * 0.25)}</span>
        <span className="text-xs text-gray-500">0</span>
      </div>

      {data.length > 10 && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Mostrando las 10 fuentes principales
        </p>
      )}
    </div>
  );
}
