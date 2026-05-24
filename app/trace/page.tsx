// src/app/trace/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line } from "react-konva";
import { useRouter } from "next/navigation";

export default function TracePage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [points, setPoints] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [size, setSize] = useState({ width: 320, height: 480 });

  useEffect(() => {
    const stored = sessionStorage.getItem("selectedImage");
    if (stored) setImageUrl(stored);
  }, []);

  useEffect(() => {
    if (!imageUrl) return;

    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => setImageElement(img);
  }, [imageUrl]);

  useEffect(() => {
    const updateSize = () => {
      const width = containerRef.current?.offsetWidth || 320;
      setSize({
        width,
        height: Math.min(width * 1.25, 560),
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const getPointerPosition = (e: any) => {
    const stage = e.target.getStage();
    const position = stage.getPointerPosition();
    if (!position) return;

    setPoints((prev) => [...prev, position.x, position.y]);
  };

  const handleStart = (e: any) => {
    setIsDrawing(true);
    getPointerPosition(e);
  };

  const handleMove = (e: any) => {
    if (!isDrawing) return;
    getPointerPosition(e);
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  const clearTrace = () => {
    setPoints([]);
  };

  const continueToInflate = () => {
    sessionStorage.setItem("tracePoints", JSON.stringify(points));
    sessionStorage.setItem("traceCanvasSize", JSON.stringify(size));
    router.push("/inflate");
  };

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,160,255,0.08),transparent_45%)]" />

      <section className="relative z-10 min-h-screen flex flex-col justify-between p-8">
        <div className="flex justify-between text-xs uppercase tracking-[0.25em] text-neutral-600">
          <Link href="/select" className="hover:text-white transition">
            Back
          </Link>
          <span>03 / Trace</span>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-4xl">
            <h1 className="text-[48px] md:text-[72px] leading-[0.9] tracking-[-0.04em] font-light">
              Draw
              <br />
              the Trace
            </h1>

            <div
              ref={containerRef}
              className="mt-10 w-full border-t border-white/20 pt-8"
            >
              <div className="bg-white/[0.03] border border-white/10 overflow-hidden">
                <Stage
                  width={size.width}
                  height={size.height}
                  onMouseDown={handleStart}
                  onMouseMove={handleMove}
                  onMouseUp={handleEnd}
                  onTouchStart={handleStart}
                  onTouchMove={handleMove}
                  onTouchEnd={handleEnd}
                >
                  <Layer>
                    {imageElement && (
                      <KonvaImage
                        image={imageElement}
                        width={size.width}
                        height={size.height}
                        opacity={0.75}
                      />
                    )}

                    <Line
                      points={points}
                      stroke="white"
                      strokeWidth={5}
                      tension={0.5}
                      lineCap="round"
                      lineJoin="round"
                    />
                  </Layer>
                </Stage>
              </div>

              <div className="mt-6 flex justify-between text-lg">
                <button
                  onClick={clearTrace}
                  className="text-neutral-500 hover:text-white transition"
                >
                  Clear
                </button>

                <button
                  onClick={continueToInflate}
                  disabled={points.length < 8}
                  className="text-neutral-400 hover:text-white transition disabled:opacity-20"
                >
                  Inflate →
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs uppercase tracking-[0.25em] text-neutral-700">
          Draw Around the Residue
        </div>
      </section>
    </main>
  );
}