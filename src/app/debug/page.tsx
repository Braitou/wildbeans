// app/debug/page.tsx
import { supabase } from "@/lib/supabase";

export default async function DebugPage() {
  const { data, error } = await supabase
    .from("events")
    .select("id, name, slug")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <main style={{ padding: 32 }}>
      <h1>Debug — Connexion Supabase</h1>
      {error && <pre>Erreur: {error.message}</pre>}
      <ul>
        {(data ?? []).map((e) => (
          <li key={e.id}>{e.name} — {e.slug}</li>
        ))}
      </ul>
    </main>
  );
}
