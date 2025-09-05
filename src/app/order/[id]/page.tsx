'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { WaitingClientUI } from '@/components/order/WaitingClient';

type OrderStatus = 'new' | 'pending' | 'sent' | 'taken' | 'preparing' | 'ready' | 'served' | 'cancelled' | 'in_progress' | 'done';

export const dynamic = 'force-dynamic';

export default function OrderStatusPage() {
  const { id: orderId } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const pickup = sp.get('pickup') || undefined;

  const [status, setStatus] = useState<OrderStatus>('pending');
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realtimeHeardRef = useRef(false);

  // Fetch initial
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .maybeSingle();
      if (active && data?.status) setStatus(data.status as OrderStatus);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [orderId]);

  // Realtime + fallback polling
  useEffect(() => {
    const ch = supabase
      .channel(`order-${orderId}`, { config: { broadcast: { ack: true } } })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        const next = (payload.new as any)?.status as OrderStatus | undefined;
        if (next) {
          realtimeHeardRef.current = true;
          setStatus(next);
        }
      })
      .subscribe();

    // Fallback: if no realtime event under 2s, poll in loop
    const to = setTimeout(() => {
      if (realtimeHeardRef.current) return;
      pollingRef.current = setInterval(async () => {
        const { data } = await supabase
          .from('orders')
          .select('status')
          .eq('id', orderId)
          .maybeSingle();
        if (data?.status) setStatus(data.status as OrderStatus);
      }, 2000);
    }, 2000);

    return () => {
      clearTimeout(to);
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      supabase.removeChannel(ch);
    };
  }, [orderId]);

  // Mapping status -> step (0=sent, 1=preparing/taken, 2=ready/done)
  const step = useMemo(() => {
    if (status === 'ready' || status === 'done' || status === 'served') return 2;
    if (status === 'taken' || status === 'preparing' || status === 'in_progress') return 1;
    return 0; // 'new' | 'pending' | 'sent' | 'cancelled'
  }, [status]);

  const message = useMemo(() => {
    if (step === 0) return 'YOUR ORDER HAS BEEN SENT TO YOUR FAVORITE BARISTA';
    if (step === 1) return 'YOUR ORDER IS BEING PREPARED WITH LOVE';
    return 'YOUR DRINK IS READY AND DYING TO MEET YOU!';
  }, [step]);

  // Convert status to uppercase for the new component
  const normalizedStatus = status.toUpperCase() as 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';

  return (
    <main className="max-w-md mx-auto px-4 py-10 text-center">
      {/* New polished waiting UI */}
      <WaitingClientUI status={normalizedStatus} statusMessage={message} />

      {/* Remove pickup code display as requested */}
      {loading && <p className="mt-4 text-sm text-neutral-500">LOADING…</p>}
    </main>
  );
}
