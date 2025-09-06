import Image from "next/image";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
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
      <div>{children}</div>
    </>
  );
}
