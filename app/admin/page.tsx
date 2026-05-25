// app/admin/page.tsx

"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf";

type WorkshopAsset = {
  id: string;
  room_id: string;
  original_image_url: string | null;
  trace_mask_url: string | null;
  transformed_image_url: string | null;
  mesh_json_url: string | null;
  prompt_answers: {
    remains?: string;
    repeated?: string;
    rule?: string;
    body?: string;
  } | null;
  text_content: string | null;
  inflate_amount: number | null;
  thickness_amount: number | null;
  print_status: string | null;
  created_at: string;
};

export default function AdminPage() {
  const [assets, setAssets] = useState<WorkshopAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("workshop_assets")
      .select("*")
      .eq("room_id", "bac")
      .eq("status", "submitted")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert(error.message);
    } else {
      setAssets(data || []);
    }

    setLoading(false);
  };

  const markAsPrinted = async (id: string) => {
    const { error } = await supabase
      .from("workshop_assets")
      .update({ print_status: "printed" })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchAssets();
  };

  const loadImageAsDataUrl = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();

    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  const downloadCardPdf = async (asset: WorkshopAsset) => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a6",
    });

    const pageWidth = 105;
    const pageHeight = 148;

    pdf.setFillColor(238, 238, 234);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(6);
    pdf.text("ALMOST HERE", 8, 8);
    pdf.text("POOL TRACE", pageWidth - 8, 8, { align: "right" });

    if (asset.transformed_image_url) {
      const imageData = await loadImageAsDataUrl(asset.transformed_image_url);
      pdf.addImage(imageData, "PNG", 8, 14, 89, 89);
    }

    const answers = asset.prompt_answers || {};

    const fragments = [
      ["REMAINS", answers.remains || "—"],
      ["REPEATS", answers.repeated || "—"],
      ["RULE", answers.rule || "—"],
      ["BODY", answers.body || "—"],
    ];

    let y = 111;

    fragments.forEach(([label, value], index) => {
      const x = index % 2 === 0 ? 8 : 56;
      const rowY = y + Math.floor(index / 2) * 18;

      pdf.setFontSize(5);
      pdf.setTextColor(90, 90, 90);
      pdf.text(label, x, rowY);

      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);

      const wrapped = pdf.splitTextToSize(value, 38);
      pdf.text(wrapped.slice(0, 2), x, rowY + 5);
    });

    pdf.setFontSize(5);
    pdf.setTextColor(90, 90, 90);
    pdf.text(`INFLATE ${asset.inflate_amount ?? ""}`, 8, 143);
    pdf.text(`THICKNESS ${asset.thickness_amount ?? ""}`, pageWidth - 8, 143, {
      align: "right",
    });

    pdf.save(`almost-here-${asset.id}.pdf`);
  };

  const downloadAllPdf = async () => {
    if (assets.length === 0) return;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a6",
    });

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];

      if (i > 0) pdf.addPage("a6", "portrait");

      pdf.setFillColor(238, 238, 234);
      pdf.rect(0, 0, 105, 148, "F");

      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");

      pdf.setFontSize(6);
      pdf.text("ALMOST HERE", 8, 8);
      pdf.text("POOL TRACE", 97, 8, { align: "right" });

      if (asset.transformed_image_url) {
        const imageData = await loadImageAsDataUrl(asset.transformed_image_url);
        pdf.addImage(imageData, "PNG", 8, 14, 89, 89);
      }

      const answers = asset.prompt_answers || {};

      const fragments = [
        ["REMAINS", answers.remains || "—"],
        ["REPEATS", answers.repeated || "—"],
        ["RULE", answers.rule || "—"],
        ["BODY", answers.body || "—"],
      ];

      let y = 111;

      fragments.forEach(([label, value], index) => {
        const x = index % 2 === 0 ? 8 : 56;
        const rowY = y + Math.floor(index / 2) * 18;

        pdf.setFontSize(5);
        pdf.setTextColor(90, 90, 90);
        pdf.text(label, x, rowY);

        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);

        const wrapped = pdf.splitTextToSize(value, 38);
        pdf.text(wrapped.slice(0, 2), x, rowY + 5);
      });

      pdf.setFontSize(5);
      pdf.setTextColor(90, 90, 90);
      pdf.text(`INFLATE ${asset.inflate_amount ?? ""}`, 8, 143);
      pdf.text(`THICKNESS ${asset.thickness_amount ?? ""}`, 97, 143, {
        align: "right",
      });
    }

    pdf.save("almost-here-print-queue.pdf");
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 " />

      <section className="relative z-10 min-h-screen p-8">
        <header className="flex justify-between items-center text-sm uppercase tracking-[0.22em] text-neutral-500">
          <span className="text-white">Admin / Print Queue</span>

          <div className="flex gap-6">
            <button onClick={downloadAllPdf} className="hover:text-white transition">
              Download All PDF
            </button>

            <button onClick={fetchAssets} className="hover:text-white transition">
              Refresh
            </button>
          </div>
        </header>

        <div className="mt-16 flex justify-between items-end">
          <h1 className="text-[72px] md:text-[128px] leading-[0.88] tracking-[-0.05em] font-light">
            Print
            <br />
            Queue
          </h1>

          <div className="text-right text-sm uppercase tracking-[0.22em] text-neutral-600">
            {loading ? "Loading" : `${assets.length} cards`}
          </div>
        </div>

        <div className="mt-12 border-t border-white/20 pt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {assets.map((asset) => {
            const answers = asset.prompt_answers || {};

            return (
              <article
                key={asset.id}
                className="border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="aspect-[3/4] bg-[#eeeeea] text-black p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between text-[9px] uppercase tracking-[0.18em] text-black/50">
                      <span>Almost Here</span>
                      <span>{asset.print_status || "pending"}</span>
                    </div>

                    <div className="mt-4 aspect-square bg-black overflow-hidden">
                      {asset.transformed_image_url && (
                        <img
                          src={asset.transformed_image_url}
                          alt="Transformed asset"
                          className="w-full h-full object-cover contrast-125 saturate-150"
                        />
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {[
                        ["Remains", answers.remains],
                        ["Repeats", answers.repeated],
                        ["Rule", answers.rule],
                        ["Body", answers.body],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <div className="text-[8px] uppercase tracking-[0.16em] text-black/35">
                            {label}
                          </div>
                          <p className="mt-1 text-xs leading-tight font-light">
                            {value || "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between text-[8px] uppercase tracking-[0.16em] text-black/40">
                    <span>Inflate {asset.inflate_amount}</span>
                    <span>Thickness {asset.thickness_amount}</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center text-sm">
                  <button
                    onClick={() => downloadCardPdf(asset)}
                    className="text-neutral-400 hover:text-white transition"
                  >
                    Download PDF
                  </button>

                  <button
                    onClick={() => markAsPrinted(asset.id)}
                    className="px-4 py-2 border border-white/30 hover:bg-white hover:text-black transition disabled:opacity-30"
                    disabled={asset.print_status === "printed"}
                  >
                    {asset.print_status === "printed"
                      ? "Printed"
                      : "Mark Printed"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}