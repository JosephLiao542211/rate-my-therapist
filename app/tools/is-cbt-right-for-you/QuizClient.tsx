"use client";

import { useState } from "react";
import Link from "next/link";
import QuizProgress from "@/components/QuizProgress";

const QUESTIONS = [
  "I want practical tools I can use between sessions, not just a place to talk.",
  "I notice patterns in my thinking (like catastrophizing or all-or-nothing thinking) that make things harder.",
  "I'd rather work toward specific, measurable goals than have open-ended conversations.",
  "I'm comfortable doing \"homework\" like thought logs or exposure exercises.",
  "I want to see progress in weeks or months, not years.",
];

export default function QuizClient() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  function answer(points: number) {
    setScore((s) => s + points);
    setStep((s) => s + 1);
  }

  function restart() {
    setScore(0);
    setStep(0);
  }

  const done = step >= QUESTIONS.length;
  const pct = done ? Math.round((score / (QUESTIONS.length * 2)) * 100) : 0;

  let verdict: { title: string; body: string } | null = null;
  if (done) {
    if (pct >= 70) {
      verdict = {
        title: "CBT looks like a strong fit",
        body: "Your answers line up well with how Cognitive Behavioral Therapy works: structured, goal-driven, and focused on changing thought patterns through practice. Look for a therapist who explicitly lists CBT as a specialty.",
      };
    } else if (pct >= 40) {
      verdict = {
        title: "CBT could help, alongside other approaches",
        body: "You're a partial match — CBT's structure might help with some of what you're dealing with, but you may also want a therapist who blends in more exploratory or relational work.",
      };
    } else {
      verdict = {
        title: "You might prefer a less structured approach",
        body: "Your answers suggest you'd probably get more out of an approach that's less homework-driven and more exploratory or relational, like psychodynamic or person-centered therapy. Take the Therapy Style Quiz to narrow it down.",
      };
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-[#151515] mb-1">Is CBT Right for You?</h1>
      <p className="text-gray-500 mb-8">
        Cognitive Behavioral Therapy (CBT) is one of the most researched, structured forms of therapy. It&apos;s not
        for everyone — this quick quiz helps you see if it fits how you like to work.
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {!done ? (
          <>
            <QuizProgress step={step + 1} total={QUESTIONS.length} />
            <h2 className="font-black text-lg text-[#151515] mb-4">{QUESTIONS[step]}</h2>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => answer(2)}
                className="text-left text-sm font-semibold border border-gray-300 rounded-lg px-4 py-3 hover:border-[#151515] transition"
              >
                Agree
              </button>
              <button
                type="button"
                onClick={() => answer(1)}
                className="text-left text-sm font-semibold border border-gray-300 rounded-lg px-4 py-3 hover:border-[#151515] transition"
              >
                Somewhat
              </button>
              <button
                type="button"
                onClick={() => answer(0)}
                className="text-left text-sm font-semibold border border-gray-300 rounded-lg px-4 py-3 hover:border-[#151515] transition"
              >
                Disagree
              </button>
            </div>
          </>
        ) : (
          verdict && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{pct}% match</p>
              <h2 className="font-black text-2xl text-[#151515] mb-3">{verdict.title}</h2>
              <p className="text-sm text-gray-600 mb-6">{verdict.body}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/search?specialty=CBT"
                  className="bg-[#0057FF] text-white font-bold py-3 rounded px-6 hover:opacity-80 transition text-sm"
                >
                  Find CBT Therapists →
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

      <section className="mt-12">
        <h2 className="text-xl font-black text-[#151515] mb-3">What is CBT?</h2>
        <p className="text-sm text-gray-600 mb-4">
          Cognitive Behavioral Therapy is a structured, time-limited approach that focuses on the connection between
          thoughts, feelings, and behaviors. It&apos;s widely used for anxiety, depression, OCD, and more, and
          typically involves practicing skills between sessions rather than open-ended talk therapy.
        </p>
        <ul className="text-sm text-gray-600 list-disc pl-5 flex flex-col gap-1">
          <li>Structured, goal-oriented sessions</li>
          <li>Focus on current thought patterns, not just the past</li>
          <li>Often includes homework — thought logs, exposure exercises, behavioral experiments</li>
          <li>Strong evidence base for anxiety, depression, OCD, and phobias</li>
        </ul>
      </section>
    </div>
  );
}
