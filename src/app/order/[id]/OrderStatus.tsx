// app/order/[id]/OrderStatus.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import CoffeeStatus from '@/components/status/CoffeeStatus';
import TopProgress from '@/components/status/TopProgress';

type OrderJson = {
  id: string;
  pickup_code: string;
  status: 'new'|'preparing'|'ready'|'served'|'cancelled';
  items: { id: string; item_name: string; qty: number; options: { name: string }[] }[];
};

export default function OrderStatus({ orderId }: { orderId: string }) {
  const [data, setData] = useState<OrderJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [testMessage, setTestMessage] = useState<string>('');

  const load = useCallback(async () => {
    console.log('Loading order data for:', orderId);
    const { data, error } = await supabase.rpc('public_get_order', { p_order_id: orderId });
    if (error) {
      console.error('Error loading order:', error);
    } else if (data && Object.keys(data).length) {
      console.log('Order data loaded:', data);
      setData(data as OrderJson);
    } else {
      console.log('No order data found');
    }
    setLoading(false);
  }, [orderId]);

  // Fonction de test pour mettre à jour le statut
  const testUpdateStatus = async (newStatus: 'preparing' | 'ready') => {
    try {
      setTestMessage(`Testing update to ${newStatus}...`);
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) {
        setTestMessage(`Error: ${error.message}`);
        console.error('Update error:', error);
      } else {
        setTestMessage(`Successfully updated to ${newStatus}!`);
        console.log(`Status updated to ${newStatus}`);
      }
    } catch (err) {
      setTestMessage(`Error: ${err}`);
      console.error('Test error:', err);
    }
  };

  useEffect(() => {
    let active = true;

    // Chargement initial
    load();

    // Abonnement Realtime
    console.log('Setting up Realtime for order:', orderId);
    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        console.log('Realtime payload received:', payload);
        const next = (payload.new as any)?.status;
        if (next && active) {
          console.log('Order status changed:', next);
          setData(prev => {
            const updated = prev ? { ...prev, status: next } : prev;
            console.log('Updated data:', updated);
            return updated;
          });
        }
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up Realtime for order:', orderId);
      active = false;
      supabase.removeChannel(channel);
    };
  }, [orderId, load]);

  const status = (data?.status ?? 'new') as OrderJson['status'];
  console.log('Current status:', status);

  // Barre de progression
  const progress = useMemo(() => {
    switch (status) {
      case 'new': return 0.33;
      case 'preparing': return 0.66;
      case 'ready': return 1;
      default: return 1;
    }
  }, [status]);

  // ✅ Nouveaux messages
  const topMessage = useMemo(() => {
    if (status === 'ready') return 'Your drink is ready and dying to meet you!';
    if (status === 'preparing') return 'Your order is being prepared with love';
    if (status === 'cancelled') return 'Your order has been cancelled';
    // 'new' (commande tout juste envoyée)
    return 'Your order has been sent to your favorite barista';
  }, [status]);

  return (
    <section className="relative">
      <TopProgress value={progress} />

      {/* Remplace l'ancien bloc pickup par la phrase demandée */}
      <div className="pt-10 pb-3 flex flex-col items-center text-center gap-1">
        <div className="text-[13px] tracking-[0.18em] uppercase text-neutral-500">
          {/* on ne montre plus "Pickup code" */}
          {/* (vide intentionnellement) */}
        </div>
        <div className="text-sm md:text-base text-neutral-800">
          All good... It's not in your hands anymore.
        </div>
      </div>

      {/* 👉 Message AU-DESSUS de la tasse */}
      <p className="mt-4 mb-2 text-center text-[18px] font-semibold">
        {topMessage}
      </p>

      {/* Boutons de test pour le debug */}
      <div className="mt-4 flex justify-center gap-4">
        <button
          onClick={() => testUpdateStatus('preparing')}
          className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
        >
          Test → Preparing
        </button>
        <button
          onClick={() => testUpdateStatus('ready')}
          className="px-4 py-2 bg-green-500 text-white rounded text-sm"
        >
          Test → Ready
        </button>
      </div>
      
      {testMessage && (
        <p className="mt-2 text-center text-sm text-gray-600">
          {testMessage}
        </p>
      )}

      {/* Tasse animée */}
      <CoffeeStatus status={status} loading={loading} />

      {/* Détails boisson (facultatif) */}
      {data?.items?.length ? (
        <div className="mt-8 max-w-md mx-auto text-left">
          <h3 className="mb-2 text-xs font-semibold tracking-[0.18em] uppercase text-neutral-500">
            Your drink
          </h3>
          <ul className="divide-y divide-gray-200 border-y border-gray-200">
            {data.items.map((it) => (
              <li key={it.id} className="py-3">
                <div className="font-medium">{it.qty}× {it.item_name}</div>
                {it.options?.length ? (
                  <div className="text-sm text-neutral-600">
                    {it.options.map(o => o.name).join(', ')}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
