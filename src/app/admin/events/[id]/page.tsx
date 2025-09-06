'use client';
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import AdminGate from '@/components/auth/AdminGate';
import AdminHeader from '@/components/layout/AdminHeader';
import EventTabs from '@/components/admin/EventTabs';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

type EventForm = {
  id?: string | null;
  name: string;
  slug: string;
  join_code: string;
  kitchen_code: string;
  starts_at: string | null; // ISO
  ends_at: string | null;   // ISO
};

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = params.id;
  const isNew = id === 'new';

  const [form, setForm] = useState<EventForm>({
    id: null,
    name: '',
    slug: '',
    join_code: '',
    kitchen_code: '',
    starts_at: null,
    ends_at: null,
  });
  const [loading, setLoading] = useState<boolean>(!!(!isNew));
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [origin, setOrigin] = useState('');

  // QR code
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrUrl = useMemo(() => (origin && form.slug && form.join_code)
    ? `${origin}/e/${encodeURIComponent(form.slug)}?join=${encodeURIComponent(form.join_code)}`
    : '', [origin, form.slug, form.join_code]);

  // Kitchen link
  const kitchenUrl = useMemo(() =>
    form.kitchen_code && origin ? `${origin}/kitchen?code=${encodeURIComponent(form.kitchen_code)}` : ''
  , [origin, form.kitchen_code]);

  function downloadQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `wildbeans-qr-${form.slug || 'event'}.png`;
    link.click();
  }

  // util : slugify à partir du nom (simple)
  function slugify(s: string) {
    return s
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  const loadEvent = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('id,name,slug,join_code,kitchen_code,starts_at,ends_at')
      .eq('id', id)
      .maybeSingle();

    setLoading(false);

    if (error) {
      console.error(error);
      toast.error('ERROR LOADING');
      return;
    }
    if (data) {
      setForm({
        id: data.id,
        name: data.name ?? '',
        slug: data.slug ?? '',
        join_code: data.join_code ?? '',
        kitchen_code: data.kitchen_code ?? '',
        starts_at: data.starts_at,
        ends_at: data.ends_at,
      });
    }
  }, [id, isNew]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  // Définir l'origine pour le QR code
  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  // Auto-générer slug si vide (uniquement pour nouveaux events)
  useEffect(() => {
    if (!isNew) return;
    setForm((f) => {
      if (!f.name || slugTouched || f.slug) return f;
      const next = {
        ...f,
        slug: slugify(f.name),
      };
      return next;
    });
  }, [form.name, isNew, slugTouched]);

  async function save() {
    if (!form.name || !form.slug) {
      toast.error('NAME AND SLUG ARE REQUIRED');
      return;
    }

    // Sanity check env
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      toast.error('MISSING SUPABASE CONFIG (URL/ANON KEY).');
      return;
    }

    setSaving(true);
    try {
      // Construire le payload de base
      const payload: any = {
        id: isNew ? null : form.id,
        name: form.name,
        slug: form.slug,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      };

      // Ajouter join_code seulement si non vide
      if (form.join_code?.trim()) {
        payload.join_code = form.join_code.trim();
      }

      // Ajouter kitchen_code seulement si non vide
      if (form.kitchen_code?.trim()) {
        payload.kitchen_code = form.kitchen_code.trim();
      }

      const { data, error } = await supabase.rpc('admin_upsert_event', payload);
      
      if (error) {
        console.error('admin_upsert_event error:', error);
        const msg = (error as { message?: string; hint?: string; details?: string })?.message || 
                   (error as { message?: string; hint?: string; details?: string })?.hint || 
                   (error as { message?: string; hint?: string; details?: string })?.details || 
                   'Unknown error';
        if (String(msg).includes('SLUG_TAKEN')) {
          toast.error('THIS SLUG IS ALREADY USED, CHOOSE ANOTHER ONE.');
        } else if ((error as { code?: string })?.code === 'PGRST202') {
          toast.error('RPC FUNCTION NOT FOUND. RELOAD THE SCHEMA IN SUPABASE (NOTIFY pgrst, \'reload schema\').');
        } else {
          toast.error(`Error during save: ${msg}`);
        }
        return;
      }      

      toast.success('SAVED ✅');

      // rediriger sur la page de l'event fraichement créé si c'était "new"
      if (isNew && data?.id) {
        router.replace(`/admin/events/${data.id}`);
      } else {
        // recharger
        loadEvent();
      }
    } finally {
      setSaving(false);
    }
  }

  async function closeEvent() {
    setClosing(true);
    const { error } = await supabase.rpc('admin_close_event', { event_id: isNew ? null : id });
    setClosing(false);
    if (error) {
      toast.error('ERROR: ' + error.message);
      return;
    }
    toast.success('EVENT CLOSED ✅');
    loadEvent();
  }

  if (loading) {
    return (
      <AdminGate>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">LOADING…</div>
        </main>
      </AdminGate>
    );
  }

  return (
    <AdminGate>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <AdminHeader title="EVENT" />
        
        {/* Bouton Back to events */}
        <button
          onClick={() => router.push('/admin/events')}
          className="mb-4 inline-flex items-center gap-2 h-10 px-3 border rounded-none hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          BACK TO EVENTS
        </button>
        
        <div className="flex items-center justify-between mb-2">
          {!isNew && <EventTabs id={id} />}
          {!isNew && (
            <button
              onClick={closeEvent}
              disabled={closing}
              className="h-10 px-3 border rounded-none hover:bg-gray-50"
            >
              {closing ? 'CLOSING…' : 'CLOSE EVENT'}
            </button>
          )}
        </div>

        <section className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm">NAME</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="WEDDING CLAIRE & MAX"
              className="h-11 px-3 border border-gray-300 rounded-none"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">SLUG (URL)</label>
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value });
              }}
              placeholder="wedding-claire-max"
              className="h-11 px-3 border border-gray-300 rounded-none"
            />
            <p className="text-xs text-neutral-500">URL : /e/{'{slug}'}?join={'{code}'}</p>
          </div>

          <div className="grid gap-2">
            <label className="text-sm">CODE JOIN (CLIENT)</label>
            <input
              value={form.join_code}
              onChange={(e) => setForm({ ...form, join_code: e.target.value })}
              placeholder="WB1"
              className="h-11 px-3 border border-gray-300 rounded-none"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">CODE KITCHEN (BARISTA)</label>
            <input
              value={form.kitchen_code}
              onChange={(e) => setForm({ ...form, kitchen_code: e.target.value })}
              placeholder="KITCHEN1"
              className="h-11 px-3 border border-gray-300 rounded-none"
            />
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm">START (OPTIONAL)</label>
              <input
                type="datetime-local"
                value={form.starts_at ?? ''}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value || null })}
                className="h-11 px-3 border border-gray-300 rounded-none"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">END (OPTIONAL)</label>
              <input
                type="datetime-local"
                value={form.ends_at ?? ''}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value || null })}
                className="h-11 px-3 border border-gray-300 rounded-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="h-11 px-5 rounded-none bg-black text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? 'SAVING…' : 'SAVE'}
            </button>
          </div>
        </section>

        {/* QR Code Section */}
        <section className="mt-6 border rounded-none p-4">
          <div className="text-sm font-semibold mb-2">EVENT QR</div>
          {qrUrl ? (
            <div className="flex items-center gap-4">
              <div className="p-3 border rounded-none">
                <QRCodeCanvas value={qrUrl} size={192} includeMargin ref={canvasRef} />
              </div>
              <div className="space-y-2">
                <div className="text-sm break-all">{qrUrl}</div>
                <button onClick={downloadQR} className="h-10 px-3 border rounded-none hover:bg-gray-50">
                  DOWNLOAD PNG
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-neutral-500">FILL SLUG & JOIN CODE TO PREVIEW THE QR.</div>
          )}
        </section>

        {/* Kitchen Link Section */}
        <section className="mt-6 border rounded-none p-4">
          <div className="text-sm font-semibold mb-2">KITCHEN LINK</div>
          {kitchenUrl ? (
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-xs bg-neutral-50 border rounded-none px-2 py-1 break-all">{kitchenUrl}</code>
              <button 
                onClick={() => navigator.clipboard.writeText(kitchenUrl)} 
                className="h-9 px-3 border rounded-none hover:bg-gray-50"
              >
                COPY
              </button>
              <a 
                href={kitchenUrl} 
                target="_blank" 
                className="h-9 px-3 border rounded-none hover:bg-gray-50 inline-flex items-center"
              >
                OPEN
              </a>
            </div>
          ) : (
            <div className="text-sm text-neutral-500">SET A KITCHEN CODE TO GET THE LINK.</div>
          )}
        </section>
      </main>
    </AdminGate>
  );
}
