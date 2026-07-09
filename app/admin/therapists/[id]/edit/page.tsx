import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistById } from "@/lib/therapists";
import { US_STATES } from "@/lib/constants";
import { updateTherapistAction, archiveTherapistAction, restoreTherapistAction } from "@/app/admin/actions";
import ConfirmButton from "@/components/ConfirmButton";

export default async function EditTherapistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTherapistById(id);
  if (!t) notFound();

  const action = updateTherapistAction.bind(null, t.id);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Edit Therapist</h1>
          <p className="text-sm text-gray-500">
            {t.slug} ·{" "}
            <Link href={`/therapist/${t.slug}`} className="underline hover:text-[#151515]" target="_blank">
              View public page
            </Link>
          </p>
        </div>
        <Link href="/admin/therapists" className="text-sm font-semibold text-gray-500 hover:text-[#151515]">
          ← Back to directory
        </Link>
      </div>

      {t.status === "archived" && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800">
            This therapist is archived and hidden from the public site.
            {t.archived_at && <> Archived {new Date(t.archived_at).toLocaleDateString()}.</>}
          </p>
          <form action={restoreTherapistAction.bind(null, t.id)}>
            <button className="bg-[#151515] text-white text-xs font-bold px-3 py-2 rounded hover:opacity-80 transition shrink-0">
              Restore
            </button>
          </form>
        </div>
      )}

      <form action={action} className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name" name="name" defaultValue={t.name} required />
          <Field label="Practice name" name="practice_name" defaultValue={t.practice_name ?? ""} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="City" name="city" defaultValue={t.city ?? ""} />
          <Field label="State (full name)" name="state" defaultValue={t.state ?? ""} />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">State abbr.</label>
            <select
              name="state_abbr"
              defaultValue={t.state_abbr ?? ""}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {US_STATES.map((s) => (
                <option key={s.abbr} value={s.abbr}>
                  {s.abbr}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Phone" name="phone" defaultValue={t.phone ?? ""} />
          <Field label="Email" name="email" defaultValue={t.email ?? ""} type="email" />
          <Field label="Website" name="website" defaultValue={t.website ?? ""} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Bio</label>
          <textarea
            name="bio"
            defaultValue={t.bio ?? ""}
            rows={4}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Specialties (comma-separated)" name="specialties" defaultValue={t.specialties?.join(", ") ?? ""} />
          <Field label="Credentials (comma-separated)" name="credentials" defaultValue={t.credentials?.join(", ") ?? ""} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Modalities (comma-separated)" name="modalities" defaultValue={t.modalities?.join(", ") ?? ""} />
          <Field label="Issues treated (comma-separated)" name="issues" defaultValue={t.issues?.join(", ") ?? ""} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Languages (comma-separated)" name="languages" defaultValue={t.languages?.join(", ") ?? ""} />
          <Field
            label="Insurance accepted (comma-separated)"
            name="insurance_accepted"
            defaultValue={t.insurance_accepted?.join(", ") ?? ""}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Individual session cost ($)"
            name="individual_session_cost"
            defaultValue={t.individual_session_cost?.toString() ?? ""}
            type="number"
          />
          <Field
            label="Years in practice"
            name="years_in_practice"
            defaultValue={t.years_in_practice?.toString() ?? ""}
            type="number"
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <Checkbox label="Telehealth" name="telehealth" defaultChecked={t.telehealth} />
          <Checkbox label="In-person" name="in_person" defaultChecked={t.in_person} />
          <Checkbox label="Accepting clients" name="accepting_clients" defaultChecked={t.accepting_clients} />
          <Checkbox label="Sliding scale" name="sliding_scale" defaultChecked={t.sliding_scale ?? false} />
        </div>

        <div className="flex gap-3 pt-2">
          <button className="bg-[#151515] text-white text-sm font-bold px-5 py-2.5 rounded hover:opacity-80 transition">
            Save changes
          </button>
          <Link
            href="/admin/therapists"
            className="border border-gray-300 text-gray-600 text-sm font-bold px-5 py-2.5 rounded hover:border-gray-400 transition"
          >
            Cancel
          </Link>
        </div>
      </form>

      {t.status !== "archived" && (
        <form action={archiveTherapistAction.bind(null, t.id)} className="self-start">
          <ConfirmButton
            message={`Archive ${t.name}? Their profile and ${t.review_count} review${t.review_count === 1 ? "" : "s"} will be hidden from the site. You can restore them later from the Archived view.`}
            className="text-sm font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded transition"
          >
            Delete this therapist
          </ConfirmButton>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="border border-gray-300 rounded px-3 py-2 text-sm"
      />
    </div>
  );
}

function Checkbox({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="w-4 h-4" />
      {label}
    </label>
  );
}
