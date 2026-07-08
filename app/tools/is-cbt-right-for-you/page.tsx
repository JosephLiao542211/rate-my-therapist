import type { Metadata } from "next";
import { BASE } from "@/lib/seo";
import QuizClient from "./QuizClient";

export const metadata: Metadata = {
  title: "Is CBT Right for You? — Free Quiz",
  description:
    "A quick quiz to see whether Cognitive Behavioral Therapy (CBT) fits how you like to work through problems, plus what CBT actually involves.",
  alternates: { canonical: `${BASE}/tools/is-cbt-right-for-you` },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is CBT (Cognitive Behavioral Therapy)?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CBT is a structured, time-limited form of therapy focused on the connection between thoughts, feelings, and behaviors. It typically includes practicing skills between sessions, such as thought logs or exposure exercises.",
      },
    },
    {
      "@type": "Question",
      name: "Is CBT effective?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CBT has one of the strongest evidence bases of any therapy approach, particularly for anxiety, depression, OCD, and phobias.",
      },
    },
    {
      "@type": "Question",
      name: "How is CBT different from other types of therapy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CBT is more structured and goal-oriented than approaches like psychodynamic or person-centered therapy, which tend to be more exploratory and open-ended.",
      },
    },
  ],
};

export default function IsCbtRightForYouPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <QuizClient />
    </>
  );
}
