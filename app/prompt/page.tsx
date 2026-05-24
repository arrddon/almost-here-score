// src/app/prompt/page.tsx

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const prompts = [
  "What remains here?",
  "What happened repeatedly?",
  "What rule existed in this place?",
  "Who once moved through this water?",
];

export default function PromptPage() {
  const router = useRouter();
  const [selectedPrompt, setSelectedPrompt] = useState(prompts[0]);
  const [text, setText] = useState("");

  const continueToPreview = () => {
    sessionStorage.setItem("promptQuestion", selectedPrompt);
    sessionStorage.setItem("textContent", text);
    router.push("/preview");
  };

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,160,255,0.1),transparent_45%)]" />

      <section className="relative z-10 min-h-screen flex flex-col justify-between p-8">
        <div className="flex justify-between text-xs uppercase tracking-[0.25em] text-neutral-600">
          <Link href="/inflate" className="hover:text-white transition">
            Back
          </Link>
          <span>05 / Sentence</span>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-4xl">
            <h1 className="text-[48px] md:text-[72px] leading-[0.9] tracking-[-0.04em] font-light">
              Write
              <br />
              One Line
            </h1>

            <div className="mt-12 border-t border-white/20 pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {prompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setSelectedPrompt(prompt)}
                    className={`text-left border px-4 py-4 text-lg transition ${
                      selectedPrompt === prompt
                        ? "border-white text-white bg-white/10"
                        : "border-white/10 text-neutral-500 hover:text-white"
                    }`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 120))}
                placeholder="Type here..."
                className="mt-8 w-full h-40 bg-transparent border-t border-white/20 pt-6 text-3xl md:text-4xl font-light outline-none resize-none placeholder:text-neutral-700"
              />

              <div className="mt-4 flex justify-between text-xs uppercase tracking-[0.22em] text-neutral-700">
                <span>Max 120 characters</span>
                <span>{text.length}/120</span>
              </div>
            </div>

            <div className="mt-10 flex justify-between text-lg">
              <Link href="/inflate" className="text-neutral-500 hover:text-white transition">
                Back
              </Link>

              <button
                onClick={continueToPreview}
                disabled={!text.trim()}
                className="text-neutral-400 hover:text-white transition disabled:opacity-20"
              >
                Preview →
              </button>
            </div>
          </div>
        </div>

        <div className="text-xs uppercase tracking-[0.25em] text-neutral-700">
          Fiction / Rule / Incident / Memory
        </div>
      </section>
    </main>
  );
}