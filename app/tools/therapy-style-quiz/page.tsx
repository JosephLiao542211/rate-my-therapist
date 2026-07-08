import type { Metadata } from "next";
import { BASE } from "@/lib/seo";
import QuizClient from "./QuizClient";

export const metadata: Metadata = {
  title: "Therapy Style Quiz — Which Approach Fits You?",
  description:
    "A short quiz to help you figure out whether CBT, psychodynamic, person-centered, or trauma-focused therapy fits how you actually process things.",
  alternates: { canonical: `${BASE}/tools/therapy-style-quiz` },
};

export default function TherapyStyleQuizPage() {
  return <QuizClient />;
}
