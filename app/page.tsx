// src/app/page.tsx

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white overflow-hidden relative">

      {/* ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,160,255,0.12),transparent_45%)]" />

      <section className="relative z-10 min-h-screen flex flex-col justify-between p-8">



        {/* center */}
        <div className="flex-1 flex items-center">

          <div className="max-w-4xl">

            <h1 className="text-[66px] md:text-[110px] leading-[1] tracking-[-0.04em] font-light">
              Almost Here:
            </h1>
            <h2 className="text-[42px] md:text-[110px] leading-[1] tracking-[-0.04em] font-light">
              <br />
              The Pool
              <br />
              That Never Existed
            </h2>  
            

            <Link
              href="/upload"
              className="inline-block mt-12 text-[42px] text-neutral-400 hover:text-white transition">
              Begin →
            </Link>

          </div>

        </div>


      </section>
    </main>
  );
}