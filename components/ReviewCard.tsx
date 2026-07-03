"use client";

import { useState } from "react";
import type { Review } from "@/lib/reviews";

function ratingColor(rating: number): string {
  if (rating >= 4) return "bg-[#41F9C0]";
  if (rating >= 3) return "bg-[#FFF155]";
  return "bg-[#FF969A]";
}

function yesNo(val: boolean | null | undefined): string {
  if (val == null) return "—";
  return val ? "Yes" : "No";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ReviewCard({
  review,
  userId,
}: {
  review: Review;
  userId: string | null;
}) {
  const [helpful, setHelpful] = useState(review.helpful_count);
  const [notHelpful, setNotHelpful] = useState(review.not_helpful_count);
  const [voted, setVoted] = useState<boolean | null>(null);
  const [voting, setVoting] = useState(false);

  async function vote(isHelpful: boolean) {
    if (!userId) { window.location.href = "/auth/signin"; return; }
    if (voting) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_helpful: isHelpful }),
      });
      if (res.ok) {
        const data = await res.json();
        setHelpful(data.helpful_count);
        setNotHelpful(data.not_helpful_count);
        setVoted(isHelpful);
      }
    } finally {
      setVoting(false);
    }
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="flex">
        {/* Score column */}
        <div className="flex flex-col gap-4 p-5 shrink-0 w-32">
          <div>
            <p className="font-poppins text-xs font-black uppercase tracking-widest text-[#151515] mb-1">Quality</p>
            <div className={`${ratingColor(review.rating)} w-16 h-16 flex items-center justify-center`}>
              <span className="font-poppins text-2xl font-black text-[#151515]">
                {Number(review.rating).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-5 pl-0 min-w-0">
          {/* Top row — date */}
          <div className="flex items-center justify-end mb-3">
            <span className="text-xs text-gray-400 shrink-0">{formatDate(review.created_at)}</span>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-5 gap-y-0.5 text-sm text-[#151515] mb-3">
            <span>
              Would Recommend: <strong>{yesNo(review.would_recommend)}</strong>
            </span>
            <span>
              Felt Heard: <strong>{yesNo(review.felt_heard)}</strong>
            </span>
            <span>
              Helped w/ Goals: <strong>{yesNo(review.helped_with_goals)}</strong>
            </span>
            {review.num_sessions != null && (
              <span>
                Sessions: <strong>{review.num_sessions}</strong>
              </span>
            )}
          </div>

          {/* Body */}
          {review.body && (
            <p className="text-[#151515] text-sm leading-relaxed mb-4">{review.body}</p>
          )}

          {/* Tags */}
          {review.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {review.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-black uppercase tracking-widest border border-gray-300 rounded-full px-3 py-1 text-[#151515]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-3 text-sm text-[#151515]">
              <span className="font-semibold">Helpful</span>
              <button
                onClick={() => vote(true)}
                disabled={voting}
                aria-label="Helpful"
                className={`flex items-center gap-1 transition ${voted === true ? "opacity-100 font-bold" : "opacity-60 hover:opacity-100"}`}
              >
                <ThumbUpIcon /> {helpful}
              </button>
              <button
                onClick={() => vote(false)}
                disabled={voting}
                aria-label="Not helpful"
                className={`flex items-center gap-1 transition ${voted === false ? "opacity-100 font-bold" : "opacity-60 hover:opacity-100"}`}
              >
                <ThumbDownIcon /> {notHelpful}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button aria-label="Share" className="text-gray-400 hover:text-[#151515] transition">
                <ShareIcon />
              </button>
              <button aria-label="Flag" className="text-gray-400 hover:text-red-500 transition">
                <FlagIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThumbUpIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
    </svg>
  );
}

function ThumbDownIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18m0-14.4c3-1.6 6-1.6 9 0s6 1.6 9 0V14.4c-3 1.6-6 1.6-9 0s-6-1.6-9 0" />
    </svg>
  );
}
