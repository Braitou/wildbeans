'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface OptionsChartProps {
  data: {
    name: string;
    value: number;
  }[];
  title?: string;
}

export default function OptionsChart({ data, title = "Options Populaires" }: OptionsChartProps) {
  return (
    <div>
      {title && (
        <h3 className="text-sm font-bold uppercase tracking-wide mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
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
          <Bar dataKey="value" fill="#A08963" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

