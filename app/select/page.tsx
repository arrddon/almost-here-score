// app/select/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SelectPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("uploadedImages");
    if (stored) {
      setImages(JSON.parse(stored));
    }
  }, []);

  const continueToTrace = () => {
    if (selectedIndex === null) return;

    const selectedImage = images[selectedIndex];

    sessionStorage.setItem("selectedImage", selectedImage);
    sessionStorage.setItem("originalImage", selectedImage);
    sessionStorage.setItem("selectedImageIndex", String(selectedIndex));

    router.push("/trace");
  };

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 " />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,220,0.08),transparent_28%),radial-gradient(circle_at_85%_70%,rgba(255,120,220,0.08),transparent_30%)]" />

      <section className="relative z-10 min-h-screen flex flex-col justify-between p-8">
        <div className="flex justify-between items-center text-sm uppercase tracking-[0.22em] text-neutral-500">
          <Link href="/upload" className="hover:text-white transition">
            Back
          </Link>
          <span className="text-white">02 / Select</span>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-5xl">
            <div className="flex items-end justify-between gap-8">
              <h1 className="text-[64px] md:text-[104px] leading-[0.88] tracking-[-0.05em] font-light">
                Choose
                <br />
                One
              </h1>

              <div className="hidden md:block text-right text-sm uppercase tracking-[0.22em] text-neutral-600">
                {selectedIndex === null
                  ? "No image selected"
                  : `Image ${selectedIndex + 1} selected`}
              </div>
            </div>

            <div className="mt-12 border-t border-white/20 pt-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                {images.map((image, index) => {
                  const isSelected = selectedIndex === index;

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedIndex(index)}
                      className={`group relative text-left aspect-[4/5] overflow-hidden transition ${
                        isSelected
                          ? "border border-white bg-white/10"
                          : "border border-white/15 bg-white/[0.04] hover:border-white/40"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Uploaded image ${index + 1}`}
                        className={`w-full h-full object-cover transition ${
                          isSelected
                            ? "opacity-100 scale-105"
                            : "opacity-75 group-hover:opacity-100"
                        }`}
                      />

                      <div className="absolute top-3 left-3 text-xs uppercase tracking-[0.2em] text-white/80">
                        {index + 1}
                      </div>

                      {isSelected && (
                        <div className="absolute inset-0 border-2 border-white pointer-events-none" />
                      )}

                      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-xs uppercase tracking-[0.2em] text-white/80">
                        <span>Image {index + 1}</span>
                        <span>{isSelected ? "Selected" : "Choose"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-10 flex justify-between items-center">


                <button
                  onClick={continueToTrace}
                  disabled={selectedIndex === null}
                  className="px-6 py-3 border border-white/40 text-lg text-white hover:bg-white hover:text-black transition disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-white"
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        </div>

  
      </section>
    </main>
  );
}