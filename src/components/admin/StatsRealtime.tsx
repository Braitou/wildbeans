'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface StatsRealtimeProps {
  eventId: string;
  onTick: () => void;
}

export default function StatsRealtime({ eventId, onTick }: StatsRealtimeProps) {
  useEffect(() => {
    const channel = supabase
      .channel(`stats-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          console.log('Orders changed, refreshing stats...');
          onTick();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, onTick]);

  return null;
}
