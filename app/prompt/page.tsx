// app/prompt/page.tsx

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PromptPage() {
  const router = useRouter();

  const [answers, setAnswers] = useState({
    name: "",
    sentence: "",
  });

  const updateAnswer = (key: keyof typeof answers, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value.slice(0, 180),
    }));
  };

  const continueToPreview = () => {
    sessionStorage.setItem("promptAnswers", JSON.stringify(answers));
    sessionStorage.setItem("textContent", answers.sentence);
    router.push("/preview");
  };

  const canContinue =
    answers.name.trim() !== "" && answers.sentence.trim() !== "";

  return (
    <main className="safe-screen bg-black text-white overflow-x-hidden relative">
      <section className="relative z-10 page-shell flex flex-col justify-between">
        <div className="flex justify-between items-center text-sm uppercase tracking-[0.22em] text-neutral-500">
          <Link href="/inflate" className="hover:text-white transition">
            Back
          </Link>
          <span className="text-white">05 / Sentence</span>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-5xl">
            <h1 className="hero-title">
              Record
              <br />
              the Pool
            </h1>

            <div className="mt-10 border-t border-white/20 pt-8">
              <div className="text-xs uppercase tracking-[0.22em] text-neutral-500 mb-3">
                Name
              </div>

              <input
                value={answers.name}
                onChange={(e) => updateAnswer("name", e.target.value)}
                placeholder="Your name..."
                className="w-full md:w-[420px] bg-white/[0.03] border border-white/10 px-4 py-4 text-2xl font-light outline-none placeholder:text-neutral-700 focus:border-white/40"
              />
            </div>

            <div className="mt-8">
              <div className="text-xs uppercase tracking-[0.22em] text-neutral-500 mb-3">
                One Sentence
              </div>

              <p className="mb-4 max-w-2xl text-sm md:text-base text-neutral-500 leading-relaxed">
                Using the clues you found, write one fictional sentence about
                this imagined swimming pool.
              </p>

              <textarea
                value={answers.sentence}
                onChange={(e) => updateAnswer("sentence", e.target.value)}
                placeholder="Write one fictional sentence..."
                className="w-full h-40 bg-white/[0.03] border border-white/10 p-4 text-2xl font-light outline-none resize-none placeholder:text-neutral-700 focus:border-white/40"
              />

              <div className="mt-3 flex justify-between text-xs uppercase tracking-[0.2em] text-neutral-600">
                <span>Max 180 characters</span>
                <span>{answers.sentence.length}/180</span>
              </div>
            </div>

            <div className="mt-10 flex justify-end items-center">
              <button
                onClick={continueToPreview}
                disabled={!canContinue}
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