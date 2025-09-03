'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '@/lib/supabase';
import AdminGate from '@/components/auth/AdminGate';
import AdminHeader from '@/components/layout/AdminHeader';
import EventTabs from '@/components/admin/EventTabs';
import Link from 'next/link';
import { toast } from 'sonner';

type Event = {
  id: string;
  name: string;
  slug: string;
  join_code: string;
  kitchen_code: string;
  starts_at: string|null;
  ends_at: string|null;
};

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [origin, setOrigin] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const isNew = params.id === 'new';
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    join_code: '',
    kitchen_code: '',
    starts_at: '',
    ends_at: ''
  });

  useEffect(() => {
    setOrigin(window.location.origin);
    
    if (!isNew) {
      loadEvent();
    } else {
      setLoading(false);
    }
  }, [params.id]);

  async function loadEvent() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (error) {
        console.error('Erreur lors du chargement:', error);
        return;
      }
      
      setEvent(data);
      setFormData({
        name: data.name || '',
        slug: data.slug || '',
        join_code: data.join_code || '',
        kitchen_code: data.kitchen_code || '',
        starts_at: data.starts_at ? data.starts_at.slice(0, 16) : '',
        ends_at: data.ends_at ? data.ends_at.slice(0, 16) : ''
      });
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    try {
      const eventData = {
        ...(isNew ? {} : { id: params.id }),
        name: formData.name,
        slug: formData.slug,
        join_code: formData.join_code,
        kitchen_code: formData.kitchen_code,
        starts_at: formData.starts_at || null,
        ends_at: formData.ends_at || null
      };

      const { data, error } = await supabase.rpc('admin_upsert_event', eventData);
      
      if (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        toast.error('Erreur lors de l\'enregistrement ❌');
        return;
      }
      
      toast.success('Événement enregistré ✅');
      // Rediriger vers l'événement créé/modifié
      router.push(`/admin/events/${data.id}`);
    } catch (err) {
      console.error('Erreur:', err);
      toast.error('Erreur lors de l\'enregistrement ❌');
    } finally {
      setSaving(false);
    }
  }

  const qrUrl = useMemo(() => {
    if (!origin || !formData.slug || !formData.join_code) return '';
    return `${origin}/e/${encodeURIComponent(formData.slug)}?join=${encodeURIComponent(formData.join_code)}`;
  }, [origin, formData.slug, formData.join_code]);

  function downloadQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `wildbeans-qr-${formData.slug}.png`;
    link.click();
    toast.success('QR Code téléchargé 📷');
  }

  async function closeEvent() {
    setClosing(true);
    try {
      const { error } = await supabase.rpc('admin_close_event', { p_event_id: params.id });
      if (error) {
        toast.error('Erreur: ' + error.message);
        return;
      }
      toast.success('Évènement clôturé ✅');
      loadEvent();
    } catch (error) {
      console.error('Erreur lors de la clôture:', error);
      toast.error('Erreur lors de la clôture');
    } finally {
      setClosing(false);
    }
  }

  if (loading) {
    return (
      <AdminGate>
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center">Chargement...</div>
        </main>
      </AdminGate>
    );
  }

  return (
    <AdminGate>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <AdminHeader title={isNew ? 'Nouvel Event' : 'Event'} />
        
        {!isNew && (
          <div className="flex items-center justify-between mb-2">
            <EventTabs id={params.id} />
            <button
              onClick={closeEvent}
              disabled={closing}
              className="h-10 px-3 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {closing ? 'Clôture…' : 'Clôturer l\'event'}
            </button>
          </div>
        )}
        
        <div className="mb-6 flex items-center justify-end">
          {!isNew && (
            <Link 
              href={`/admin/events/${params.id}/menu`}
              className="h-10 px-3 border rounded-md hover:bg-gray-50 flex items-center"
            >
              Configurer le menu
            </Link>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({...formData, slug: e.target.value})}
              className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Code Join</label>
              <input
                type="text"
                value={formData.join_code}
                onChange={(e) => setFormData({...formData, join_code: e.target.value})}
                className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Code Kitchen</label>
              <input
                type="text"
                value={formData.kitchen_code}
                onChange={(e) => setFormData({...formData, kitchen_code: e.target.value})}
                className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date de début</label>
              <input
                type="datetime-local"
                value={formData.starts_at}
                onChange={(e) => setFormData({...formData, starts_at: e.target.value})}
                className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date de fin</label>
              <input
                type="datetime-local"
                value={formData.ends_at}
                onChange={(e) => setFormData({...formData, ends_at: e.target.value})}
                className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-md bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>

        {/* Section QR */}
        {!isNew && qrUrl && (
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-sm font-semibold tracking-[0.22em] uppercase mb-4">
              QR Code
            </h2>
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 border border-gray-200 rounded-lg">
                <QRCodeCanvas value={qrUrl} size={256} includeMargin ref={canvasRef} />
              </div>
              <button 
                onClick={downloadQR}
                className="h-11 px-4 rounded-md bg-black text-white hover:bg-gray-800 transition-colors"
              >
                Download PNG
              </button>
              <p className="text-sm text-neutral-600 break-all mt-1">{qrUrl}</p>
            </div>
          </div>
        )}
      </main>
    </AdminGate>
  );
}
