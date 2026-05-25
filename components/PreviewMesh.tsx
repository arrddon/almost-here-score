// components/PreviewMesh.tsx

"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader, BufferGeometry, Float32BufferAttribute } from "three";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type MeshJson = {
  vertices: number[][];
  faces: number[][];
  uvs: number[][];
  surfaceDetail?: number;
};

function MeshObject({
  meshJson,
  imageUrl,
  onGeometryReady,
}: {
  meshJson: MeshJson;
  imageUrl: string;
  onGeometryReady?: (geometry: THREE.BufferGeometry) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useLoader(TextureLoader, imageUrl);

  const geometry = useMemo(() => {
    const geo = new BufferGeometry();

    geo.setAttribute(
      "position",
      new Float32BufferAttribute(meshJson.vertices.flat(), 3)
    );

    geo.setAttribute("uv", new Float32BufferAttribute(meshJson.uvs.flat(), 2));

    geo.setIndex(meshJson.faces.flat());
    geo.computeVertexNormals();

    return geo;
  }, [meshJson]);

  useEffect(() => {
    onGeometryReady?.(geometry);
  }, [geometry, onGeometryReady]);

  useFrame(() => {
    if (!groupRef.current) return;

    groupRef.current.rotation.y += 0.006;
    groupRef.current.rotation.x = -0.16;
  });

  return (
    <group ref={groupRef} scale={0.95}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          map={texture}
          roughness={0.34}
          metalness={0.04}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function PreviewMesh({
  meshJson,
  imageUrl,
  canvasRef,
  onGeometryReady,
}: {
  meshJson: MeshJson;
  imageUrl: string;
  maskUrl?: string;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  onGeometryReady?: (geometry: THREE.BufferGeometry) => void;
}) {
  return (
    <Canvas
      gl={{ preserveDrawingBuffer: true, alpha: true }}
      camera={{ position: [0, 0, 5.8], fov: 38 }}
      onCreated={({ gl }) => {
        if (canvasRef) {
          canvasRef.current = gl.domElement;
        }
      }}
    >
      <ambientLight intensity={1.15} />
      <directionalLight position={[2, 3, 4]} intensity={2.3} />
      <directionalLight position={[-3, -2, 2]} intensity={0.8} />

      <MeshObject
        meshJson={meshJson}
        imageUrl={imageUrl}
        onGeometryReady={onGeometryReady}
      />
    </Canvas>
  );
}