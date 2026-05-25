// app/upload/page.tsx

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UploadPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const resizeImage = (
    file: File,
    maxWidth = 1600,
    quality = 0.8
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onerror = () => reject(new Error("Failed to read image"));

      reader.onload = () => {
        img.src = reader.result as string;
      };

      img.onerror = () => reject(new Error("Failed to load image"));

      img.onload = () => {
        try {
          const scale = Math.min(1, maxWidth / img.width);
          const width = Math.round(img.width * scale);
          const height = Math.round(img.height * scale);

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d", { alpha: false });
          if (!ctx) throw new Error("Canvas not supported");

          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch (error) {
          reject(error);
        }
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsProcessing(true);

      sessionStorage.removeItem("uploadedImages");
      sessionStorage.removeItem("selectedImage");
      sessionStorage.removeItem("originalImage");
      sessionStorage.removeItem("traceMask");
      sessionStorage.removeItem("tracePoints");

      const files = Array.from(event.target.files || []);
      const remainingSlots = 3 - images.length;
      const selectedFiles = files.slice(0, remainingSlots);

      if (selectedFiles.length === 0) return;

      const compressed: string[] = [];

      for (const file of selectedFiles) {
        const resized = await resizeImage(file);
        compressed.push(resized);
      }

      setImages((prev) => [...prev, ...compressed].slice(0, 3));
    } catch (error: any) {
      console.error(error);
      alert("Image upload failed. Please try a smaller image or take a new photo.");
    } finally {
      setIsProcessing(false);
      event.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const continueToSelect = () => {
    try {
      sessionStorage.setItem("uploadedImages", JSON.stringify(images));
      router.push("/select");
    } catch {
      alert("Images are too large. Please upload fewer or smaller images.");
    }
  };

  return (
    <main className="safe-screen bg-black text-white overflow-hidden relative">
      <section className="relative z-10 page-shell flex flex-col justify-between p-8">
        <div className="flex justify-between items-center text-sm uppercase tracking-[0.22em] text-neutral-500">
          <Link href="/" className="hover:text-white transition">
            Back
          </Link>
          <span className="text-white">01 / Upload / {images.length}/3</span>
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
                      </button>
                    );
                  }

                  return (
                    <label
                      key={slot}
                      className="aspect-[4/5] border border-dashed border-white/20 bg-white/[0.025] flex items-center justify-center cursor-pointer"
                    >
                      <div className="text-center">
                        <div className="text-5xl font-light text-neutral-500">
                          +
                        </div>
                        <div className="mt-3 text-xs uppercase tracking-[0.2em] text-neutral-600">
                          {isProcessing ? "Processing" : "Add image"}
                        </div>
                      </div>

                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFiles}
                        disabled={isProcessing}
                      />
                    </label>
                  );
                })}
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  onClick={continueToSelect}
                  disabled={images.length === 0 || isProcessing}
                  className="px-6 py-3 border border-white/40 text-lg text-white hover:bg-white hover:text-black transition disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-white"
                >
                  {isProcessing ? "Processing..." : "Continue →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}