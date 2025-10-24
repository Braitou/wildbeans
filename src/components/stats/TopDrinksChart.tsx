'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface TopDrinksChartProps {
  data: {
    name: string;
    value: number;
    category?: string;
  }[];
  title?: string;
}

export default function TopDrinksChart({ data, title = "Top Boissons" }: TopDrinksChartProps) {
  // Couleurs selon la catégorie
  const getColor = (category?: string) => {
    if (!category) return '#706D54';
    const lower = category.toLowerCase();
    if (lower.includes('café') || lower.includes('coffee')) {
      return '#706D54';
    }
    return '#A08963';
  };

  return (
    <div>
      {title && (
        <h3 className="text-sm font-bold uppercase tracking-wide mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart 
          data={data} 
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <XAxis type="number" />
          <YAxis 
            dataKey="name" 
            type="category"
            width={90}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.category)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

