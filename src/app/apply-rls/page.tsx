'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ApplyRLSMigration() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function applyRLSMigration() {
    setLoading(true);
    setStatus('Applying RLS migration...');

    try {
      // Activer RLS
      const { error: rlsError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;'
      });

      if (rlsError) {
        setStatus(`RLS activation error: ${rlsError.message}`);
        return;
      }

      // Créer les politiques
      const policies = [
        `DROP POLICY IF EXISTS orders_select_policy ON public.orders;`,
        `CREATE POLICY orders_select_policy ON public.orders FOR SELECT TO anon, authenticated USING (true);`,
        `DROP POLICY IF EXISTS orders_update_policy ON public.orders;`,
        `CREATE POLICY orders_update_policy ON public.orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);`,
        `DROP POLICY IF EXISTS orders_insert_policy ON public.orders;`,
        `CREATE POLICY orders_insert_policy ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);`
      ];

      for (const policy of policies) {
        const { error } = await supabase.rpc('exec_sql', { sql: policy });
        if (error) {
          setStatus(`Policy creation error: ${error.message}`);
          return;
        }
      }

      // Recharger le schéma
      await supabase.rpc('exec_sql', {
        sql: "SELECT pg_notify('pgrst', 'reload schema');"
      });

      setStatus('RLS migration applied successfully!');
    } catch (err) {
      setStatus(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Apply RLS Migration</h1>
      
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Cette action active RLS sur la table orders et applique les politiques nécessaires.
          Assurez-vous d'avoir les permissions nécessaires.
        </p>
      </div>

      <button
        onClick={applyRLSMigration}
        disabled={loading}
        className="px-6 py-3 bg-red-500 text-white rounded font-semibold disabled:opacity-50"
      >
        {loading ? 'Applying...' : 'Apply RLS Migration'}
      </button>

      {status && (
        <div className="mt-4 p-4 bg-gray-50 border rounded">
          <h3 className="font-bold mb-2">Status:</h3>
          <p className="text-sm font-mono">{status}</p>
        </div>
      )}
    </div>
  );
}
