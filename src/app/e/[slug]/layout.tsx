import Image from "next/image";

export default function ClientOrderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="w-full">
        <Image
          src="/logowbb.svg"
          alt="Wild Beans"
          width={1200}
          height={400}
          priority
          className="block w-full h-auto"  /* block => supprime le fin gap; w-full => plein écran */
        />
      </header>

      {/* Le contenu de la page commande peut rester contraint si tu veux */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6">
        {children}
      </main>
    </>
  );
}
