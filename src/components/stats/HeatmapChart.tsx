'use client';

import { useMemo } from 'react';

interface HeatmapChartProps {
  data: {
    hour: number;
    count: number;
  }[];
  title?: string;
}

export default function HeatmapChart({ data, title = "Heatmap Horaire" }: HeatmapChartProps) {
  // Déterminer les seuils pour les couleurs
  const { min, max } = useMemo(() => {
    if (data.length === 0) return { min: 0, max: 0 };
    const counts = data.map(d => d.count);
    return {
      min: Math.min(...counts),
      max: Math.max(...counts)
    };
  }, [data]);

  const getIntensity = (count: number) => {
    if (max === min) return 'medium';
    const normalized = (count - min) / (max - min);
    if (normalized > 0.66) return 'high';
    if (normalized > 0.33) return 'medium';
    return 'low';
  };

  const getColor = (intensity: string) => {
    switch (intensity) {
      case 'high': return 'bg-green-500 text-white';
      case 'medium': return 'bg-orange-400 text-white';
      case 'low': return 'bg-gray-300 text-gray-700';
      default: return 'bg-gray-200 text-gray-500';
    }
  };

  // Créer un array de 24 heures
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hourData = data.find(d => d.hour === i);
    return {
      hour: i,
      count: hourData?.count || 0
    };
  });

  return (
    <div>
      {title && (
        <h3 className="text-sm font-bold uppercase tracking-wide mb-4">
          {title}
        </h3>
      )}
      
      <div className="grid grid-cols-12 gap-2">
        {hours.map((h) => {
          const intensity = getIntensity(h.count);
          const colorClass = getColor(intensity);
          
          return (
            <div
              key={h.hour}
              className={`aspect-square flex flex-col items-center justify-center rounded text-xs font-bold ${colorClass}`}
              title={`${h.hour}h: ${h.count} commandes`}
            >
              <div>{h.hour}h</div>
              <div className="text-[0.65rem] opacity-90">{h.count}</div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <span>Faible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-400 rounded"></div>
          <span>Moyen</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Élevé</span>
        </div>
      </div>
    </div>
  );
}

