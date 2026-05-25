// app/prompt/page.tsx

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PromptPage() {
  const router = useRouter();

  const [answers, setAnswers] = useState({
    name: "",
    remains: "",
    repeated: "",
    rule: "",
    body: "",
  });

  const updateAnswer = (key: keyof typeof answers, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value.slice(0, 90),
    }));
  };

  const continueToPreview = () => {
    sessionStorage.setItem("promptAnswers", JSON.stringify(answers));

    const combinedText = [
      answers.remains,
      answers.repeated,
      answers.rule,
      answers.body,
    ]
      .filter(Boolean)
      .join(" / ");

    sessionStorage.setItem("textContent", combinedText);
    router.push("/preview");
  };

  const canContinue = Object.values(answers).some((value) => value.trim());

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 " />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_25%_20%,rgba(0,255,220,0.08),transparent_28%),radial-gradient(circle_at_80%_75%,rgba(255,120,220,0.08),transparent_30%)]" />

      <section className="relative z-10 min-h-screen flex flex-col justify-between p-8">
        <div className="flex justify-between items-center text-sm uppercase tracking-[0.22em] text-neutral-500">
          <Link href="/inflate" className="hover:text-white transition">
            Back
          </Link>
          <span className="text-white">05 / Sentence</span>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-6xl">
            <h1 className="text-[72px] md:text-[128px] leading-[0.88] tracking-[-0.05em] font-light">
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

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                ["remains", "What traces remain here?"],
                ["repeated", "What happened repeatedly?"],
                ["rule", "What rule shaped this environment?"],
                ["body", "Who passed through this water?"],
              ].map(([key, label]) => (
                <div key={key}>
                  <div className="text-xs uppercase tracking-[0.22em] text-neutral-500 mb-3">
                    {label}
                  </div>

                  <textarea
                    value={answers[key as keyof typeof answers]}
                    onChange={(e) =>
                      updateAnswer(key as keyof typeof answers, e.target.value)
                    }
                    placeholder="Type one short line..."
                    className="w-full h-32 bg-white/[0.03] border border-white/10 p-4 text-2xl font-light outline-none resize-none placeholder:text-neutral-700 focus:border-white/40"
                  />
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-between items-center">


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