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

  useEffect(() => {
    let active = true;

    // Chargement initial
    load();

    // Écouter les changements de statut via localStorage et événements personnalisés
    const handleStatusChange = (event: CustomEvent) => {
      if (event.detail.orderId === orderId && active) {
        console.log('OrderStatus: Received status change via localStorage:', event.detail.status);
        setData(prev => {
          const updated = prev ? { ...prev, status: event.detail.status } : prev;
          console.log('OrderStatus: Updated data from localStorage:', updated);
          return updated;
        });
      }
    };

    // Écouter les événements personnalisés
    window.addEventListener('orderStatusChanged', handleStatusChange as EventListener);

    // Vérifier localStorage au chargement
    const orderKey = `order_status_${orderId}`;
    const storedStatus = localStorage.getItem(orderKey);
    if (storedStatus && active) {
      console.log('OrderStatus: Found status in localStorage:', storedStatus);
      setData(prev => {
        const updated = prev ? { ...prev, status: storedStatus as any } : prev;
        console.log('OrderStatus: Updated data from localStorage on load:', updated);
        return updated;
      });
    }

    // Polling automatique toutes les 5 secondes (fallback si Realtime ne fonctionne pas)
    const interval = setInterval(() => {
      if (active) {
        console.log('Polling for order status update...');
        load();
      }
    }, 5000);

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
      clearInterval(interval);
      window.removeEventListener('orderStatusChanged', handleStatusChange as EventListener);
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
