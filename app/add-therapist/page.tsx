"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { US_STATES, SPECIALTIES } from "@/lib/constants";

const MODALITIES = [
  "CBT (Cognitive Behavioral Therapy)",
  "DBT (Dialectical Behavior Therapy)",
  "EMDR",
  "Psychodynamic",
  "ACT (Acceptance & Commitment Therapy)",
  "Mindfulness-Based",
  "Solution-Focused",
  "Trauma-Focused",
  "Humanistic",
  "Somatic",
];

const LANGUAGES = [
  "English", "Spanish", "French", "Mandarin", "Cantonese",
  "Portuguese", "Arabic", "Hindi", "Korean", "Vietnamese",
  "Tagalog", "Russian", "German", "Italian", "Japanese",
];

export default function AddTherapistPage() {
  const router = useRouter();

  // Basic info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [practiceName, setPracticeName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [stateAbbr, setStateAbbr] = useState("");
  const [bio, setBio] = useState("");

  // Credentials & role
  const [credentials, setCredentials] = useState("");   // comma-separated
  const [yearsInPractice, setYearsInPractice] = useState("");

  // Specialties / modalities / languages
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedModalities, setSelectedModalities] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Practical info
  const [telehealth, setTelehealth] = useState(false);
  const [inPerson, setInPerson] = useState(true);
  const [slidingScale, setSlidingScale] = useState(false);
  const [sessionCost, setSessionCost] = useState("");

  // Terms
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggleItem(
    list: string[],
    setList: (v: string[]) => void,
    item: string
  ) {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!city.trim() || !stateAbbr) {
      setError("City and state are required.");
      return;
    }
    if (!agreedToTerms) {
      setError("Please agree to the Terms of Use and Privacy Policy.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/therapists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${firstName.trim()} ${lastName.trim()}`,
          practice_name: practiceName.trim() || undefined,
          city: city.trim(),
          state: US_STATES.find((s) => s.abbr === stateAbbr)?.name ?? stateAbbr,
          state_abbr: stateAbbr,
          specialties: selectedSpecialties,
          bio: bio.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          website: website.trim() || undefined,
          credentials: credentials
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
          languages: selectedLanguages,
          telehealth,
          in_person: inPerson,
          sliding_scale: slidingScale,
          individual_session_cost: sessionCost ? parseInt(sessionCost, 10) : undefined,
          modalities: selectedModalities,
          years_in_practice: yearsInPractice ? parseInt(yearsInPractice, 10) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }
      const therapist = await res.json();
      router.push(`/therapist/${therapist.slug}?added=1`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = firstName && lastName && city && stateAbbr && agreedToTerms && !submitting;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-center text-[#151515] mb-1">Add a Therapist</h1>
      <p className="text-center text-gray-500 text-sm mb-10">
        Please search first to make sure this therapist isn&apos;t already listed.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-7">

        {/* ── Location ── */}
        <Section title="Location">
          <div className="grid grid-cols-2 gap-4">
            <Field label="City" required>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Los Angeles" className={inputCls} />
            </Field>
            <Field label="State" required>
              <select value={stateAbbr} onChange={(e) => setStateAbbr(e.target.value)} className={inputCls + " bg-white"}>
                <option value="">Select state</option>
                {US_STATES.map((s) => <option key={s.abbr} value={s.abbr}>{s.name}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        {/* ── Name & contact ── */}
        <Section title="Therapist Info">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" required>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Last Name" required>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Practice / Clinic Name">
            <input type="text" value={practiceName} onChange={(e) => setPracticeName(e.target.value)} placeholder="e.g. Mindful Wellness Center" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone">
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 000-0000" className={inputCls} />
            </Field>
            <Field label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Website">
            <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className={inputCls} />
          </Field>
        </Section>

        {/* ── Credentials ── */}
        <Section title="Credentials & Experience">
          <Field label="Credentials" hint="Comma-separated, e.g. LCSW, PhD, MFT">
            <input type="text" value={credentials} onChange={(e) => setCredentials(e.target.value)} placeholder="LCSW, PhD" className={inputCls} />
          </Field>
          <Field label="Years in Practice">
            <input type="number" min={0} max={60} value={yearsInPractice} onChange={(e) => setYearsInPractice(e.target.value)} placeholder="e.g. 8" className="w-28 border border-gray-300 rounded px-3 py-2.5 text-sm text-[#151515] focus:outline-none focus:border-[#151515]" />
          </Field>
        </Section>

        {/* ── Specialties ── */}
        <Section title="Specialties">
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES.map((s) => (
              <ToggleChip key={s} label={s} active={selectedSpecialties.includes(s)} onToggle={() => toggleItem(selectedSpecialties, setSelectedSpecialties, s)} />
            ))}
          </div>
        </Section>

        {/* ── Modalities ── */}
        <Section title="Therapy Approaches">
          <div className="flex flex-wrap gap-2">
            {MODALITIES.map((m) => (
              <ToggleChip key={m} label={m} active={selectedModalities.includes(m)} onToggle={() => toggleItem(selectedModalities, setSelectedModalities, m)} />
            ))}
          </div>
        </Section>

        {/* ── Languages ── */}
        <Section title="Languages Spoken">
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <ToggleChip key={l} label={l} active={selectedLanguages.includes(l)} onToggle={() => toggleItem(selectedLanguages, setSelectedLanguages, l)} />
            ))}
          </div>
        </Section>

        {/* ── Practical info ── */}
        <Section title="Practical Info">
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" checked={telehealth} onChange={(e) => setTelehealth(e.target.checked)} className="w-4 h-4 rounded border-gray-400" />
              <span className="text-sm text-[#151515]">Offers telehealth / online sessions</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" checked={inPerson} onChange={(e) => setInPerson(e.target.checked)} className="w-4 h-4 rounded border-gray-400" />
              <span className="text-sm text-[#151515]">Offers in-person sessions</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" checked={slidingScale} onChange={(e) => setSlidingScale(e.target.checked)} className="w-4 h-4 rounded border-gray-400" />
              <span className="text-sm text-[#151515]">Offers sliding scale / reduced fees</span>
            </label>
          </div>
          <Field label="Individual Session Fee (USD)" hint="Approximate, leave blank if unknown">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">$</span>
              <input type="number" min={0} max={1000} value={sessionCost} onChange={(e) => setSessionCost(e.target.value)} placeholder="150" className="w-28 border border-gray-300 rounded px-3 py-2.5 text-sm text-[#151515] focus:outline-none focus:border-[#151515]" />
            </div>
          </Field>
        </Section>

        {/* ── Bio ── */}
        <Section title="About (optional)">
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Brief description of the therapist's approach and background..." className={inputCls + " resize-none"} />
        </Section>

        {/* Terms */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-gray-400" />
          <span className="text-sm text-[#151515]">
            I agree to the{" "}
            <a href="#" className="underline font-semibold">Terms of Use</a>{" "}
            and{" "}
            <a href="#" className="underline font-semibold">Privacy Policy</a>
          </span>
        </label>

        {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

        <button type="submit" disabled={!canSubmit} className="bg-[#151515] text-white font-bold py-3 rounded px-6 hover:opacity-80 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm">
          {submitting ? "Adding…" : "Add Therapist"}
        </button>
      </form>
    </div>
  );
}

const inputCls = "w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-[#151515] focus:outline-none focus:border-[#151515]";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4">
      <legend className="text-sm font-black uppercase tracking-widest text-[#151515] px-1">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#151515] mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="text-gray-400 font-normal ml-1">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function ToggleChip({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`text-xs font-semibold border rounded-full px-3 py-1 transition ${
        active
          ? "bg-[#151515] border-[#151515] text-white"
          : "border-gray-300 text-[#151515] hover:border-[#151515]"
      }`}
    >
      {label}
    </button>
  );
}
