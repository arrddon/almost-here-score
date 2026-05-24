// src/app/page.tsx

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white overflow-hidden relative">

      {/* ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,160,255,0.12),transparent_45%)]" />

      <section className="relative z-10 min-h-screen flex flex-col justify-between p-8">

        {/* top */}
        <div className="flex justify-between text-xs uppercase tracking-[0.25em] text-neutral-600">
          <span>Almost Here</span>
          <span>BAC</span>
        </div>

        {/* center */}
        <div className="flex-1 flex items-center">

          <div className="max-w-4xl">

            <h1 className="text-[72px] md:text-[110px] leading-[0.9] tracking-[-0.04em] font-light">
              The Pool
              <br />
              That Never
              <br />
              Existed
            </h1>

            <Link
              href="/upload"
              className="inline-block mt-12 text-lg text-neutral-400 hover:text-white transition"
            >
              Begin →
            </Link>

          </div>

        </div>

        {/* bottom */}
        <div className="text-xs uppercase tracking-[0.25em] text-neutral-700">
          Image / Trace / Inflate / Print
        </div>

      </section>
    </main>
  );
}