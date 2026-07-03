"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { REVIEW_TAGS } from "@/components/TagPicker";

const RATING_LABELS: Record<number, string> = {
  1: "Awful",
  2: "OK",
  3: "Good",
  4: "Great",
  5: "Awesome",
};

const RATING_COLORS: Record<number, string> = {
  1: "bg-[#FF969A]",
  2: "bg-[#FF969A]",
  3: "bg-[#FFF155]",
  4: "bg-[#41F9C0]",
  5: "bg-[#41F9C0]",
};

function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex items-center gap-3">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className={`w-14 h-14 font-black text-xl text-[#151515] transition ${
            active >= s ? (RATING_COLORS[s] ?? "bg-[#41F9C0]") : "bg-gray-200"
          }`}
          aria-label={`${s} — ${RATING_LABELS[s]}`}
        >
          {s}
        </button>
      ))}
      {active > 0 && (
        <span className="text-sm font-black text-[#151515] ml-2">{RATING_LABELS[active]}</span>
      )}
    </div>
  );
}

function YesNoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <p className="text-sm font-black text-[#151515] mb-2">{label}</p>
      <div className="flex gap-3">
        {([true, false] as const).map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(v)}
            className={`px-6 py-2 rounded-full text-sm font-bold border-2 transition ${
              value === v
                ? "bg-[#151515] border-[#151515] text-white"
                : "border-gray-300 text-[#151515] hover:border-[#151515]"
            }`}
          >
            {v ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AddReviewPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [rating, setRating] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [feltHeard, setFeltHeard] = useState<boolean | null>(null);
  const [helpedWithGoals, setHelpedWithGoals] = useState<boolean | null>(null);
  const [numSessions, setNumSessions] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [body, setBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 5 ? [...prev, tag] : prev
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          therapist_slug: slug,
          rating,
          would_recommend: wouldRecommend,
          felt_heard: feltHeard,
          helped_with_goals: helpedWithGoals,
          num_sessions: numSessions ? parseInt(numSessions, 10) : null,
          tags,
          body: body.trim(),
          is_anonymous: isAnonymous,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(`/therapist/${slug}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-[#151515] mb-8">Rate this Therapist</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-8 flex flex-col gap-8">
        {/* Star rating */}
        <div>
          <p className="text-sm font-black text-[#151515] uppercase tracking-wide mb-3">
            Overall Rating <span className="text-red-500">*</span>
          </p>
          <StarSelector value={rating} onChange={setRating} />
        </div>

        {/* Yes/No fields */}
        <div className="flex flex-col gap-5">
          <YesNoField label="Would you recommend this therapist?" value={wouldRecommend} onChange={setWouldRecommend} />
          <YesNoField label="Did you feel heard and understood?" value={feltHeard} onChange={setFeltHeard} />
          <YesNoField label="Did therapy help you work toward your goals?" value={helpedWithGoals} onChange={setHelpedWithGoals} />
        </div>

        {/* Sessions */}
        <div>
          <label className="block text-sm font-black text-[#151515] uppercase tracking-wide mb-2">
            Number of Sessions <span className="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          <input
            type="number"
            min={1}
            max={999}
            value={numSessions}
            onChange={(e) => setNumSessions(e.target.value)}
            placeholder="e.g. 8"
            className="w-28 border border-gray-300 rounded px-3 py-2 text-sm text-[#151515] focus:outline-none focus:border-[#151515]"
          />
        </div>

        {/* Tags */}
        <div>
          <p className="text-sm font-black text-[#151515] uppercase tracking-wide mb-3">
            Tags <span className="text-gray-400 font-normal normal-case">(pick up to 5)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {REVIEW_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`text-[10px] font-black uppercase tracking-widest border rounded-full px-3 py-1 transition ${
                  tags.includes(tag)
                    ? "bg-[#151515] border-[#151515] text-white"
                    : "border-gray-300 text-[#151515] hover:border-[#151515]"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-black text-[#151515] uppercase tracking-wide mb-2">
            Your Review <span className="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your experience — what was helpful, what wasn't, and anything others should know..."
            rows={6}
            className="w-full border border-gray-300 rounded px-4 py-3 text-sm text-[#151515] focus:outline-none focus:border-[#151515] resize-none"
          />
        </div>

        {/* Anonymous */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 rounded border-gray-400"
          />
          <span className="text-sm text-[#151515]">Post anonymously</span>
        </label>

        {error && <p className="text-sm text-red-600 font-bold">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-[#151515] text-white font-black py-4 rounded hover:opacity-80 transition disabled:opacity-40 text-sm uppercase tracking-wide"
        >
          {submitting ? "Submitting…" : "Submit Rating"}
        </button>
      </form>
    </div>
  );
}
