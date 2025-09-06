'use client';
import { useEffect, useState } from 'react';

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('wb_admin_ok') === 'true') {
        setOk(true);
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const secret = process.env.NEXT_PUBLIC_ADMIN_SECRET;
    if (!secret) {
      setError('ADMIN_SECRET non configuré');
      return;
    }
    if (pw === secret) {
      localStorage.setItem('wb_admin_ok', 'true');
      setOk(true);
    } else {
      setError('Mot de passe incorrect');
    }
  }

  if (!ok) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="p-6 border rounded-none bg-white shadow-md w-80 space-y-4"
        >
          <h1 className="text-lg font-semibold text-center">Accès protégé</h1>
          <input
            type="password"
            placeholder="Mot de passe"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="w-full h-11 px-3 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-black"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full h-11 rounded-none bg-black text-white hover:bg-neutral-800"
          >
            Entrer
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Bouton de déconnexion admin.
 * Supprime le flag de session localStorage et recharge la page.
 */
export function AdminLogoutButton() {
  return (
    <button
      onClick={() => {
        try {
          localStorage.removeItem('wb_admin_ok');
        } catch {}
        location.reload();
      }}
      className="h-11 px-4 border border-gray-300 rounded-none hover:bg-gray-50"
    >
      Déconnexion
    </button>
  );
}
