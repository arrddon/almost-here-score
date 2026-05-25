// app/complete/page.tsx

"use client";

import Link from "next/link";

export default function CompletePage() {
  const clearSession = () => {
    sessionStorage.clear();
  };

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden relative">
      <section className="relative z-10 min-h-screen flex flex-col justify-between p-8">
        <div className="flex justify-between items-center text-sm uppercase tracking-[0.22em] text-neutral-500">
          <span className="text-white">Submitted</span>

        </div>

        <div className="flex-1 flex items-center">
          <div className="max-w-5xl">
            <h1 className="text-[72px] md:text-[128px] leading-[0.88] tracking-[-0.05em] font-light">
              Your Trace
              <br />
              Has Entered
              <br />
              the Pool
            </h1>


            <Link
              href="/"
              onClick={clearSession}
              className="inline-block mt-12 px-6 py-3 border border-white/40 text-lg text-white hover:bg-white hover:text-black transition"
            >
              Return to Start →
            </Link>
          </div>
        </div>

      </section>
    </main>
  );
}