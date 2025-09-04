'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type OrderItemOption = { option_name: string; price_delta_cents: number };
type OrderItem = { id: string; item_name: string; qty: number; options: OrderItemOption[] };
type Order = {
  id: string;
  event_id: string;
  pickup_code: string;
  customer_name: string | null;
  note: string | null;
  status: 'new' | 'preparing' | 'ready' | 'served' | 'cancelled';
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
            options:order_item_options(option_name, price_delta_cents)
          )
        `)
        .order('created_at', { ascending: false });

      if (eventId) {
        q = q.eq('event_id', eventId);
      }

      const { data, error } = await q;
      
      if (error) {
        console.error('Error loading orders:', error);
        return;
      }
      
      if (Array.isArray(data)) {
        setOrders(data as Order[]);
      }
    } catch (err) {
      console.error('Error in load function:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    
    // Créer un channel Realtime pour écouter les changements
    const channelName = `kitchen-orders-${eventId ?? 'all'}`;
    const chan = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders',
          ...(eventId ? { filter: `event_id=eq.${eventId}` } : {})
        }, 
        () => load()
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders',
          ...(eventId ? { filter: `event_id=eq.${eventId}` } : {})
        }, 
        (payload) => {
          // petit update local si la commande est déjà en mémoire, sinon fallback load()
          setOrders(prev => {
            const idx = prev.findIndex(o => o.id === payload.new.id);
            if (idx === -1) return prev; // on laisse INSERT déclencher load()
            const next = [...prev];
            next[idx] = { ...next[idx], status: payload.new.status };
            return next;
          });
        }
      )
      .subscribe();

    // Nettoyer le channel au return
    return () => {
      supabase.removeChannel(chan);
    };
  }, [eventId]);

  // refresh "time ago" toutes les 30s
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((x) => x + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // filtres
  const filtered = useMemo(() => {
    if (statusFilter === 'active') {
      return orders.filter(o => ['new','preparing','ready'].includes(o.status));
    }
    return orders;
  }, [orders, statusFilter]);

  const cols = useMemo(
    () => ({
      new: filtered.filter(o => o.status === 'new'),
      preparing: filtered.filter(o => o.status === 'preparing'),
      ready: filtered.filter(o => o.status === 'ready'),
    }),
    [filtered]
  );

  function timeAgo(iso: string) {
    const d = new Date(iso).getTime();
    const diff = Math.max(0, Date.now() - d);
    const m = Math.round(diff / 60000);
    if (m < 1) return 'à l\'instant';
    if (m === 1) return 'il y a 1 min';
    if (m < 60) return `il y a ${m} min`;
    const h = Math.round(m / 60);
    return h === 1 ? 'il y a 1 h' : `il y a ${h} h`;
  }

  async function move(orderId: string, next: Order['status']) {
    console.log(`Kitchen: Attempting to move order ${orderId} to status: ${next}`);
    
    // Mise à jour dans localStorage pour communication immédiate
    const orderKey = `order_status_${orderId}`;
    localStorage.setItem(orderKey, next);
    
    // Déclencher un événement personnalisé pour notifier les autres pages
    window.dispatchEvent(new CustomEvent('orderStatusChanged', {
      detail: { orderId, status: next }
    }));
    
    const { error } = await supabase
      .from('orders')
      .update({ status: next })
      .eq('id', orderId);
      
    if (error) {
      console.error('Error updating order status:', error);
      alert('Erreur: ' + error.message);
      return;
    }
    
    console.log(`Kitchen: Successfully moved order ${orderId} to status: ${next}`);
    setOrders((prev) =>
      prev
        .map((o) => (o.id === orderId ? { ...o, status: next } : o))
        .filter((o) => ['new', 'preparing', 'ready', 'served', 'cancelled'].includes(o.status))
    );
  }

  const title = (k: keyof typeof cols) =>
    k === 'new' ? 'Nouvelles' : k === 'preparing' ? 'En préparation' : 'Prêtes';

  const statusTone = (s: Order['status']) =>
    s === 'new' ? 'bg-amber-100 text-amber-900'
    : s === 'preparing' ? 'bg-blue-100 text-blue-900'
    : s === 'ready' ? 'bg-emerald-100 text-emerald-900'
    : 'bg-gray-100 text-gray-800';

  if (loading) return <div className="p-8 text-lg">Chargement…</div>;

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
            {/* header de colonne sticky */}
            <div className="sticky top-0 z-10 bg-white pt-2 pb-3">
              <h2 className="text-sm font-semibold tracking-[0.18em] uppercase text-neutral-600">
                {title(k)}
              </h2>
              <div className="text-xs text-neutral-400">{cols[k].length} commande(s)</div>
            </div>

            <div className="mt-2 space-y-8">
              {cols[k].map((o) => (
                <Card key={o.id} className="shadow-sm border-gray-200">
                  <CardHeader className={`${pad} pb-0`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {/* code plus grand */}
                        <div className="text-4xl font-semibold tracking-wider">{o.pickup_code}</div>
                        <span className={`inline-flex items-center px-2.5 py-1.5 text-xs rounded-full ${statusTone(o.status)}`}>
                          {o.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-neutral-500">{timeAgo(o.created_at)}</div>
                    </div>
                    {o.customer_name && (
                      <div className="mt-2 text-[15px] text-neutral-600">
                        {o.customer_name}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className={`${pad} ${fontBase} ${line} ${gap}`}>
                    <ul className="space-y-1.5">
                      {o.items?.map((it) => (
                        <li key={it.id} className="flex gap-3">
                          <span className="min-w-7 text-right">{it.qty}×</span>
                          <div>
                            <div className="font-medium text-[16px]">{it.item_name}</div>
                            {it.options?.length ? (
                              <div className="text-neutral-600">
                                {it.options.map((op) => op.option_name).join(', ')}
                              </div>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>

                    {o.note && (
                      <div className="mt-3 text-[15px] italic text-neutral-700">
                        « {o.note} »
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-5">
                      {o.status === 'new' && (
                        <>
                          <Button className="h-12 px-5 text-[15px]" onClick={() => move(o.id, 'preparing')}>
                            Prendre
                          </Button>
                          <Button className="h-12 px-5 text-[15px]" variant="outline" onClick={() => move(o.id, 'cancelled')}>
                            Annuler
                          </Button>
                        </>
                      )}
                      {o.status === 'preparing' && (
                        <>
                          <Button className="h-12 px-5 text-[15px]" onClick={() => move(o.id, 'ready')}>
                            Prêt
                          </Button>
                          <Button className="h-12 px-5 text-[15px]" variant="outline" onClick={() => move(o.id, 'cancelled')}>
                            Annuler
                          </Button>
                        </>
                      )}
                      {o.status === 'ready' && (
                        <Button className="h-12 px-5 text-[15px]" onClick={() => move(o.id, 'served')}>
                          Servi
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!cols[k].length && (
                <div className="text-sm text-neutral-400">Aucune commande ici.</div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
