'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import AdminGate from '@/components/auth/AdminGate';
import AdminHeader from '@/components/layout/AdminHeader';
import { toast } from 'sonner';

export default function QRPage() {
  const [slug, setSlug] = useState('demo');
  const [join, setJoin] = useState('WB1');
  const [origin, setOrigin] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  
  const url = useMemo(() => {
    if (!origin) return '';
    return `${origin}/e/${encodeURIComponent(slug)}?join=${encodeURIComponent(join)}`;
  }, [origin, slug, join]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `wildbeans-qr-${slug}.png`;
    link.click();
    toast.success('QR Code téléchargé 📷');
  }

  return (
    <AdminGate>
      <main className="min-h-[70vh] py-8 max-w-xl mx-auto px-4">
        <AdminHeader title="QR — Event" />

        <div className="grid gap-3">
          <input 
            value={slug} 
            onChange={e => setSlug(e.target.value)} 
            placeholder="slug (ex: demo)" 
            className="h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black" 
          />
          <input 
            value={join} 
            onChange={e => setJoin(e.target.value)} 
            placeholder="join code (ex: WB1)" 
            className="h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black" 
          />
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="p-4 border border-gray-200 rounded-lg">
            {url && <QRCodeCanvas value={url} size={256} includeMargin ref={canvasRef} />}
          </div>
          <button 
            onClick={download} 
            disabled={!url}
            className="h-11 px-4 rounded-md bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Download PNG
          </button>
          {url && <p className="text-sm text-neutral-600 break-all mt-1">{url}</p>}
        </div>
      </main>
    </AdminGate>
  );
}
