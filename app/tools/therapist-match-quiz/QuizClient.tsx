"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QuizProgress from "@/components/QuizProgress";
import { SPECIALTIES, US_STATES } from "@/lib/constants";

const FORMATS = [
  { value: "telehealth", label: "Online / Telehealth" },
  { value: "in_person", label: "In-Person" },
  { value: "either", label: "Either works" },
];

export default function QuizClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [concern, setConcern] = useState("");
  const [format, setFormat] = useState("");
  const [stateAbbr, setStateAbbr] = useState("");
  const [city, setCity] = useState("");

  const totalSteps = 3;

  function next() {
    setStep((s) => Math.min(totalSteps + 1, s + 1));
  }

  function handleSubmit() {
    const sp = new URLSearchParams();
    if (concern) sp.set("specialty", concern);
    if (stateAbbr) sp.set("state", stateAbbr);
    if (city.trim()) sp.set("city", city.trim());
    router.push(`/search?${sp.toString()}`);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-[#151515] mb-1">Therapist Match Quiz</h1>
      <p className="text-gray-500 mb-8">Three quick questions, then we&apos;ll show you therapists who fit.</p>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <QuizProgress step={Math.min(step, totalSteps)} total={totalSteps} />

        {step === 1 && (
          <div>
            <h2 className="font-black text-lg text-[#151515] mb-4">What would you like help with?</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {SPECIALTIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setConcern(s)}
                  className={`text-sm font-semibold border rounded-full px-4 py-2 transition ${
                    concern === s
                      ? "bg-[#151515] border-[#151515] text-white"
                      : "border-gray-300 text-[#151515] hover:border-[#151515]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={!concern}
              onClick={next}
              className="bg-[#151515] text-white font-bold py-3 rounded px-6 hover:opacity-80 transition disabled:opacity-40 text-sm"
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-black text-lg text-[#151515] mb-4">How do you want to meet?</h2>
            <div className="flex flex-col gap-2 mb-6">
              {FORMATS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFormat(f.value)}
                  className={`text-left text-sm font-semibold border rounded-lg px-4 py-3 transition ${
                    format === f.value
                      ? "bg-[#151515] border-[#151515] text-white"
                      : "border-gray-300 text-[#151515] hover:border-[#151515]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={!format}
              onClick={next}
              className="bg-[#151515] text-white font-bold py-3 rounded px-6 hover:opacity-80 transition disabled:opacity-40 text-sm"
            >
              Next
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-black text-lg text-[#151515] mb-4">Where are you located?</h2>
            <div className="flex flex-col gap-3 mb-6">
              <select
                value={stateAbbr}
                onChange={(e) => setStateAbbr(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2.5 text-sm text-[#151515] focus:outline-none focus:border-[#151515] bg-white"
              >
                <option value="">Select state</option>
                {US_STATES.map((s) => (
                  <option key={s.abbr} value={s.abbr}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City (optional)"
                className="border border-gray-300 rounded px-3 py-2.5 text-sm text-[#151515] focus:outline-none focus:border-[#151515]"
              />
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              className="bg-[#0057FF] text-white font-bold py-3 rounded px-6 hover:opacity-80 transition text-sm"
            >
              Show My Matches →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
