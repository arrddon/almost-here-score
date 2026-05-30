// app/upload/page.tsx

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UploadPage() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const resizeImage = (
    file: File,
    maxWidth = 768,
    quality = 0.65
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

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsProcessing(true);

      sessionStorage.removeItem("uploadedImages");
      sessionStorage.removeItem("selectedImage");
      sessionStorage.removeItem("originalImage");
      sessionStorage.removeItem("traceMask");
      sessionStorage.removeItem("tracePoints");
      sessionStorage.removeItem("traceCanvasSize");
      sessionStorage.removeItem("traceImageLayout");
      sessionStorage.removeItem("inflateAmount");
      sessionStorage.removeItem("surfaceDetailAmount");
      sessionStorage.removeItem("thicknessAmount");
      sessionStorage.removeItem("transformedImage");
      sessionStorage.removeItem("promptAnswers");
      sessionStorage.removeItem("textContent");

      const file = event.target.files?.[0];
      if (!file) return;

      const resized = await resizeImage(file);

      setImage(resized);

      sessionStorage.setItem("selectedImage", resized);
      sessionStorage.setItem("originalImage", resized);
    } catch (error) {
      console.error(error);
      alert("Image upload failed. Please try a smaller image or take a new photo.");
    } finally {
      setIsProcessing(false);
      event.target.value = "";
    }
  };

  const continueToTrace = () => {
    if (!image) return;

    sessionStorage.setItem("selectedImage", image);
    sessionStorage.setItem("originalImage", image);

    router.push("/trace");
  };

  const removeImage = () => {
    setImage(null);
    sessionStorage.removeItem("selectedImage");
    sessionStorage.removeItem("originalImage");
  };

  return (
    <main className="safe-screen bg-black text-white overflow-x-hidden relative">
      <section className="relative z-10 page-shell flex flex-col justify-between">
        <div className="flex justify-between items-center text-sm uppercase tracking-[0.22em] text-neutral-500">
          <Link href="/" className="hover:text-white transition">
            Back
          </Link>

          <span className="text-white">
            01 / Upload / {image ? "1/1" : "0/1"}
          </span>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-5xl">
            <h1 className="hero-title">
              Upload
              <br />
              a Trace
            </h1>

            <div className="mt-12 border-t border-white/20 pt-8">
              {!image ? (
                <label className="block w-full max-w-xl aspect-[4/3] border border-dashed border-white/20 bg-white/[0.025] flex items-center justify-center cursor-pointer hover:bg-white/[0.06] transition">
                  <div className="text-center">
                    <div className="text-5xl font-light text-neutral-500">+</div>
                    <div className="mt-3 text-xs uppercase tracking-[0.2em] text-neutral-600">
                      {isProcessing ? "Processing" : "Add image"}
                    </div>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFile}
                    disabled={isProcessing}
                  />
                </label>
              ) : (
                <div className="w-full max-w-xl">
                  <button
                    onClick={removeImage}
                    className="relative w-full aspect-[4/3] overflow-hidden border border-white/20 bg-white/[0.03] group"
                  >
                    <img
                      src={image}
                      alt="Uploaded trace"
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition text-sm uppercase tracking-[0.2em]">
                        Remove
                      </span>
                    </div>
                  </button>

                  <div className="mt-10 flex justify-end">
                    <button
                      onClick={continueToTrace}
                      disabled={isProcessing}
                      className="px-6 py-3 border border-white/40 text-lg text-white hover:bg-white hover:text-black transition disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-white"
                    >
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="mt-6 text-sm uppercase tracking-[0.22em] text-neutral-500">
                  Processing image...
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}