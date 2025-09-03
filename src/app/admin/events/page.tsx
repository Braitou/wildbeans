'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminGate from '@/components/auth/AdminGate';
import AdminHeader from '@/components/layout/AdminHeader';
import Link from 'next/link';

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

  useEffect(() => {
    async function loadEvents() {
      try {
        const { data, error } = await supabase.rpc('admin_list_events');
        if (error) {
          console.error('Erreur lors du chargement des événements:', error);
          return;
        }
        setRows(data || []);
      } catch (err) {
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    }
    
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
            Créer
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-500">
              <tr>
                <th className="py-2">Nom</th>
                <th>Slug</th>
                <th>Join</th>
                <th>Kitchen</th>
                <th>Dates</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-neutral-500">
                    Chargement...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-neutral-500">
                    Aucun événement trouvé
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
                        Ouvrir
                      </Link>
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
