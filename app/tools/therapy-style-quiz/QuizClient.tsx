"use client";

import { useState } from "react";
import Link from "next/link";
import QuizProgress from "@/components/QuizProgress";

interface Question {
  prompt: string;
  options: { label: string; style: keyof typeof STYLES }[];
}

const QUESTIONS: Question[] = [
  {
    prompt: "When you're stuck on a problem, you'd rather:",
    options: [
      { label: "Break it into concrete steps and try new ones", style: "cbt" },
      { label: "Understand where the pattern first came from", style: "psychodynamic" },
      { label: "Just be heard without being told what to do", style: "person_centered" },
      { label: "Notice how it shows up in my body right now", style: "somatic" },
    ],
  },
  {
    prompt: "Homework between sessions sounds:",
    options: [
      { label: "Great — I like having something to practice", style: "cbt" },
      { label: "Fine, but I'd rather reflect than \"do\" something", style: "psychodynamic" },
      { label: "Unnecessary — the session itself is the work", style: "person_centered" },
      { label: "Only if it's grounding exercises, not worksheets", style: "somatic" },
    ],
  },
  {
    prompt: "You're more interested in:",
    options: [
      { label: "Changing unhelpful thought patterns", style: "cbt" },
      { label: "Understanding my past and how it shaped me", style: "psychodynamic" },
      { label: "Feeling truly accepted and understood", style: "person_centered" },
      { label: "Processing a specific difficult memory or trauma", style: "somatic" },
    ],
  },
  {
    prompt: "A good session, to you, feels like:",
    options: [
      { label: "Leaving with a clear plan", style: "cbt" },
      { label: "A slow unraveling of \"why\"", style: "psychodynamic" },
      { label: "A conversation, not a treatment", style: "person_centered" },
      { label: "Something shifted, even if we didn't talk much about it", style: "somatic" },
    ],
  },
];

const STYLES = {
  cbt: {
    name: "Cognitive Behavioral (CBT)",
    description:
      "You lean toward structure and action — identifying unhelpful thoughts and patterns, then practicing concrete ways to shift them. CBT therapists tend to be direct, goal-oriented, and collaborative.",
    specialty: "CBT",
  },
  psychodynamic: {
    name: "Psychodynamic / Insight-Oriented",
    description:
      "You're drawn to understanding the roots of a pattern — how your past, relationships, and unconscious habits shape what you're going through now. Sessions tend to be more exploratory and less structured.",
    specialty: null,
  },
  person_centered: {
    name: "Person-Centered / Humanistic",
    description:
      "You want to feel genuinely heard and accepted, without being steered toward a specific technique. Person-centered therapists focus on empathy and creating space for you to find your own answers.",
    specialty: null,
  },
  somatic: {
    name: "Trauma-Focused / Somatic",
    description:
      "You notice that difficult experiences live in your body as much as your mind. Trauma-focused approaches like EMDR and somatic therapy work with the nervous system, not just the narrative.",
    specialty: "EMDR",
  },
} as const;

export default function QuizClient() {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});

  function answer(style: string) {
    setScores((s) => ({ ...s, [style]: (s[style] ?? 0) + 1 }));
    setStep((s) => s + 1);
  }

  function restart() {
    setScores({});
    setStep(0);
  }

  const done = step >= QUESTIONS.length;
  const result = done
    ? (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] as keyof typeof STYLES | undefined)
    : undefined;
  const styleInfo = result ? STYLES[result] : null;

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-[#151515] mb-1">Therapy Style Quiz</h1>
      <p className="text-gray-500 mb-8">
        There&apos;s no single &ldquo;right&rdquo; kind of therapy — find the approach that matches how you actually process things.
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {!done ? (
          <>
            <QuizProgress step={step + 1} total={QUESTIONS.length} />
            <h2 className="font-black text-lg text-[#151515] mb-4">{QUESTIONS[step].prompt}</h2>
            <div className="flex flex-col gap-2">
              {QUESTIONS[step].options.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => answer(o.style)}
                  className="text-left text-sm font-semibold border border-gray-300 rounded-lg px-4 py-3 hover:border-[#151515] transition"
                >
                  {o.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          styleInfo && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Your style</p>
              <h2 className="font-black text-2xl text-[#151515] mb-3">{styleInfo.name}</h2>
              <p className="text-sm text-gray-600 mb-6">{styleInfo.description}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={styleInfo.specialty ? `/search?specialty=${encodeURIComponent(styleInfo.specialty)}` : "/search"}
                  className="bg-[#0057FF] text-white font-bold py-3 rounded px-6 hover:opacity-80 transition text-sm"
                >
                  Find {styleInfo.name.split(" ")[0]} Therapists →
                </Link>
                <button
                  type="button"
                  onClick={restart}
                  className="text-sm font-semibold text-gray-500 hover:text-[#151515] transition"
                >
                  Retake quiz
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
