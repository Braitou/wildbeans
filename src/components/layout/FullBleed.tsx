'use client';
import type { ReactNode } from 'react';

/**
 * Force le contenu à prendre toute la largeur du viewport,
 * même si un parent a un max-width centré.
 */
export default function FullBleed({ children }: { children: ReactNode }) {
  return (
    <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
      {children}
    </div>
  );
}
