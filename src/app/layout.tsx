import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import Image from "next/image";
import "./globals.css";

// Police locale : chemin relatif au fichier courant (src/app/layout.tsx)
const fragmentMono = localFont({
  src: "./font/FragmentMono-Regular.ttf", // ← si tu as .woff2, mets "./font/FragmentMono-Regular.woff2"
  variable: "--font-fragmentmono",
  weight: "400",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wild Beans",
  description: "Be Wild… order something !",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={fragmentMono.variable}>
      <body className="antialiased bg-white text-black font-sans">
        <header className="border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-center">
            <Image
              src="/logowbb.svg"
              alt="Wild Beans"
              width={120}
              height={40}
              priority
              className="h-8 w-auto"
            />
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6">
          {children}
        </main>

        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#000",
              color: "#fff",
              border: "1px solid #333",
            },
            duration: 3000,
          }}
        />
      </body>
    </html>
  );
}
