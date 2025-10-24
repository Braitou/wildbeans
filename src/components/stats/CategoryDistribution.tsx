'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CategoryDistributionProps {
  data: {
    name: string;
    value: number;
  }[];
  title?: string;
}

const COLORS = {
  'Cafés': '#706D54',
  'Coffee': '#706D54',
  'Non-Coffee': '#A08963',
  'Non-coffee': '#A08963'
};

export default function CategoryDistribution({ data, title = "Distribution" }: CategoryDistributionProps) {
  const getColor = (name: string) => {
    return COLORS[name as keyof typeof COLORS] || '#999';
  };

  return (
    <div>
      {title && (
        <h3 className="text-sm font-bold uppercase tracking-wide mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

