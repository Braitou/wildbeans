'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function EventTabs({ eventId, id }: { eventId?: string; id?: string }) {
  const pathname = usePathname();
  const base = `/admin/events/${eventId || id}`;
  const tabs = [
    { href: `${base}`, label: 'DÉTAILS', exact: true },
    { href: `${base}/menu`, label: 'MENU' },
    { href: `${base}/barista`, label: 'BARISTA' },
    { href: `${base}/stats`, label: 'WILD STATS' },
  ];

  return (
    <nav className="mb-4 flex gap-4 text-sm">
      {tabs.map(t => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`pb-1 border-b-2 ${active ? 'border-black font-semibold' : 'border-transparent text-neutral-500 hover:text-black'}`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
