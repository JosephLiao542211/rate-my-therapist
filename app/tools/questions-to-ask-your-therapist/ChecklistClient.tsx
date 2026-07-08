"use client";

import { useState } from "react";

const CATEGORIES: { title: string; items: string[] }[] = [
  {
    title: "Credentials & Approach",
    items: [
      "What are your credentials and licenses?",
      "What's your therapeutic approach or style (e.g. CBT, psychodynamic, person-centered)?",
      "Do you have experience with what I'm dealing with specifically?",
      "How do you typically structure a session?",
    ],
  },
  {
    title: "Logistics & Practical",
    items: [
      "What's your fee, and do you offer a sliding scale?",
      "Do you take my insurance, or can you provide a superbill?",
      "Do you offer telehealth, in-person, or both?",
      "What's your cancellation policy?",
      "How often would we meet, and for how long?",
    ],
  },
  {
    title: "Fit & Comfort",
    items: [
      "How will we know if therapy is working?",
      "What happens if I feel like this isn't the right fit?",
      "How do you handle disagreements or feedback about the sessions?",
      "Are you comfortable working with my identity/background (culture, LGBTQ+, faith, etc.)?",
    ],
  },
];

export default function ChecklistClient() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  function toggle(item: string) {
    setChecked((c) => ({ ...c, [item]: !c[item] }));
  }

  const total = CATEGORIES.reduce((n, c) => n + c.items.length, 0);
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <p className="text-sm font-semibold text-gray-500">
          {done} of {total} checked
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="text-sm font-bold border border-gray-300 rounded-full px-4 py-1.5 hover:border-[#151515] transition"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="flex flex-col gap-8">
        {CATEGORIES.map((cat) => (
          <div key={cat.title}>
            <h2 className="font-black text-lg text-[#151515] mb-3">{cat.title}</h2>
            <div className="flex flex-col gap-2">
              {cat.items.map((item) => (
                <label
                  key={item}
                  className="flex items-start gap-3 cursor-pointer select-none bg-white border border-gray-200 rounded-lg px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={!!checked[item]}
                    onChange={() => toggle(item)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-400 shrink-0 print:hidden"
                  />
                  <span className={`text-sm ${checked[item] ? "line-through text-gray-400" : "text-[#151515]"}`}>
                    {item}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
