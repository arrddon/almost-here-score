// src/app/upload/page.tsx

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, 3);

    const imageData = await Promise.all(
      files.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      })
    );

    sessionStorage.setItem("uploadedImages", JSON.stringify(imageData));
    router.push("/select");
  };

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,160,255,0.1),transparent_45%)]" />

      <section className="relative z-10 min-h-screen flex flex-col justify-between p-8">
        <div className="flex justify-between text-xs uppercase tracking-[0.25em] text-neutral-600">
          <Link href="/" className="hover:text-white transition">
            Back
          </Link>
          <span>01 / Upload</span>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-4xl">
            <h1 className="text-[56px] md:text-[88px] leading-[0.9] tracking-[-0.04em] font-light">
              Upload
              <br />
              a Trace
            </h1>

            <label className="mt-12 block w-full border-t border-white/20 pt-8 cursor-pointer group">
              <div className="text-2xl md:text-3xl text-neutral-400 group-hover:text-white transition">
                Choose images →
              </div>

              <p className="mt-3 text-sm uppercase tracking-[0.22em] text-neutral-700">
                Max 3 / JPG PNG
              </p>

              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFiles}
              />
            </label>
          </div>
        </div>

        <div className="text-xs uppercase tracking-[0.25em] text-neutral-700">
          Surface / Residue / Water Memory
        </div>
      </section>
    </main>
  );
}