import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

const fragmentMono = localFont({
  src: [
    { path: "./fonts/FragmentMono-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/FragmentMono-Italic.ttf",  weight: "400", style: "italic" },
  ],
  variable: "--font-fragmentmono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wild Beans",
  description: "Be Wild… order something !",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={fragmentMono.variable}>
      <body className="antialiased bg-white text-black font-sans">
        {/* Pas de header ni de main ici : chaque sous-layout gère son wrapper */}
        {children}

        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: "#000", color: "#fff", border: "1px solid #333" },
            duration: 3000,
          }}
        />
      </body>
    </html>
  );
}
