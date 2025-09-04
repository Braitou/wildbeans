'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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

    // Fallback: si aucun event realtime sous 2s, on poll en boucle
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
    if (step === 0) return 'Your order has been sent to your favorite barista';
    if (step === 1) return 'Your order is being prepared with love';
    return 'Your drink is ready and dying to meet you!';
  }, [step]);

  return (
    <main className="max-w-md mx-auto px-4 py-10 text-center">
      {/* Dots */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {[0,1,2].map(i => (
          <span key={i} className={`h-2 w-2 rounded-full ${i <= step ? 'bg-black' : 'bg-gray-300'}`} />
        ))}
      </div>

      {/* Message au-dessus de la tasse */}
      <h1 className="mb-6 text-xl font-semibold">{message}</h1>

      {/* Zone visuelle tasse/loader si tu en as un */}
      <div className="mb-10 h-32 border rounded-md flex items-center justify-center">
        <span className="text-sm uppercase tracking-wide">{status}</span>
      </div>

      {pickup && (
        <p className="text-sm text-neutral-600">
          Pickup code: <span className="font-medium">{pickup}</span>
        </p>
      )}
      {loading && <p className="mt-4 text-sm text-neutral-500">Loading…</p>}
    </main>
  );
}
