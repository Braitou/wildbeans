'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type OrderItemOption = { option_name: string; price_delta_cents: number };
type OrderItem = { id: string; item_name: string; qty: number; options: OrderItemOption[] };
type OrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'cancelled';
type Order = {
  id: string;
  event_id: string;
  pickup_code: string;
  customer_name: string | null;
  note: string | null;
  status: OrderStatus;
  created_at: string;
  total_cents: number;
  items: OrderItem[];
};

export default function KitchenBoard({
  eventId,
  density = 'comfortable',
  statusFilter = 'active', // 'active' | 'all'
}: {
  eventId?: string;
  density?: 'comfortable' | 'compact';
  statusFilter?: 'active' | 'all';
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      console.log('[KitchenBoard] load start', { eventId });
      let q = supabase
        .from('orders')
        .select(`
          id,
          event_id,
          pickup_code,
          customer_name,
          note,
          status,
          created_at,
          total_cents,
          items:order_items(
            id,
            item_name,
            qty,
            options:order_item_options(
              option_name,
              price_delta_cents
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (eventId) {
        q = q.eq('event_id', eventId);
      }

      const { data, error } = await q;
      if (error) {
        console.error('[KitchenBoard] load error:', error);
        return;
      }
      if (Array.isArray(data)) {
        console.log('[KitchenBoard] load ok; count=', data.length);
        console.log('[KitchenBoard] sample order data:', data[0]);
        setOrders(data as Order[]);
      }
    } catch (err) {
      console.error('[KitchenBoard] load fatal:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();

    // Realtime: INSERT & UPDATE on orders (filtered by event if present)
    const channelName = `kitchen-orders-${eventId ?? 'all'}`;
    console.log('[KitchenBoard] subscribe', channelName);

    const chan = supabase
      .channel(channelName, { config: { broadcast: { ack: true } } })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          ...(eventId ? { filter: `event_id=eq.${eventId}` } : {}),
        },
        (payload) => {
          console.log('[KitchenBoard] realtime INSERT payload:', payload);
          // reload to get items & relations
          void load();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          ...(eventId ? { filter: `event_id=eq.${eventId}` } : {}),
        },
        (payload) => {
          console.log('[KitchenBoard] realtime UPDATE payload:', payload);
          const updatedId = (payload.new as any)?.id as string | undefined;
          const nextStatus = (payload.new as any)?.status as OrderStatus | undefined;
          if (!updatedId || !nextStatus) return;

          // update optimiste si la commande est déjà en mémoire
          setOrders((prev) => {
            const idx = prev.findIndex((o) => o.id === updatedId);
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = { ...next[idx], status: nextStatus };
            return next;
          });
        }
      )
      .subscribe((st) => {
        console.log('[KitchenBoard] subscribe status:', st);
      });

    return () => {
      console.log('[KitchenBoard] unsubscribe', channelName);
      supabase.removeChannel(chan);
    };
  }, [eventId]);

  // REFRESH "TIME AGO" EVERY 30S
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((x) => x + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // filtres
  const filtered = useMemo(() => {
    if (statusFilter === 'active') {
      return orders.filter((o) => ['new', 'preparing', 'ready'].includes(o.status));
    }
    return orders;
  }, [orders, statusFilter]);

  const cols = useMemo(
    () => ({
      new: filtered.filter((o) => o.status === 'new'),
      preparing: filtered.filter((o) => o.status === 'preparing'),
      ready: filtered.filter((o) => o.status === 'ready'),
    }),
    [filtered]
  );

  function timeAgo(iso: string) {
    const d = new Date(iso).getTime();
    const diff = Math.max(0, Date.now() - d);
    const m = Math.round(diff / 60000);
    if (m < 1) return "JUST NOW";
    if (m === 1) return '1 MIN AGO';
    if (m < 60) return `${m} MIN AGO`;
    const h = Math.round(m / 60);
    return h === 1 ? '1 H AGO' : `${h} H AGO`;
    // (you can add days if you want)
  }

  async function move(orderId: string, next: OrderStatus) {
    console.log('[KitchenBoard] move →', { orderId, next });

    // immediate local signal (fallback inter-tabs)
    const orderKey = `order_status_${orderId}`;
    try {
      localStorage.setItem(orderKey, next);
      window.dispatchEvent(new CustomEvent('orderStatusChanged', { detail: { orderId, status: next } }));
    } catch {}

    // update DB + retourne la/les lignes mises à jour
    const { data, error } = await supabase
      .from('orders')
      .update({ status: next })
      .eq('id', orderId)
      .select('id, status'); // <= important pour vérifier qu’une row a bien été modifiée

    console.log('[KitchenBoard] move result:', { data, error });

    if (error) {
      console.error('[KitchenBoard] update error:', error);
      alert('ERROR: ' + error.message);
      return;
    }
    if (!data || data.length === 0) {
      console.warn('[KitchenBoard] update: no rows returned (RLS ? wrong id ?)');
      return;
    }

    // immediate local update (without waiting for realtime)
    setOrders((prev) =>
      prev
        .map((o) => (o.id === orderId ? { ...o, status: next } : o))
        .filter((o) => ['new', 'preparing', 'ready', 'served', 'cancelled'].includes(o.status))
    );
  }

  const title = (k: keyof typeof cols) =>
    k === 'new' ? 'NEW' : k === 'preparing' ? 'PREPARING' : 'READY';

  const statusTone = (s: OrderStatus) =>
    s === 'new'
      ? 'bg-amber-100 text-amber-900'
      : s === 'preparing'
      ? 'bg-blue-100 text-blue-900'
      : s === 'ready'
      ? 'bg-emerald-100 text-emerald-900'
      : 'bg-gray-100 text-gray-800';

  if (loading) return <div className="p-8 text-lg">LOADING…</div>;

  // density
  const pad = density === 'compact' ? 'p-4' : 'p-6';
  const gap = density === 'compact' ? 'gap-3' : 'gap-4';
  const line = density === 'compact' ? 'leading-5' : 'leading-6';
  const fontBase = density === 'compact' ? 'text-[13px]' : 'text-[15px]';

  return (
    <div className="px-6 pb-16">
      {/* 1 col mobile, 2 cols ≥1024px (lg), 3 cols ≥1360px (custom), 4 cols ≥1600px */}
      <div className="grid grid-cols-1 lg:grid-cols-2 [@media(min-width:1360px)]:grid-cols-3 [@media(min-width:1600px)]:grid-cols-4 gap-10">
        {(Object.keys(cols) as Array<keyof typeof cols>).map((k) => (
          <section key={k} className="flex flex-col min-h-[65vh]">
            {/* sticky column header */}
            <div className="sticky top-0 z-10 bg-white pt-2 pb-3">
              <h2 className="text-sm font-semibold tracking-[0.18em] uppercase text-neutral-600">
                {title(k)}
              </h2>
              <div className="text-xs text-neutral-400">{cols[k].length} ORDER(S)</div>
            </div>

            <div className="mt-2 space-y-8">
              {cols[k].map((o) => (
                <Card key={o.id} className="shadow-sm border-gray-200">
                  <CardHeader className={`${pad} pb-0`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl font-semibold tracking-wider">{o.pickup_code}</div>
                        <span
                          className={`inline-flex items-center px-2.5 py-1.5 text-xs rounded-full ${statusTone(
                            o.status
                          )}`}
                        >
                          {o.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-neutral-500">{timeAgo(o.created_at)}</div>
                    </div>
                    {o.customer_name && (
                      <div className="mt-2 text-[15px] text-neutral-600">{o.customer_name}</div>
                    )}
                  </CardHeader>

                  <CardContent className={`${pad} ${fontBase} ${line} ${gap}`}>
                    <ul className="space-y-1.5">
                      {o.items?.map((it) => (
                        <li key={it.id} className="flex gap-3">
                          <span className="min-w-7 text-right">{it.qty}×</span>
                          <div className="flex-1">
                            <div className="font-medium text-[16px] flex items-center gap-2">
                              {it.item_name.toUpperCase()}
                              {it.options && it.options.length > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  {it.options.length} opt.
                                </span>
                              )}
                            </div>
                            {it.options && it.options.length > 0 ? (
                              <div className="text-neutral-600 text-sm mt-1">
                                {it.options.map((op) => op.option_name.toUpperCase()).join(', ')}
                              </div>
                            ) : (
                              <div className="text-neutral-400 text-sm mt-1">NO OPTIONS</div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>

                    {o.note && <div className="mt-3 text-[15px] italic text-neutral-700">« {o.note} »</div>}

                    <div className="flex flex-wrap gap-3 pt-5">
                      {o.status === 'new' && (
                        <>
                          <Button className="h-12 px-5 text-[15px]" onClick={() => move(o.id, 'preparing')}>
                            TAKE
                          </Button>
                          <Button
                            className="h-12 px-5 text-[15px]"
                            variant="outline"
                            onClick={() => move(o.id, 'cancelled')}
                          >
                            CANCEL
                          </Button>
                        </>
                      )}
                      {o.status === 'preparing' && (
                        <>
                          <Button className="h-12 px-5 text-[15px]" onClick={() => move(o.id, 'ready')}>
                            READY
                          </Button>
                          <Button
                            className="h-12 px-5 text-[15px]"
                            variant="outline"
                            onClick={() => move(o.id, 'cancelled')}
                          >
                            CANCEL
                          </Button>
                        </>
                      )}
                      {o.status === 'ready' && (
                        <Button className="h-12 px-5 text-[15px]" onClick={() => move(o.id, 'served')}>
                                                      SERVED
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!cols[k].length && <div className="text-sm text-neutral-400">NO ORDERS HERE.</div>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
