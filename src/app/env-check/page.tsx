'use client';

export default function EnvCheck() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <main className="p-6">
      <h1 className="font-bold mb-4">Env Check</h1>
      <pre className="bg-gray-100 p-4 rounded-none">
        {JSON.stringify(
          {
            hasUrl: !!url,
            hasAnon: !!anon,
            urlLen: url?.length ?? 0,
            anonLen: anon?.length ?? 0,
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}
