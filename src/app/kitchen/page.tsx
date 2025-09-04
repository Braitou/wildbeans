'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import KitchenBoard from './KitchenBoard';
import FullBleed from '@/components/layout/FullBleed';
import AdminGate from '@/components/auth/AdminGate';
import { AdminLogoutButton } from '@/components/auth/AdminGate';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';

type Event = {
  id: string;
  name: string;
  slug: string;
  kitchen_code: string;
  starts_at: string | null;
  ends_at: string | null;
  is_closed: boolean;
};

function KitchenPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get('code')?.trim() ?? '';
  
  const [fs, setFs] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function toggleFS() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setFs(true);
      } else {
        await document.exitFullscreen();
        setFs(false);
      }
    } catch {}
  }

  // Charger l'événement par code kitchen
  async function loadEventByCode(kitchenCode: string) {
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase
      .from('events')
      .select('id, name, slug, kitchen_code, starts_at, ends_at, is_closed')
      .eq('kitchen_code', kitchenCode)
      .maybeSingle();

    if (error) {
      console.error('Error loading event by kitchen code:', error);
      setError('Erreur lors du chargement de l\'événement');
      setLoading(false);
      return;
    }

    if (!data) {
      setError(`Code kitchen "${kitchenCode}" non trouvé`);
      setLoading(false);
      return;
    }

    setSelectedEvent(data);
    setLoading(false);
  }

  // Charger la liste des événements actifs
  async function loadActiveEvents() {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('events')
      .select('id, name, slug, kitchen_code, starts_at, ends_at, is_closed')
      .eq('is_closed', false)
      .order('starts_at', { ascending: false, nullsLast: true });

    if (error) {
      console.error('Error loading active events:', error);
      setError('Erreur lors du chargement des événements');
      setLoading(false);
      return;
    }

    setEvents(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (code) {
      loadEventByCode(code);
    } else {
      loadActiveEvents();
    }
  }, [code]);

  // Format de date pour l'affichage
  function formatDate(dateString: string | null) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Si on a un code et qu'on charge
  if (code && loading) {
    return (
      <AdminGate>
        <main className="py-4">
          <FullBleed>
            <div className="px-6 py-6">
              <div className="text-lg">Chargement de l'événement…</div>
            </div>
          </FullBleed>
        </main>
      </AdminGate>
    );
  }

  // Si on a un code mais une erreur
  if (code && error) {
    return (
      <AdminGate>
        <main className="py-4">
          <FullBleed>
            <div className="px-6 py-6">
              <div className="text-lg text-red-600 mb-4">{error}</div>
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

  // Si on a un code et un événement valide
  if (code && selectedEvent) {
    return (
      <AdminGate>
        <main className="py-4">
          <FullBleed>
            {/* Header plein écran avec info de l'événement */}
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
                  {fs ? 'Exit full screen' : 'Full screen'}
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

  // Liste des événements actifs (pas de code)
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
                {fs ? 'Exit full screen' : 'Full screen'}
              </button>
              <AdminLogoutButton />
            </div>
          </div>

          {/* Liste des événements */}
          <div className="px-6 pb-16">
            {loading ? (
              <div className="text-lg">Chargement des événements…</div>
            ) : events.length === 0 ? (
              <div className="text-lg text-neutral-500">Aucun événement actif trouvé.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((event) => (
                  <Card key={event.id} className="shadow-sm border-gray-200">
                    <CardHeader className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
                          <div className="text-sm text-neutral-500 mb-3">
                            {event.starts_at && (
                              <div>Début: {formatDate(event.starts_at)}</div>
                            )}
                            {event.ends_at && (
                              <div>Fin: {formatDate(event.ends_at)}</div>
                            )}
                          </div>
                          <div className="text-xs text-neutral-400">
                            Code: {event.kitchen_code}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => router.push(`/kitchen?code=${event.kitchen_code}`)}
                          className="flex-1"
                        >
                          Open Kitchen
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => window.open(`/kitchen?code=${event.kitchen_code}`, '_blank')}
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

export const dynamic = 'force-dynamic';

export default function KitchenPage() {
  return (
    <Suspense fallback={
      <AdminGate>
        <main className="py-4">
          <FullBleed>
            <div className="px-6 py-6">
              <div className="text-lg">Chargement…</div>
            </div>
          </FullBleed>
        </main>
      </AdminGate>
    }>
      <KitchenPageContent />
    </Suspense>
  );
}
