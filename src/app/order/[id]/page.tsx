'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import StepDots from '@/components/order/StepDots';
import CoffeeStatus from '@/components/status/CoffeeStatus';

type OrderStatus = 'pending' | 'sent' | 'taken' | 'preparing' | 'ready';

export default function OrderStatusPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const orderId = params.id;                         // <-- l'UUID de la commande
  const pickup = search.get('pickup') || undefined;  // facultatif, pour afficher le code

  const [status, setStatus] = useState<OrderStatus>('pending');
  const [loading, setLoading] = useState(true);

  // 1) Fetch initial
  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status')
        .eq('id', orderId)
        .maybeSingle();
      if (!error && data && active) {
        setStatus((data.status as OrderStatus) || 'pending');
      }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [orderId]);

  // 2) Realtime abonné à CET id
  useEffect(() => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        const next = (payload.new as any)?.status as OrderStatus | undefined;
        if (next) setStatus(next);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // 3) Mapping status → étape (0..2) + message
  const step = useMemo(() => {
    // adapte ce mapping si kitchen met 'in_progress'/'done'
    if (status === 'ready') return 2;
    if (status === 'taken' || status === 'preparing' /* || status === 'in_progress' */) return 1;
    return 0; // 'pending' | 'sent'
  }, [status]);

  const message = useMemo(() => {
    if (step === 0) return 'Your order has been sent to your favorite barista';
    if (step === 1) return 'Your order is being prepared with love';
    return 'Your drink is ready and dying to meet you!';
  }, [step]);

  // Mapping des statuts pour CoffeeStatus
  const coffeeStatus = useMemo(() => {
    if (status === 'ready') return 'ready';
    if (status === 'taken' || status === 'preparing') return 'preparing';
    return 'new';
  }, [status]);

  // Affichage UI
  return (
    <main className="max-w-md mx-auto px-4 py-10 text-center">
      {/* Barre d'étapes 0..2 */}
      <div className="mb-6">
        <StepDots total={3} index={step} />
      </div>

      {/* Message (au-dessus de la tasse) */}
      <h1 className="mb-6 text-xl font-semibold">{message}</h1>

      {/* Tasse/animation */}
      <div className="mb-10">
        <CoffeeStatus status={coffeeStatus} loading={loading} />
      </div>

      {/* Optionnel: afficher le pickup différemment */}
      {pickup && (
        <p className="text-sm text-neutral-600">
          Pickup code: <span className="font-medium">{pickup}</span>
        </p>
      )}

      {loading && <p className="mt-4 text-sm text-neutral-500">Loading…</p>}
    </main>
  );
}
