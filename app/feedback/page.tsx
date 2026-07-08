"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function FeedbackPage() {
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
      setError("Please write a message.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "feedback",
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
        <h1 className="text-2xl font-black text-[#151515] mb-2">Thanks for reaching out</h1>
        <p className="text-gray-500">Our team will read your message and follow up if needed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-black text-[#151515] mb-1">Feedback</h1>
      <p className="text-sm text-gray-500 mb-8">
        Found a bug or have a suggestion? Let us know. Looking for answers instead? Check the{" "}
        <a href="/help" className="underline hover:text-[#151515]">Help Center</a>.
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
            Email <span className="text-gray-400 font-normal">(optional, so we can reply)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-[#151515] focus:outline-none focus:border-[#151515]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#151515] mb-1">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="What's on your mind?"
            className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-[#151515] focus:outline-none focus:border-[#151515] resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-[#151515] text-white font-bold py-3 rounded px-6 hover:opacity-80 transition disabled:opacity-40 text-sm"
        >
          {submitting ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}
