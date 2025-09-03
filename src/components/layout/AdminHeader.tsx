'use client';
import Image from 'next/image';
import { AdminLogoutButton } from '@/components/auth/AdminGate';

export default function AdminHeader({ title }: { title: string }) {
  return (
    <header className="relative border-b border-gray-200 pb-4 mb-6">
      {/* Déconnexion en haut à droite */}
      <div className="absolute right-4 top-4">
        <AdminLogoutButton />
      </div>

      {/* Logo centré, non rogné, +20% */}
      <div className="flex flex-col items-center">
        <div className="w-[260px] max-w-[80vw]">
          <Image
            src="/logowbb.svg"
            alt="Wild Beans"
            width={260}
            height={90}
            className="w-full h-auto object-contain"
            priority
          />
        </div>
        <h1 className="mt-2 text-sm font-semibold uppercase tracking-[0.22em] text-center">
          {title}
        </h1>
      </div>
    </header>
  );
}

