// src/app/select/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SelectPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("uploadedImages");
    if (stored) {
      setImages(JSON.parse(stored));
    }
  }, []);

  const selectImage = (image: string) => {
    sessionStorage.setItem("selectedImage", image);
    router.push("/trace");
  };

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,160,255,0.08),transparent_45%)]" />

      <section className="relative z-10 min-h-screen flex flex-col justify-between p-8">
        <div className="flex justify-between text-xs uppercase tracking-[0.25em] text-neutral-600">
          <Link href="/upload" className="hover:text-white transition">
            Back
          </Link>
          <span>02 / Select</span>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full">
            <h1 className="text-[56px] md:text-[88px] leading-[0.9] tracking-[-0.04em] font-light">
              Choose
              <br />
              One
            </h1>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => selectImage(image)}
                  className="group text-left"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-white/5 border border-white/10">
                    <img
                      src={image}
                      alt={`Uploaded image ${index + 1}`}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                    />
                  </div>

                  <div className="mt-3 text-xs uppercase tracking-[0.22em] text-neutral-600 group-hover:text-white transition">
                    Image {index + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs uppercase tracking-[0.25em] text-neutral-700">
          Next / Trace
        </div>
      </section>
    </main>
  );
}