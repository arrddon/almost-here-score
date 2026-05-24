// src/app/preview/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PreviewPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [promptQuestion, setPromptQuestion] = useState("");
  const [textContent, setTextContent] = useState("");
  const [inflate, setInflate] = useState("");
  const [thickness, setThickness] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setImageUrl(sessionStorage.getItem("transformedImage"));
    setPromptQuestion(sessionStorage.getItem("promptQuestion") || "");
    setTextContent(sessionStorage.getItem("textContent") || "");
    setInflate(sessionStorage.getItem("inflateAmount") || "");
    setThickness(sessionStorage.getItem("thicknessAmount") || "");
  }, []);

  const dataUrlToFile = async (dataUrl: string, fileName: string) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
  };

  const submitToSupabase = async () => {
    if (!imageUrl || !textContent.trim()) return;

    setIsSubmitting(true);

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.png`;

    const file = await dataUrlToFile(imageUrl, fileName);

    const { error: uploadError } = await supabase.storage
      .from("transformed-assets")
      .upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      setIsSubmitting(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("transformed-assets")
      .getPublicUrl(fileName);

    const { error: insertError } = await supabase
      .from("workshop_assets")
      .insert({
        room_id: "bac",
        transformed_image_url: publicUrlData.publicUrl,
        prompt_question: promptQuestion,
        text_content: textContent,
        status: "submitted",
        print_status: "pending",
        layer: "surface",
      });

    if (insertError) {
      console.error(insertError);
      setIsSubmitting(false);
      return;
    }

    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,160,255,0.1),transparent_45%)]" />

      <section className="relative z-10 min-h-screen flex flex-col justify-between p-8">
        <div className="flex justify-between text-xs uppercase tracking-[0.25em] text-neutral-600">
          <Link href="/prompt" className="hover:text-white transition">
            Back
          </Link>
          <span>06 / Preview</span>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_360px] gap-12 items-center">
          <div>
            <h1 className="text-[48px] md:text-[72px] leading-[0.9] tracking-[-0.04em] font-light">
              Preview
              <br />
              the Card
            </h1>

            <p className="mt-8 max-w-md text-neutral-500 text-lg leading-relaxed">
              Submit this artifact to the print queue.
            </p>

            <div className="mt-10 flex justify-between max-w-md text-lg">
              <Link href="/prompt" className="text-neutral-500 hover:text-white transition">
                Edit
              </Link>

              <button
                onClick={submitToSupabase}
                disabled={isSubmitting || submitted}
                className="text-neutral-300 hover:text-white transition disabled:opacity-30"
              >
                {submitted ? "Submitted" : isSubmitting ? "Submitting..." : "Submit →"}
              </button>
            </div>
          </div>

          <div className="w-full">
            <div className="aspect-[3/4] bg-[#eeeeea] text-black p-5 flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex justify-between text-[10px] uppercase tracking-[0.18em] text-black/50">
                  <span>Almost Here</span>
                  <span>Pool Trace</span>
                </div>

                <div className="mt-5 aspect-square bg-black/10 overflow-hidden">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Card preview"
                      className="w-full h-full object-cover contrast-125 saturate-150"
                    />
                  )}
                </div>

                <div className="mt-5 text-[10px] uppercase tracking-[0.16em] text-black/40">
                  {promptQuestion}
                </div>

                <p className="mt-3 text-2xl leading-tight font-light">
                  {textContent}
                </p>
              </div>

              <div className="flex justify-between text-[10px] uppercase tracking-[0.16em] text-black/40">
                <span>Inflate {inflate}</span>
                <span>Thickness {thickness}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs uppercase tracking-[0.25em] text-neutral-700">
          Print Queue / Physical Score
        </div>
      </section>
    </main>
  );
}