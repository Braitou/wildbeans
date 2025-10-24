'use client';

import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: string;
  icon?: LucideIcon;
  className?: string;
}

export default function KPICard({ label, value, trend, icon: Icon, className = '' }: KPICardProps) {
  return (
    <div className={`bg-white p-6 border border-gray-200 shadow-sm ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </div>
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
      </div>
      
      <div className="text-4xl font-bold text-gray-900 mb-1">
        {value}
      </div>
      
      {trend && (
        <div className="text-xs text-green-600 font-medium">
          {trend}
        </div>
      )}
    </div>
  );
}

