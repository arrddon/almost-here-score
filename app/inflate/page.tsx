// app/inflate/page.tsx

"use client";

import Link from "next/link";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  TextureLoader,
  BufferGeometry,
  Float32BufferAttribute,
  DoubleSide,
  Group,
} from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { set as idbSet } from "idb-keyval";

type Point = { x: number; y: number };

type ImageLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type MeshJson = {
  type: string;
  vertices: number[][];
  faces: number[][];
  uvs: number[][];
  inflate: number;
  surfaceDetail: number;
  segments: number;
};

const MESH_SEGMENTS = 200;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function pointInPolygon(point: Point, polygon: Point[]) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 0.00001) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function distanceToSegment(point: Point, a: Point, b: Point) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - a.x, point.y - a.y);
  }

  const t = clamp(
    ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy),
    0,
    1
  );

  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

function distanceToPolygonEdge(point: Point, polygon: Point[]) {
  let minDistance = Infinity;

  for (let i = 0; i < polygon.length; i++) {
    minDistance = Math.min(
      minDistance,
      distanceToSegment(point, polygon[i], polygon[(i + 1) % polygon.length])
    );
  }

  return minDistance;
}

function pointsArrayToPolygon(points: number[]) {
  const polygon: Point[] = [];

  for (let i = 0; i < points.length; i += 2) {
    polygon.push({ x: points[i], y: points[i + 1] });
  }

  return polygon;
}

function createImageSampler(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => 0.5;

  ctx.drawImage(image, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;

  return (u: number, v: number) => {
    const x = clamp(Math.floor(u * (width - 1)), 0, width - 1);
    const y = clamp(Math.floor((1 - v) * (height - 1)), 0, height - 1);
    const index = (y * width + x) * 4;

    const r = data[index] / 255;
    const g = data[index + 1] / 255;
    const b = data[index + 2] / 255;

    return r * 0.299 + g * 0.587 + b * 0.114;
  };
}

function createPillowMesh(
  polygon: Point[],
  imageLayout: ImageLayout,
  inflate: number,
  surfaceDetail: number,
  segments: number,
  sampleHeight: (u: number, v: number) => number
) {
  const minX = Math.min(...polygon.map((p) => p.x));
  const maxX = Math.max(...polygon.map((p) => p.x));
  const minY = Math.min(...polygon.map((p) => p.y));
  const maxY = Math.max(...polygon.map((p) => p.y));

  const bboxWidth = maxX - minX;
  const bboxHeight = maxY - minY;
  const centerX = minX + bboxWidth / 2;
  const centerY = minY + bboxHeight / 2;
  const maxDim = Math.max(bboxWidth, bboxHeight);

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const verticesForJson: number[][] = [];
  const uvsForJson: number[][] = [];

  const frontMap: number[][] = [];
  const backMap: number[][] = [];

  const worldScale = 3.4 / maxDim;
  const edgeSoftness = Math.min(bboxWidth, bboxHeight) * 0.34;

  for (let y = 0; y <= segments; y++) {
    frontMap[y] = [];
    backMap[y] = [];

    for (let x = 0; x <= segments; x++) {
      const sx = minX + (x / segments) * bboxWidth;
      const sy = minY + (y / segments) * bboxHeight;

      if (!pointInPolygon({ x: sx, y: sy }, polygon)) {
        frontMap[y][x] = -1;
        backMap[y][x] = -1;
        continue;
      }

      const edgeDistance = distanceToPolygonEdge({ x: sx, y: sy }, polygon);
      const edgeFactor = smoothstep(0, 1, edgeDistance / edgeSoftness);

      const dx = (sx - centerX) / bboxWidth;
      const dy = (sy - centerY) / bboxHeight;
      const radial = Math.sqrt(dx * dx + dy * dy);

      const centerFalloff = clamp(1 - radial * 0.72, 0.35, 1);
      const pillow = Math.pow(edgeFactor, 0.42) * centerFalloff;

      const u = clamp((sx - imageLayout.x) / imageLayout.width, 0, 1);
      const v = clamp(1 - (sy - imageLayout.y) / imageLayout.height, 0, 1);

      const pixelHeight = sampleHeight(u, v);
      const relief = (pixelHeight - 0.5) * surfaceDetail * edgeFactor;

      const zFront = pillow * inflate + relief;
      const zBack = -pillow * inflate + relief;

      const px = (sx - centerX) * worldScale;
      const py = -(sy - centerY) * worldScale;

      const frontIndex = positions.length / 3;
      positions.push(px, py, zFront);
      uvs.push(u, v);
      verticesForJson.push([px, py, zFront]);
      uvsForJson.push([u, v]);

      const backIndex = positions.length / 3;
      positions.push(px, py, zBack);
      uvs.push(u, v);
      verticesForJson.push([px, py, zBack]);
      uvsForJson.push([u, v]);

      frontMap[y][x] = frontIndex;
      backMap[y][x] = backIndex;
    }
  }

  for (let y = 0; y < segments; y++) {
    for (let x = 0; x < segments; x++) {
      const fa = frontMap[y][x];
      const fb = frontMap[y][x + 1];
      const fc = frontMap[y + 1][x];
      const fd = frontMap[y + 1][x + 1];

      const ba = backMap[y][x];
      const bb = backMap[y][x + 1];
      const bc = backMap[y + 1][x];
      const bd = backMap[y + 1][x + 1];

      if (fa !== -1 && fb !== -1 && fc !== -1 && fd !== -1) {
        indices.push(fa, fc, fb);
        indices.push(fb, fc, fd);

        indices.push(ba, bb, bc);
        indices.push(bb, bd, bc);
      }

      if (fa !== -1 && fc !== -1 && (x === 0 || frontMap[y][x - 1] === -1)) {
        indices.push(fa, ba, fc);
        indices.push(fc, ba, bc);
      }

      if (
        fb !== -1 &&
        fd !== -1 &&
        (x === segments - 1 || frontMap[y][x + 2] === -1)
      ) {
        indices.push(fb, fd, bb);
        indices.push(fd, bd, bb);
      }

      if (fa !== -1 && fb !== -1 && (y === 0 || frontMap[y - 1][x] === -1)) {
        indices.push(fa, fb, ba);
        indices.push(fb, bb, ba);
      }

      if (
        fc !== -1 &&
        fd !== -1 &&
        (y === segments - 1 || frontMap[y + 2][x] === -1)
      ) {
        indices.push(fc, bc, fd);
        indices.push(fd, bc, bd);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const facesForJson: number[][] = [];
  for (let i = 0; i < indices.length; i += 3) {
    facesForJson.push([indices[i], indices[i + 1], indices[i + 2]]);
  }

  const meshJson: MeshJson = {
    type: "closed_pillow_trace_mesh",
    vertices: verticesForJson,
    faces: facesForJson,
    uvs: uvsForJson,
    inflate,
    surfaceDetail,
    segments,
  };

  return { geometry, meshJson };
}

function PillowMesh({
  imageUrl,
  polygon,
  imageLayout,
  inflate,
  surfaceDetail,
  onMeshReady,
}: {
  imageUrl: string;
  polygon: Point[];
  imageLayout: ImageLayout;
  inflate: number;
  surfaceDetail: number;
  onMeshReady: (meshJson: MeshJson) => void;
}) {
  const groupRef = useRef<Group>(null);
  const texture = useLoader(TextureLoader, imageUrl);
  const image = texture.image as HTMLImageElement;

  const sampleHeight = useMemo(() => createImageSampler(image), [image]);

  const { geometry, meshJson } = useMemo(() => {
    return createPillowMesh(
      polygon,
      imageLayout,
      inflate,
      surfaceDetail,
      MESH_SEGMENTS,
      sampleHeight
    );
  }, [polygon, imageLayout, inflate, surfaceDetail, sampleHeight]);

  useEffect(() => {
    onMeshReady(meshJson);
    if (groupRef.current) groupRef.current.scale.z = 0.02;
  }, [meshJson, onMeshReady]);

  useFrame(() => {
    if (!groupRef.current) return;

    groupRef.current.scale.z += (1 - groupRef.current.scale.z) * 0.055;
    groupRef.current.rotation.y += 0.0035;
    groupRef.current.rotation.x = -0.16;
  });

  return (
    <group ref={groupRef} scale={1.45}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          map={texture}
          bumpMap={texture}
          bumpScale={surfaceDetail * 0.35}
          roughness={0.34}
          metalness={0.04}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function InflatePage() {
  const router = useRouter();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [polygon, setPolygon] = useState<Point[]>([]);
  const [imageLayout, setImageLayout] = useState<ImageLayout | null>(null);
  const [inflate, setInflate] = useState(0.8);
  const [surfaceDetail, setSurfaceDetail] = useState(0.18);
  const [meshJson, setMeshJson] = useState<MeshJson | null>(null);
  const handleMeshReady = async (mesh: MeshJson) => {
  setMeshJson(mesh);

  try {
    await idbSet("meshJson", mesh);
  } catch (error) {
    console.error("Failed to save meshJson:", error);
  }
};

  useEffect(() => {
    setImageUrl(sessionStorage.getItem("selectedImage"));

    const storedPoints = sessionStorage.getItem("tracePoints");
    const storedLayout = sessionStorage.getItem("traceImageLayout");

    if (storedPoints) setPolygon(pointsArrayToPolygon(JSON.parse(storedPoints)));
    if (storedLayout) setImageLayout(JSON.parse(storedLayout));
  }, []);

  const continueToPrompt = () => {
    if (!meshJson) return;

    sessionStorage.setItem("inflateAmount", String(inflate));
    sessionStorage.setItem("surfaceDetailAmount", String(surfaceDetail));
    sessionStorage.setItem("thicknessAmount", String(surfaceDetail));
    sessionStorage.setItem("transformedImage", imageUrl || "");

    router.push("/prompt");
  };

  const canRender = imageUrl && imageLayout && polygon.length > 3;

  return (
    <main className="min-h-screen text-white bg-black overflow-hidden relative">
      <section className="relative z-10 min-h-screen flex flex-col justify-between p-8">
        <div className="flex justify-between items-center text-sm uppercase tracking-[0.22em] text-neutral-500">
          <Link href="/trace" className="hover:text-white transition">
            Back
          </Link>
          <span className="text-white">04 / Inflate</span>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6 items-center">
          <div>
            <h1 className="text-[72px] md:text-[128px] leading-[0.88] tracking-[-0.05em] font-light">
              Inflate
              <br />
              the Trace
            </h1>

            <div className="mt-8 h-[72vh] border border-white/10 bg-white/[0.025] overflow-hidden">
              {canRender && (
                <Canvas camera={{ position: [0, 0, 3.15], fov: 32 }}>
                  <ambientLight intensity={1.15} />
                  <directionalLight position={[2, 3, 4]} intensity={2.6} />
                  <directionalLight position={[-3, -2, 2]} intensity={0.9} />

                  <PillowMesh
                    imageUrl={imageUrl}
                    polygon={polygon}
                    imageLayout={imageLayout}
                    inflate={inflate}
                    surfaceDetail={surfaceDetail}
                    onMeshReady={handleMeshReady}
                  />

                  <OrbitControls
                    enableZoom
                    enablePan={false}
                    minDistance={1.4}
                    maxDistance={12}
                  />
                </Canvas>
              )}
            </div>
          </div>

          <div className="border-l border-white/10 pl-6 space-y-10 self-stretch flex flex-col justify-center">
            <div>
              <div className="flex justify-between text-xs uppercase tracking-[0.22em] text-neutral-500 mb-4">
                <span>Inflation</span>
                <span className="text-white">{inflate.toFixed(2)}</span>
              </div>

              <input
                type="range"
                min="0.15"
                max="2.2"
                step="0.05"
                value={inflate}
                onChange={(e) => setInflate(Number(e.target.value))}
                className="w-full accent-white"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs uppercase tracking-[0.22em] text-neutral-500 mb-4">
                <span>Surface Detail</span>
                <span className="text-white">{surfaceDetail.toFixed(2)}</span>
              </div>

              <input
                type="range"
                min="0"
                max="0.85"
                step="0.01"
                value={surfaceDetail}
                onChange={(e) => setSurfaceDetail(Number(e.target.value))}
                className="w-full accent-white"
              />
            </div>

            <div className="pt-8 flex justify-between items-center">
              <Link
                href="/trace"
                className="text-lg text-neutral-500 hover:text-white transition"
              >
                Redraw
              </Link>

              <button
                onClick={continueToPrompt}
                disabled={!meshJson}
                className="px-6 py-3 border border-white/40 text-lg text-white hover:bg-white hover:text-black transition disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-white"
              >
                Continue →
              </button>
            </div>
          </div>
        </div>


      </section>
    </main>
  );
}