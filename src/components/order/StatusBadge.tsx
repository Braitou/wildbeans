'use client';

import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export default function StatusBadge({ status, variant = 'secondary' }: StatusBadgeProps) {
  return (
    <Badge variant={variant} className="uppercase tracking-wide text-xs">
      {status}
    </Badge>
  );
}
