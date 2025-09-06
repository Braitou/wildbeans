'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type Props = {
  event: {
    id: string;
    name: string | null;
    display_name: string | null;
    logo_url: string | null;
  };
  onSaved?: (evt: { display_name: string | null; logo_url: string | null }) => void;
};

export default function EventBannerSettings({ event, onSaved }: Props) {
  const [displayName, setDisplayName] = useState(event.display_name ?? '');
  const [logoUrl, setLogoUrl] = useState(event.logo_url ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    try {
      setBusy(true);
      let newLogoUrl = logoUrl;

      if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
        const path = `events/${event.id}/logo-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('event-assets')
          .upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('event-assets').getPublicUrl(path);
        newLogoUrl = data.publicUrl;
      }

      const { data: row, error } = await supabase
        .from('events')
        .update({
          display_name: displayName.trim() || null,
          logo_url: newLogoUrl || null,
        })
        .eq('id', event.id)
        .select('display_name, logo_url')
        .single();

      if (error) throw error;
      setLogoUrl(row.logo_url ?? '');
      toast.success('Enregistré');
      onSaved?.(row);
      setFile(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  async function removeLogo() {
    try {
      setBusy(true);
      const { error } = await supabase
        .from('events')
        .update({ logo_url: null })
        .eq('id', event.id);
      if (error) throw error;
      setLogoUrl('');
      setFile(null);
      toast.success('Logo supprimé');
    } catch (e: any) {
      toast.error(e?.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Display name</label>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={event.name ?? 'Nom de l’évènement'}
          className="rounded-none"
        />
      </div>

      <div className="flex items-start gap-4">
        <div className="w-20 h-20 border border-black rounded-none flex items-center justify-center overflow-hidden">
          {file ? (
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              className="block w-full h-full object-contain"
            />
          ) : logoUrl ? (
            <img src={logoUrl} alt="logo" className="block w-full h-full object-contain" />
          ) : (
            <span className="text-[10px] uppercase">No logo</span>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="rounded-none"
          />
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={busy} className="rounded-none">
              Enregistrer
            </Button>
            {logoUrl && (
              <Button variant="outline" onClick={removeLogo} disabled={busy} className="rounded-none">
                Supprimer le logo
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
