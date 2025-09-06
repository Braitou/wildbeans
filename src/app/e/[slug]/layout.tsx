import Image from "next/image";

export default function ClientOrderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-gray-200">
        <Image
          src="/logowbb.svg"
          alt="Wild Beans"
          width={1200}
          height={400}
          priority
          className="w-full h-auto"
        />
      </header>
      <div>{children}</div>
    </>
  );
}
