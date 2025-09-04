'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminGate from '@/components/auth/AdminGate';
import AdminHeader from '@/components/layout/AdminHeader';
import EventTabs from '@/components/admin/EventTabs';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
      toast.error('Erreur lors du chargement');
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

  // Auto-générer slug & codes si vides
  useEffect(() => {
    setForm(f => {
      let next = { ...f };
      if (isNew) {
        if (f.name && !f.slug) next.slug = slugify(f.name);
        if (!f.join_code) next.join_code = 'WB1';
        if (!f.kitchen_code) next.kitchen_code = 'KITCHEN1';
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name, isNew]);

  async function save() {
    if (!form.name || !form.slug) {
      toast.error('Nom et slug sont requis');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('admin_upsert_event', {
        p_id: isNew ? null : form.id,
        p_name: form.name,
        p_slug: form.slug,
        p_join_code: form.join_code || 'WB1',
        p_kitchen_code: form.kitchen_code || 'KITCHEN1',
        p_starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        p_ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      });
      
      if (error) {
        // >>> rendez l’erreur visible immédiatement
        console.error('admin_upsert_event error:', error);
        const msg = (error as any)?.message || 'Unknown error';
        if (msg.includes('SLUG_TAKEN')) {
          toast.error('Ce slug est déjà utilisé, choisis-en un autre.');
        } else {
          toast.error(`Erreur lors de l’enregistrement : ${msg}`);
        }
        return;
      }      

      toast.success('Enregistré ✅');

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
    const { error } = await supabase.rpc('admin_close_event', { p_event_id: isNew ? null : id });
    setClosing(false);
    if (error) {
      toast.error('Erreur: ' + error.message);
      return;
    }
    toast.success('Évènement clôturé ✅');
    loadEvent();
  }

  if (loading) {
    return (
      <AdminGate>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Chargement…</div>
        </main>
      </AdminGate>
    );
  }

  return (
    <AdminGate>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <AdminHeader title="Event" />
        <div className="flex items-center justify-between mb-2">
          {!isNew && <EventTabs id={id} />}
          {!isNew && (
            <button
              onClick={closeEvent}
              disabled={closing}
              className="h-10 px-3 border rounded-md hover:bg-gray-50"
            >
              {closing ? 'Clôture…' : 'Clôturer l\'event'}
            </button>
          )}
        </div>

        <section className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm">Nom</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Mariage Claire & Max"
              className="h-11 px-3 border border-gray-300 rounded-md"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Slug (URL)</label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="mariage-claire-max"
              className="h-11 px-3 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-neutral-500">URL : /e/{'{slug}'}?join={'{code}'}</p>
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Code join (client)</label>
            <input
              value={form.join_code}
              onChange={(e) => setForm({ ...form, join_code: e.target.value })}
              placeholder="WB1"
              className="h-11 px-3 border border-gray-300 rounded-md"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Code kitchen (barista)</label>
            <input
              value={form.kitchen_code}
              onChange={(e) => setForm({ ...form, kitchen_code: e.target.value })}
              placeholder="KITCHEN1"
              className="h-11 px-3 border border-gray-300 rounded-md"
            />
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm">Début (optionnel)</label>
              <input
                type="datetime-local"
                value={form.starts_at ?? ''}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value || null })}
                className="h-11 px-3 border border-gray-300 rounded-md"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Fin (optionnel)</label>
              <input
                type="datetime-local"
                value={form.ends_at ?? ''}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value || null })}
                className="h-11 px-3 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="h-11 px-5 rounded-md bg-black text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </section>
      </main>
    </AdminGate>
  );
}
