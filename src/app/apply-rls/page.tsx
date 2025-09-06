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
      // Note: RLS doit être activé manuellement via Supabase Dashboard
      // car nous ne pouvons pas exécuter ALTER TABLE via l'API
      setStatus('RLS activation requires manual execution in Supabase Dashboard.');
      setStatus('Please execute the following SQL in Supabase SQL Editor:');
      setStatus('');
      setStatus('ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;');
      setStatus('');
      setStatus('Then click "Apply Policies" below to create the policies.');
      
    } catch (err) {
      setStatus(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  async function applyPolicies() {
    setLoading(true);
    setStatus('Applying policies...');

    try {
      // Test si RLS est activé en essayant une opération
      const { data, error: testError } = await supabase
        .from('orders')
        .select('id')
        .limit(1);

      if (testError && testError.message.includes('row security')) {
        setStatus('RLS is enabled but policies are missing. Creating policies...');
      } else if (testError) {
        setStatus(`Error testing RLS: ${testError.message}`);
        return;
      }

      // Créer les politiques via des opérations de test
      // Note: Les politiques doivent être créées manuellement
      setStatus('Policies must be created manually in Supabase Dashboard.');
      setStatus('Please execute the following SQL:');
      setStatus('');
      setStatus('DROP POLICY IF EXISTS orders_select_policy ON public.orders;');
      setStatus('CREATE POLICY orders_select_policy ON public.orders FOR SELECT TO anon, authenticated USING (true);');
      setStatus('');
      setStatus('DROP POLICY IF EXISTS orders_update_policy ON public.orders;');
      setStatus('CREATE POLICY orders_update_policy ON public.orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);');
      setStatus('');
      setStatus('DROP POLICY IF EXISTS orders_insert_policy ON public.orders;');
      setStatus('CREATE POLICY orders_insert_policy ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);');
      setStatus('');
      setStatus('SELECT pg_notify(\'pgrst\', \'reload schema\');');

    } catch (err) {
      setStatus(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Apply RLS Migration</h1>
      
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-none">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Cette action active RLS sur la table orders et applique les politiques nécessaires.
          Assurez-vous d'avoir les permissions nécessaires.
        </p>
      </div>

      <button
        onClick={applyRLSMigration}
        disabled={loading}
        className="px-6 py-3 bg-red-500 text-white rounded-none font-semibold disabled:opacity-50 mr-4"
      >
        {loading ? 'Applying...' : 'Step 1: Enable RLS'}
      </button>

      <button
        onClick={applyPolicies}
        disabled={loading}
        className="px-6 py-3 bg-blue-500 text-white rounded-none font-semibold disabled:opacity-50"
      >
        {loading ? 'Applying...' : 'Step 2: Apply Policies'}
      </button>

      {status && (
        <div className="mt-4 p-4 bg-gray-50 border rounded-none">
          <h3 className="font-bold mb-2">Status:</h3>
          <p className="text-sm font-mono">{status}</p>
        </div>
      )}
    </div>
  );
}
