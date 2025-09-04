'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import FullBleed from '@/components/layout/FullBleed';
import AdminGate, { AdminLogoutButton } from '@/components/auth/AdminGate';
import KitchenBoard from './KitchenBoard';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

type EventRow = {
  id: string;
  name: string;
  slug: string;
  kitchen_code: string;
  starts_at: string | null;
  ends_at: string | null;
  is_closed: boolean;
};

function formatDateFR(dateString: string | null) {
  if (!dateString) return null;
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function KitchenPageContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const kitchenCode = (sp.get('code') || '').trim();

  const [isFS, setIsFS] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);

  const hasCode = useMemo(() => kitchenCode.length > 0, [kitchenCode]);

  const toggleFS = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFS(true);
      } else {
        await document.exitFullscreen();
        setIsFS(false);
      }
    } catch {
      // noop
    }
  }, []);

  const loadEventByCode = useCallback(async (code: string) => {
    setLoading(true);
    setErrorMsg(null);
    console.log('[Kitchen] loadEventByCode:', code);

    const { data, error } = await supabase
      .from('events')
      .select('id, name, slug, kitchen_code, starts_at, ends_at, is_closed')
      .eq('kitchen_code', code)
      .maybeSingle();

    if (error) {
      console.error('[Kitchen] error loadEventByCode:', error);
      setErrorMsg('Erreur lors du chargement de l’événement');
      setSelectedEvent(null);
      setLoading(false);
      return;
    }
    if (!data) {
      setErrorMsg(`Code kitchen "${code}" introuvable`);
      setSelectedEvent(null);
      setLoading(false);
      return;
    }
    setSelectedEvent(data);
    setLoading(false);
  }, []);

  const loadActiveEvents = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    console.log('[Kitchen] loadActiveEvents');

    const { data, error } = await supabase
      .from('events')
      .select('id, name, slug, kitchen_code, starts_at, ends_at, is_closed')
      .eq('is_closed', false)
      .order('starts_at', { ascending: false, nullsLast: true });

    if (error) {
      console.error('[Kitchen] error loadActiveEvents:', error);
      setErrorMsg('Erreur lors du chargement des événements');
      setEvents([]);
      setLoading(false);
      return;
    }
    setEvents(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (hasCode) {
      void loadEventByCode(kitchenCode);
    } else {
      void loadActiveEvents();
    }
  }, [hasCode, kitchenCode, loadEventByCode, loadActiveEvents]);

  // ---------- Rendus conditionnels ----------

  // Avec code – en cours de chargement
  if (hasCode && loading) {
    return (
      <AdminGate>
        <main className="py-4">
          <FullBleed>
            <div className="px-6 py-6">
              <div className="text-lg">Chargement de l’événement…</div>
            </div>
          </FullBleed>
        </main>
      </AdminGate>
    );
  }

  // Avec code – erreur
  if (hasCode && errorMsg) {
    return (
      <AdminGate>
        <main className="py-4">
          <FullBleed>
            <div className="px-6 py-6 space-y-4">
              <div className="text-lg text-red-600">{errorMsg}</div>
              <Button
                onClick={() => router.push('/kitchen')}
                className="inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to events
              </Button>
            </div>
          </FullBleed>
        </main>
      </AdminGate>
    );
  }

  // Avec code – événement trouvé
  if (hasCode && selectedEvent) {
    return (
      <AdminGate>
        <main className="py-4">
          <FullBleed>
            {/* Header plein écran */}
            <div className="px-6 py-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-2">
                <div className="text-3xl font-semibold uppercase tracking-widest">
                  Wild Beans — Kitchen
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-lg text-neutral-600">
                    Event: {selectedEvent.name}
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-neutral-100 text-neutral-700">
                    code: {selectedEvent.kitchen_code}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => router.push('/kitchen')}
                  variant="outline"
                  className="inline-flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to events
                </Button>
                <button
                  onClick={toggleFS}
                  className="h-11 px-4 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {isFS ? 'Exit full screen' : 'Full screen'}
                </button>
                <AdminLogoutButton />
              </div>
            </div>

            {/* Board plein écran */}
            <KitchenBoard eventId={selectedEvent.id} />
          </FullBleed>
        </main>
      </AdminGate>
    );
  }

  // Sans code – liste des événements actifs
  return (
    <AdminGate>
      <main className="py-4">
        <FullBleed>
          {/* Header plein écran */}
          <div className="px-6 py-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-3xl font-semibold uppercase tracking-widest">
              Wild Beans — Kitchen
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={toggleFS}
                className="h-11 px-4 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {isFS ? 'Exit full screen' : 'Full screen'}
              </button>
              <AdminLogoutButton />
            </div>
          </div>

          {/* Liste des événements */}
          <div className="px-6 pb-16">
            {loading ? (
              <div className="text-lg">Chargement des événements…</div>
            ) : errorMsg ? (
              <div className="text-lg text-red-600">{errorMsg}</div>
            ) : events.length === 0 ? (
              <div className="text-lg text-neutral-500">Aucun événement actif trouvé.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((ev) => (
                  <Card key={ev.id} className="shadow-sm border-gray-200">
                    <CardHeader className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">{ev.name}</h3>
                          <div className="text-sm text-neutral-500 mb-3 space-y-1">
                            {ev.starts_at && <div>Début : {formatDateFR(ev.starts_at)}</div>}
                            {ev.ends_at && <div>Fin : {formatDateFR(ev.ends_at)}</div>}
                          </div>
                          <div className="text-xs text-neutral-400">
                            Code: {ev.kitchen_code}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <div className="flex gap-3">
                        <Button
                          onClick={() => router.push(`/kitchen?code=${encodeURIComponent(ev.kitchen_code)}`)}
                          className="flex-1"
                        >
                          Open Kitchen
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open(`/kitchen?code=${encodeURIComponent(ev.kitchen_code)}`, '_blank', 'noopener,noreferrer')}
                          className="inline-flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </FullBleed>
      </main>
    </AdminGate>
  );
}

export default function KitchenPage() {
  return (
    <Suspense
      fallback={
        <AdminGate>
          <main className="py-4">
            <FullBleed>
              <div className="px-6 py-6">
                <div className="text-lg">Chargement…</div>
              </div>
            </FullBleed>
          </main>
        </AdminGate>
      }
    >
      <KitchenPageContent />
    </Suspense>
  );
}
