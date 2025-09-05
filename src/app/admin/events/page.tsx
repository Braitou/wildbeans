'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminGate from '@/components/auth/AdminGate';
import AdminHeader from '@/components/layout/AdminHeader';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type EventRow = { 
  id: string; 
  name: string; 
  slug: string; 
  join_code: string; 
  kitchen_code: string; 
  starts_at: string|null; 
  ends_at: string|null 
};

export default function EventsPage() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Log de vérification du projet Supabase
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('SUPABASE_URL =', process.env.NEXT_PUBLIC_SUPABASE_URL);
    }
  }, []);
  

  async function loadEvents() {
    try {
      const { data, error } = await supabase.rpc('admin_list_events');
      if (error) {
        console.error('ERROR LOADING EVENTS:', error);
        return;
      }
      setRows(data || []);
    } catch (err) {
      console.error('ERROR:', err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteEvent(evId: string) {
    if (!confirm('DELETE THIS EVENT?')) return;
    
    setDeletingId(evId);
    const { error } = await supabase.rpc('admin_delete_event', { event_id: evId });
    if (error) {
      console.error('ADMIN_DELETE_EVENT ERROR:', error);
      // Affiche l'erreur réelle (utile si FK bloque la suppression)
      // @ts-ignore
      const msg = error?.message || error?.hint || error?.details || 'Delete failed';
      toast.error(msg.toUpperCase());
      return;
    }
    toast.success('EVENT DELETED');
    // recharge la liste
    await loadEvents();
    setDeletingId(null);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <AdminGate>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <AdminHeader title="Events" />
        
        <div className="mb-6 flex items-center justify-end">
          <Link 
            href="/admin/events/new" 
            className="h-10 px-3 border rounded-md hover:bg-gray-50 flex items-center"
          >
            CREATE
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-500">
              <tr>
                <th className="py-2">NAME</th>
                <th>SLUG</th>
                <th>JOIN</th>
                <th>KITCHEN</th>
                <th>DATES</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-neutral-500">
                    LOADING...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-neutral-500">
                    NO EVENTS FOUND
                  </td>
                </tr>
              ) : (
                rows.map(e => (
                  <tr key={e.id}>
                    <td className="py-2">{e.name}</td>
                    <td>{e.slug}</td>
                    <td>{e.join_code}</td>
                    <td>{e.kitchen_code}</td>
                    <td>
                      {e.starts_at?.slice(0,10)} → {e.ends_at?.slice(0,10)}
                    </td>
                    <td className="text-right">
                      <Link 
                        href={`/admin/events/${e.id}`} 
                        className="underline"
                      >
                        OPEN
                      </Link>
                      <button
                        onClick={() => deleteEvent(e.id)}
                        className="ml-2 h-8 w-8 inline-flex items-center justify-center rounded-md border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="DELETE"
                        disabled={deletingId === e.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </AdminGate>
  );
}
