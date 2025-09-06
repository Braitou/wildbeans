'use client';

import * as React from 'react';
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
  display_name: string;
  logo_url: string | null;
};

export default function EventDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = React.use(props.params); // ✅ Next 15: params is a Promise
  const router = useRouter();
  const isNew = id === 'new';

  const [form, setForm] = React.useState<EventForm>({
    id: null,
    name: '',
    slug: '',
    join_code: '',
    kitchen_code: '',
    starts_at: null,
    ends_at: null,
    display_name: '',
    logo_url: null,
  });
  const [loading, setLoading] = React.useState<boolean>(!isNew);
  const [saving, setSaving] = React.useState(false);
  const [closing, setClosing] = React.useState(false);
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [origin, setOrigin] = React.useState('');

  // QR
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const qrUrl = React.useMemo(
    () =>
      origin && form.slug && form.join_code
        ? `${origin}/e/${encodeURIComponent(form.slug)}?join=${encodeURIComponent(form.join_code)}`
        : '',
    [origin, form.slug, form.join_code]
  );

  // Kitchen link
  const kitchenUrl = React.useMemo(
    () => (form.kitchen_code && origin ? `${origin}/kitchen?code=${encodeURIComponent(form.kitchen_code)}` : ''),
    [origin, form.kitchen_code]
  );

  function downloadQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `wildbeans-qr-${form.slug || 'event'}.png`;
    link.click();
  }

  // Helpers
  function slugify(s: string) {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  async function generateNextCodes() {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('join_code, kitchen_code')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Erreur lors de la récupération des codes:', error);
        return { joinCode: 'WB1000', kitchenCode: 'KITCHEN1000' };
      }

      let nextJoinNumber = 1000;
      let nextKitchenNumber = 1000;

      if (events && events.length > 0) {
        const lastEvent = events[0];
        const jm = lastEvent.join_code?.match(/WB(\d+)/i);
        if (jm) nextJoinNumber = parseInt(jm[1], 10) + 1;
        const km = lastEvent.kitchen_code?.match(/KITCHEN(\d+)/i);
        if (km) nextKitchenNumber = parseInt(km[1], 10) + 1;
      }

      return { joinCode: `WB${nextJoinNumber}`, kitchenCode: `KITCHEN${nextKitchenNumber}` };
    } catch (e) {
      console.error('Erreur lors de la génération des codes:', e);
      return { joinCode: 'WB1000', kitchenCode: 'KITCHEN1000' };
    }
  }

  const loadEvent = React.useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('id, name, slug, display_name, logo_url, join_code, kitchen_code, starts_at, ends_at')
      .eq('id', id)
      .single();

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
        display_name: data.display_name ?? '',
        logo_url: data.logo_url,
      });
    }
  }, [id, isNew]);

  React.useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  // Auto-slug
  React.useEffect(() => {
    if (!isNew) return;
    setForm((f) => {
      if (!f.name || slugTouched || f.slug) return f;
      return { ...f, slug: slugify(f.name) };
    });
  }, [form.name, isNew, slugTouched]);

  // Pré-remplir visuellement les codes
  React.useEffect(() => {
    if (!isNew) return;
    void (async () => {
      const codes = await generateNextCodes();
      setForm((prev) => ({ ...prev, join_code: codes.joinCode, kitchen_code: codes.kitchenCode }));
    })();
  }, [isNew]);

  // Upload logo
  async function uploadLogo(file: File): Promise<string | null> {
    if (!form.id) {
      toast.error('SAVE EVENT FIRST TO UPLOAD LOGO');
      return null;
    }
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
      const path = `events/${form.id}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('event-assets').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('event-assets').getPublicUrl(path);
      return data.publicUrl;
    } catch (e) {
      console.error('Logo upload error:', e);
      toast.error('ERROR UPLOADING LOGO');
      return null;
    }
  }

  async function save() {
    if (!form.name || !form.slug) {
      toast.error('NAME AND SLUG ARE REQUIRED');
      return;
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      toast.error('MISSING SUPABASE CONFIG (URL/ANON KEY).');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: isNew ? null : form.id ?? null,
        name: form.name.trim(),
        slug: form.slug.trim(),
        display_name: form.display_name.trim() ? form.display_name.trim() : null,
        logo_url: form.logo_url ?? null,
        join_code: form.join_code.trim() ? form.join_code.trim() : null,
        kitchen_code: form.kitchen_code.trim() ? form.kitchen_code.trim() : null,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      };

      // Toujours via RPC (security definer) pour éviter RLS
      let { data, error } = await supabase
        .rpc('admin_upsert_event', payload)
        .select('id, name, slug, join_code, kitchen_code, starts_at, ends_at, display_name, logo_url')
        .single();

      // Retry si fonction non trouvée dans le cache schema
      if (error && String(error.message).includes('schema cache')) {
        console.log('Retrying after schema cache reload...');
        try {
          await supabase.rpc('graphql_public_reload_schema');
        } catch {
          // Ignore si la fonction n'existe pas
        }
        const retry = await supabase
          .rpc('admin_upsert_event', payload)
          .select('id, name, slug, join_code, kitchen_code, starts_at, ends_at, display_name, logo_url')
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        const msg = String(error.message || '');
        if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('could not find')) {
          toast.error('RPC admin_upsert_event missing. Create it in Supabase then retry.');
        } else {
          toast.error(`Save failed: ${msg}`);
        }
        console.error('admin_upsert_event error:', error);
        return;
      }

      toast.success('SAVED ✅');

      if (data) {
        setForm((prev) => ({
          ...prev,
          id: data.id,
          name: data.name ?? prev.name,
          slug: data.slug ?? prev.slug,
          join_code: data.join_code ?? prev.join_code,
          kitchen_code: data.kitchen_code ?? prev.kitchen_code,
          starts_at: data.starts_at ?? prev.starts_at,
          ends_at: data.ends_at ?? prev.ends_at,
          display_name: data.display_name ?? prev.display_name,
          logo_url: data.logo_url ?? prev.logo_url,
        }));
        if (isNew && data.id) {
          router.replace(`/admin/events/${data.id}`);
        }
      } else {
        await loadEvent();
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
    void loadEvent();
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

        {/* Back to events */}
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
          {/* Name */}
          <div className="grid gap-2">
            <label className="text-sm">NAME</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="WEDDING CLAIRE & MAX"
              className="h-11 px-3 border border-gray-300 rounded-none"
            />
          </div>

          {/* Display name */}
          <div className="grid gap-2">
            <label className="text-sm">DISPLAY NAME (OPTIONAL)</label>
            <input
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              placeholder="CLAIRE & MAX'S WEDDING"
              className="h-11 px-3 border border-gray-300 rounded-none"
            />
            <p className="text-xs text-neutral-500">
              Nom affiché sur la page de commande (par défaut : nom de l'événement)
            </p>
          </div>

          {/* Logo upload */}
          <div className="grid gap-2">
            <label className="text-sm">LOGO (OPTIONAL)</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await uploadLogo(file);
                    if (url) setForm({ ...form, logo_url: url });
                  }
                }}
                className="h-11 px-3 border border-gray-300 rounded-none"
              />
              {form.logo_url && (
                <div className="flex items-center gap-2">
                  <img
                    src={form.logo_url}
                    alt="Logo preview"
                    className="w-12 h-12 object-contain border border-gray-300 rounded-none"
                  />
                  <button
                    onClick={() => setForm({ ...form, logo_url: null })}
                    className="h-8 px-2 text-xs border border-gray-300 rounded-none hover:bg-gray-50"
                  >
                    REMOVE
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-neutral-500">Logo affiché sur la page de commande (format carré recommandé)</p>
          </div>

          {/* Slug */}
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

          {/* Codes */}
          <div className="grid gap-2">
            <label className="text-sm">CODE JOIN (CLIENT)</label>
            <input
              value={form.join_code}
              onChange={(e) => setForm({ ...form, join_code: e.target.value })}
              placeholder="WB1000"
              className="h-11 px-3 border border-gray-300 rounded-none"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">CODE KITCHEN (BARISTA)</label>
            <input
              value={form.kitchen_code}
              onChange={(e) => setForm({ ...form, kitchen_code: e.target.value })}
              placeholder="KITCHEN1000"
              className="h-11 px-3 border border-gray-300 rounded-none"
            />
          </div>

          {/* Dates */}
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

        {/* QR */}
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

        {/* Kitchen Link */}
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
              <a href={kitchenUrl} target="_blank" className="h-9 px-3 border rounded-none hover:bg-gray-50 inline-flex items-center">
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
