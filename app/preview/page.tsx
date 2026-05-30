// app/preview/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { get as idbGet } from "idb-keyval";
import * as THREE from "three";
import { GLTFExporter } from "three-stdlib";
import { supabase } from "../../lib/supabase";
import PreviewMesh from "../../components/PreviewMesh";

type PromptAnswers = {
  name?: string;
  sentence?: string;
};

export default function PreviewPage() {
  const router = useRouter();
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [traceMask, setTraceMask] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [meshJson, setMeshJson] = useState<any>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  const [promptAnswers, setPromptAnswers] = useState<PromptAnswers>({});
  const [inflate, setInflate] = useState("");
  const [surfaceDetail, setSurfaceDetail] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setOriginalImage(sessionStorage.getItem("originalImage"));
      setTraceMask(sessionStorage.getItem("traceMask"));
      setTransformedImage(sessionStorage.getItem("transformedImage"));

      const storedMesh = await idbGet("meshJson");
      setMeshJson(storedMesh || null);

      const storedAnswers = sessionStorage.getItem("promptAnswers");
      setPromptAnswers(storedAnswers ? JSON.parse(storedAnswers) : {});

      setInflate(sessionStorage.getItem("inflateAmount") || "");
      setSurfaceDetail(sessionStorage.getItem("surfaceDetailAmount") || "");
    };

    loadData();
  }, []);

  const dataUrlToFile = async (dataUrl: string, fileName: string) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
  };

  const uploadDataUrl = async (
    bucket: string,
    dataUrl: string,
    fileName: string
  ) => {
    const file = await dataUrlToFile(dataUrl, fileName);
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const prepareGeometryForGLB = (geometry: THREE.BufferGeometry) => {
    const glbGeometry = geometry.clone();
    const uvAttribute = glbGeometry.getAttribute("uv");

    if (uvAttribute) {
      const uvArray = uvAttribute.array as Float32Array;

      for (let i = 1; i < uvArray.length; i += 2) {
        uvArray[i] = 1 - uvArray[i];
      }

      uvAttribute.needsUpdate = true;
    }

    glbGeometry.computeVertexNormals();
    return glbGeometry;
  };

  const exportGLB = async (
    geometry: THREE.BufferGeometry,
    textureUrl: string
  ) => {
    const texture = await new THREE.TextureLoader().loadAsync(textureUrl);

    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.34,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });

    const glbGeometry = prepareGeometryForGLB(geometry);
    const mesh = new THREE.Mesh(glbGeometry, material);
    mesh.name = "Almost_Here_Pillow_Trace";

    const scene = new THREE.Scene();
    scene.add(mesh);

    const exporter = new GLTFExporter();

    return new Promise<Blob>((resolve, reject) => {
      exporter.parse(
        scene,
        (result) => {
          resolve(
            new Blob([result as ArrayBuffer], {
              type: "model/gltf-binary",
            })
          );
        },
        (error) => reject(error),
        { binary: true }
      );
    });
  };

  const uploadGLB = async (blob: Blob, fileName: string) => {
    const file = new File([blob], fileName, {
      type: "model/gltf-binary",
    });

    const { error } = await supabase.storage
      .from("glb-assets")
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage.from("glb-assets").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const submitToSupabase = async () => {
    if (!originalImage || !traceMask) return;

    try {
      setIsSubmitting(true);

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const originalImageUrl = await uploadDataUrl(
        "original-images",
        originalImage,
        `${id}-original.png`
      );

      const traceMaskUrl = await uploadDataUrl(
        "trace-masks",
        traceMask,
        `${id}-trace-mask.png`
      );

      let transformedImageUrl = "";

      if (previewCanvasRef.current) {
        const canvasImage = previewCanvasRef.current.toDataURL("image/png");

        transformedImageUrl = await uploadDataUrl(
          "transformed-assets",
          canvasImage,
          `${id}-transformed.png`
        );
      } else if (transformedImage) {
        transformedImageUrl = await uploadDataUrl(
          "transformed-assets",
          transformedImage,
          `${id}-transformed.png`
        );
      }

      const meshJsonUrl = "";

      let glbUrl = "";

      if (geometry && originalImage) {
        const glbBlob = await exportGLB(geometry, originalImage);
        glbUrl = await uploadGLB(glbBlob, `${id}-mesh.glb`);
      }

      const combinedText = promptAnswers.sentence || "";

      const { error } = await supabase.from("workshop_assets").insert({
        room_id: "bac",
        original_image_url: originalImageUrl,
        trace_mask_url: traceMaskUrl,
        transformed_image_url: transformedImageUrl,
        mesh_json_url: meshJsonUrl,
        glb_url: glbUrl,

        author_name: promptAnswers.name || "",

        prompt_answers: promptAnswers,
        text_content: combinedText,

        inflate_amount: Number(inflate),
        thickness_amount: Number(surfaceDetail),

        trace_points: JSON.parse(sessionStorage.getItem("tracePoints") || "[]"),

        status: "submitted",
        print_status: "pending",
        layer: "surface",
      });

      if (error) throw error;

      setSubmitted(true);
      router.push("/complete");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Submit failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="safe-screen bg-black text-white overflow-x-hidden relative">
      <section className="relative z-10 page-shell flex flex-col justify-between">
        <div className="flex justify-between items-center text-sm uppercase tracking-[0.22em] text-neutral-500">
          <Link href="/prompt" className="hover:text-white transition">
            Back
          </Link>
          <span className="text-white">06 / Preview</span>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_460px] gap-12 items-center">
          <div>
            <h1 className="hero-title">
              Record
              <br />
              the Trace
            </h1>

            <div className="mt-12 flex gap-6 text-lg">
              <Link
                href="/prompt"
                className="text-neutral-500 hover:text-white transition"
              >
                Edit
              </Link>

              <button
                onClick={submitToSupabase}
                disabled={isSubmitting || submitted}
                className="px-6 py-3 border border-white/40 text-white hover:bg-white hover:text-black transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white"
              >
                {submitted
                  ? "Submitted"
                  : isSubmitting
                  ? "Submitting..."
                  : "Submit →"}
              </button>
            </div>
          </div>

          <div className="w-full">
            <div className="aspect-[3/4] bg-[#eeeeea] text-black p-5 flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex justify-between items-start text-[10px] uppercase tracking-[0.18em] text-black/50">
                  <div>
                    <div>Almost Here</div>
                    <div className="mt-1 text-[9px] tracking-[0.12em] text-black/35">
                      By {promptAnswers.name || "Unknown"}
                    </div>
                  </div>

                  <span>Pool Trace</span>
                </div>

                <div className="mt-5 aspect-square bg-black overflow-hidden">
                  {originalImage && traceMask && meshJson ? (
                    <PreviewMesh
                      imageUrl={originalImage}
                      maskUrl={traceMask}
                      meshJson={meshJson}
                      canvasRef={previewCanvasRef}
                      onGeometryReady={setGeometry}
                    />
                  ) : (
                    transformedImage && (
                      <img
                        src={transformedImage}
                        alt="Card preview"
                        className="w-full h-full object-cover contrast-125 saturate-150"
                      />
                    )
                  )}
                </div>

                <div className="mt-5 border-t border-black/10 pt-4">
                  <div className="text-[9px] uppercase tracking-[0.16em] text-black/35">
                    Sentence
                  </div>

                  <p className="mt-2 text-sm leading-relaxed font-light text-black/80">
                    {promptAnswers.sentence || "—"}
                  </p>
                </div>
              </div>

              <div>
                <div className="grid grid-cols-3 gap-2 mt-5">
                  {originalImage && (
                    <img
                      src={originalImage}
                      alt="Original"
                      className="aspect-square object-cover opacity-70"
                    />
                  )}

                  {traceMask && (
                    <img
                      src={traceMask}
                      alt="Trace mask"
                      className="aspect-square object-cover opacity-70"
                    />
                  )}

                  {transformedImage && (
                    <img
                      src={transformedImage}
                      alt="Mesh thumbnail"
                      className="aspect-square object-cover opacity-70"
                    />
                  )}
                </div>

                <div className="mt-3 flex justify-between text-[9px] uppercase tracking-[0.16em] text-black/40">
                  <span>Inflate {inflate}</span>
                  <span>Detail {surfaceDetail}</span>
                  <span>GLB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}