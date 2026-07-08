import type { Metadata } from "next";
import { BASE } from "@/lib/seo";
import QuizClient from "./QuizClient";

export const metadata: Metadata = {
  title: "Therapist Match Quiz — Find Your Fit",
  description:
    "Answer 3 quick questions about what you need help with, how you want to meet, and where you're located — get matched with therapists that fit.",
  alternates: { canonical: `${BASE}/tools/therapist-match-quiz` },
};

export default function TherapistMatchQuizPage() {
  return <QuizClient />;
}
