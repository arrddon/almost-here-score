// app/upload/page.tsx

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UploadPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);

  const resizeImage = (
    file: File,
    maxWidth = 2200,
    quality = 0.9
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = () => {
        img.src = reader.result as string;
      };

      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");

        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const remainingSlots = 3 - images.length;
    const selectedFiles = files.slice(0, remainingSlots);

    if (selectedFiles.length === 0) return;

    const compressed = await Promise.all(
      selectedFiles.map((file) => resizeImage(file))
    );

    setImages((prev) => [...prev, ...compressed].slice(0, 3));

    event.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const continueToSelect = () => {
    if (images.length === 0) return;

    sessionStorage.setItem("uploadedImages", JSON.stringify(images));
    router.push("/select");
  };

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,160,255,0.12),transparent_45%)]" />

      <section className="relative z-10 min-h-screen flex flex-col justify-between p-8">
        <div className="flex justify-between items-center text-sm uppercase tracking-[0.22em] text-neutral-500">
          <Link href="/" className="hover:text-white transition">
            Back
          </Link>
          <span className="text-white">
            01 / Upload / {images.length}/3
          </span>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-6xl">
            <h1 className="text-[72px] md:text-[128px] leading-[0.88] tracking-[-0.05em] font-light">
              Upload
              <br />
              a Trace
            </h1>

            <div className="mt-12 border-t border-white/20 pt-8">
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((slot) => {
                  const image = images[slot];

                  if (image) {
                    return (
                      <button
                        key={slot}
                        onClick={() => removeImage(slot)}
                        className="relative aspect-[4/5] overflow-hidden border border-white/20 bg-white/[0.03]"
                      >
                        <img
                          src={image}
                          alt={`Uploaded ${slot + 1}`}
                          className="w-full h-full object-cover"
                        />

                        <div className="absolute top-3 left-3 text-xs uppercase tracking-[0.2em] text-white/80">
                          {slot + 1}
                        </div>

                        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition flex items-center justify-center bg-black/50 text-sm uppercase tracking-[0.2em]">
                          Remove
                        </div>
                      </button>
                    );
                  }

                  return (
                    <label
                      key={slot}
                      className="aspect-[4/5] border border-dashed border-white/20 bg-white/[0.025] flex items-center justify-center cursor-pointer hover:bg-white/[0.06] transition"
                    >
                      <div className="text-center">
                        <div className="text-5xl font-light text-neutral-500">
                          +
                        </div>
                        <div className="mt-3 text-xs uppercase tracking-[0.2em] text-neutral-600">
                          Add image
                        </div>
                      </div>

                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFiles}
                      />
                    </label>
                  );
                })}
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  onClick={continueToSelect}
                  disabled={images.length === 0}
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