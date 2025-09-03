'use client';

import { useState } from 'react';
import KitchenBoard from './KitchenBoard';
import FullBleed from '@/components/layout/FullBleed';
import AdminGate from '@/components/auth/AdminGate';
import { AdminLogoutButton } from '@/components/auth/AdminGate';

export const dynamic = 'force-dynamic';

export default function KitchenPage() {
  const [fs, setFs] = useState(false);

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

  return (
    <AdminGate>
      {/* on garde le main actuel (centré) mais on "perce" avec FullBleed */}
      <main className="py-4">
        <FullBleed>
          {/* Header plein écran, épuré */}
          <div className="px-6 py-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-3xl font-semibold uppercase tracking-widest">
              Wild Beans — Dashboard
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

          {/* Board plein écran */}
          <KitchenBoard />
        </FullBleed>
      </main>
    </AdminGate>
  );
}
