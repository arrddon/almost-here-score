// src/app/inflate/page.tsx

"use client";

import Link from "next/link";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { TextureLoader } from "three";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function InflatedSurface({
  imageUrl,
  inflate,
  thickness,
}: {
  imageUrl: string;
  inflate: number;
  thickness: number;
}) {
  const texture = useLoader(TextureLoader, imageUrl);

  return (
    <mesh scale={[1.8, 2.4, thickness]}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.35}
        metalness={0.05}
        displacementMap={texture}
        displacementScale={inflate}
      />
    </mesh>
  );
}

export default function InflatePage() {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [inflate, setInflate] = useState(0.18);
  const [thickness, setThickness] = useState(0.32);

  useEffect(() => {
    const storedImage = sessionStorage.getItem("selectedImage");
    if (storedImage) setImageUrl(storedImage);
  }, []);

  const continueToPrompt = () => {
    sessionStorage.setItem("inflateAmount", String(inflate));
    sessionStorage.setItem("thicknessAmount", String(thickness));
    sessionStorage.setItem("transformedImage", imageUrl || "");
    router.push("/prompt");
  };

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,160,255,0.12),transparent_45%)]" />

      <section className="relative z-10 min-h-screen flex flex-col justify-between p-8">
        <div className="flex justify-between text-xs uppercase tracking-[0.25em] text-neutral-600">
          <Link href="/trace" className="hover:text-white transition">
            Back
          </Link>
          <span>04 / Inflate</span>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-10 items-center">
          <div>
            <h1 className="text-[48px] md:text-[72px] leading-[0.9] tracking-[-0.04em] font-light">
              Inflate
              <br />
              the Trace
            </h1>

            <div className="mt-10 h-[420px] border border-white/10 bg-white/[0.03]">
              {imageUrl && (
                <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }}>
                  <ambientLight intensity={1.2} />
                  <directionalLight position={[3, 3, 4]} intensity={2} />
                  <directionalLight position={[-3, -2, -2]} intensity={0.8} />

                  <InflatedSurface
                    imageUrl={imageUrl}
                    inflate={inflate}
                    thickness={thickness}
                  />

                  <OrbitControls enableZoom={false} />
                </Canvas>
              )}
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 space-y-8">
            <div>
              <div className="flex justify-between text-xs uppercase tracking-[0.22em] text-neutral-600 mb-4">
                <span>Inflation</span>
                <span>{inflate.toFixed(2)}</span>
              </div>

              <input
                type="range"
                min="0"
                max="0.45"
                step="0.01"
                value={inflate}
                onChange={(e) => setInflate(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs uppercase tracking-[0.22em] text-neutral-600 mb-4">
                <span>Thickness</span>
                <span>{thickness.toFixed(2)}</span>
              </div>

              <input
                type="range"
                min="0.08"
                max="0.8"
                step="0.01"
                value={thickness}
                onChange={(e) => setThickness(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex justify-between text-lg pt-8">
              <Link href="/trace" className="text-neutral-500 hover:text-white transition">
                Redraw
              </Link>

              <button
                onClick={continueToPrompt}
                className="text-neutral-400 hover:text-white transition"
              >
                Continue →
              </button>
            </div>
          </div>
        </div>

        <div className="text-xs uppercase tracking-[0.25em] text-neutral-700">
          Rotate / Inflate / Thicken
        </div>
      </section>
    </main>
  );
}