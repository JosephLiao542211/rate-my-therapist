"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ClaimForm({ slug, therapistName }: { slug: string; therapistName: string }) {
  const router = useRouter();
  const { data: session } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user) {
      setName((n) => n || session.user?.name || "");
      setEmail((e) => e || session.user?.email || "");
    }
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please tell us a bit about your request.");
      return;
    }
    if (!email.trim()) {
      setError("Please provide an email so we can reach you.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "claim",
          therapist_slug: slug,
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-[#151515] mb-2">Request sent</h1>
        <p className="text-gray-500 mb-8">
          Thanks — our team will review your request and follow up at the email you provided.
        </p>
        <button
          onClick={() => router.push(`/therapist/${slug}`)}
          className="bg-[#151515] text-white font-bold px-6 py-3 rounded-full hover:opacity-80 transition text-sm"
        >
          Back to profile
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-black text-[#151515] mb-1">I&apos;m {therapistName}</h1>
      <p className="text-sm text-gray-500 mb-8">
        Claim this profile, request an edit, or ask us to take it down. Our team reviews every request.
      </p>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-semibold text-[#151515] mb-1">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-[#151515] focus:outline-none focus:border-[#151515]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#151515] mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-[#151515] focus:outline-none focus:border-[#151515]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#151515] mb-1">
            What would you like us to do? <span className="text-red-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="e.g. This is my listing, please let me claim and manage it. Or: please update my phone number to..."
            className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-[#151515] focus:outline-none focus:border-[#151515] resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-[#151515] text-white font-bold py-3 rounded px-6 hover:opacity-80 transition disabled:opacity-40 text-sm"
        >
          {submitting ? "Sending…" : "Send Request"}
        </button>
      </form>
    </div>
  );
}
