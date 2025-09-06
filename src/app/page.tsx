import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          src="/logowbb.svg"
          alt="Wild Beans"
          width={180}
          height={60}
          priority
          className="h-12 w-auto"
        />
        
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            className="rounded-none border border-solid border-transparent transition-colors flex items-center justify-center bg-black text-white gap-2 hover:bg-gray-800 font-medium text-sm sm:text-base h-10 sm:h-12 px-6 sm:px-8 sm:w-auto"
            href="/admin/events"
          >
            Connect
          </Link>
        </div>
      </main>
    </div>
  );
}
