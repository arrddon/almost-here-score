// app/trace/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line } from "react-konva";
import { useRouter } from "next/navigation";
import Konva from "konva";

type ImageLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function TracePage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  const [points, setPoints] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const [stageSize, setStageSize] = useState({
    width: 900,
    height: 720,
  });

  const [imageLayout, setImageLayout] = useState<ImageLayout>({
    x: 0,
    y: 0,
    width: 900,
    height: 720,
  });

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
      const width = containerRef.current?.offsetWidth || 900;
      const height = Math.min(window.innerHeight * 0.72, 760);

      setStageSize({
        width,
        height,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (!imageElement) return;

    const imageRatio = imageElement.width / imageElement.height;
    const stageRatio = stageSize.width / stageSize.height;

    let width = stageSize.width;
    let height = stageSize.height;
    let x = 0;
    let y = 0;

    if (imageRatio > stageRatio) {
      width = stageSize.width;
      height = width / imageRatio;
      y = (stageSize.height - height) / 2;
    } else {
      height = stageSize.height;
      width = height * imageRatio;
      x = (stageSize.width - width) / 2;
    }

    setImageLayout({ x, y, width, height });
  }, [imageElement, stageSize]);

  const addPoint = (e: any) => {
    const stage = e.target.getStage();
    const position = stage.getPointerPosition();

    if (!position) return;

    setPoints((prev) => [...prev, position.x, position.y]);
  };

  const handleStart = (e: any) => {
    setIsDrawing(true);
    setPoints([]);
    addPoint(e);
  };

  const handleMove = (e: any) => {
    if (!isDrawing) return;
    addPoint(e);
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  const clearTrace = () => {
    setPoints([]);
  };

  const createTraceMask = () => {
    const canvas = document.createElement("canvas");
    canvas.width = stageSize.width;
    canvas.height = stageSize.height;

    const context = canvas.getContext("2d");
    if (!context) return "";

    context.fillStyle = "black";
    context.fillRect(0, 0, stageSize.width, stageSize.height);

    if (points.length < 6) {
      return canvas.toDataURL("image/png");
    }

    context.save();

    context.beginPath();
    context.rect(
      imageLayout.x,
      imageLayout.y,
      imageLayout.width,
      imageLayout.height
    );
    context.clip();

    context.fillStyle = "white";
    context.beginPath();

    for (let i = 0; i < points.length; i += 2) {
      const x = points[i];
      const y = points[i + 1];

      if (i === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.closePath();
    context.fill();

    context.restore();

    return canvas.toDataURL("image/png");
  };

  const continueToInflate = () => {
    const traceMask = createTraceMask();

    sessionStorage.setItem("tracePoints", JSON.stringify(points));
    sessionStorage.setItem("traceCanvasSize", JSON.stringify(stageSize));
    sessionStorage.setItem("traceImageLayout", JSON.stringify(imageLayout));
    sessionStorage.setItem("traceMask", traceMask);

    router.push("/inflate");
  };

  return (
    <main className="safe-screen bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 " />

      <section className="relative z-10 page-shell flex flex-col justify-between p-8">
        <div className="flex justify-between items-center text-sm uppercase tracking-[0.22em] text-neutral-500">
          <Link href="/select" className="hover:text-white transition">
            Back
          </Link>
          <span className="text-white">03 / Trace</span>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[320px_1fr] gap-8 items-center">
          <div>
            <h1 className="text-[72px] md:text-[112px] leading-[0.88] tracking-[-0.05em] font-light">
              Circle
              <br />
              the
              <br />
              Trace
            </h1>

            <p className="mt-8 text-neutral-500 text-lg leading-relaxed max-w-sm">
              Draw a closed area. The inside will become the inflated surface.
            </p>

            <div className="mt-10 flex gap-5 text-lg">
              <button
                onClick={clearTrace}
                className="text-neutral-500 hover:text-white transition"
              >
                Clear
              </button>

              <button
                onClick={continueToInflate}
                disabled={points.length < 8}
                className="px-6 py-3 border border-white/40 text-white hover:bg-white hover:text-black transition disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-white"
              >
                Continue →
              </button>
            </div>
          </div>

          <div ref={containerRef} className="w-full border-t border-white/20 pt-6">
            <div className="bg-white/[0.025] border border-white/10 overflow-hidden">
              <Stage
                ref={stageRef}
                width={stageSize.width}
                height={stageSize.height}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
              >
                <Layer>
                  {imageElement && (
                    <KonvaImage
                      image={imageElement}
                      x={imageLayout.x}
                      y={imageLayout.y}
                      width={imageLayout.width}
                      height={imageLayout.height}
                      opacity={0.76}
                    />
                  )}

                  <Line
                    points={points}
                    stroke="rgba(255,255,255,0.96)"
                    strokeWidth={7}
                    tension={0.45}
                    lineCap="round"
                    lineJoin="round"
                    closed={points.length > 6}
                    fill="rgba(255,255,255,0.16)"
                    shadowColor="rgba(120,220,255,0.9)"
                    shadowBlur={18}
                  />
                </Layer>
              </Stage>
            </div>


          </div>
        </div>


      </section>
    </main>
  );
}