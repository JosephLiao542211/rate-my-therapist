import { getPendingTherapists } from "@/lib/therapists";
import { approveTherapistAction, rejectTherapistAction } from "@/app/admin/actions";

export default async function AdminTherapistsPage() {
  const pending = await getPendingTherapists();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">Therapist Approvals</h1>
        <p className="text-sm text-gray-500">
          {pending.length} therapist{pending.length === 1 ? "" : "s"} awaiting review.
        </p>
      </div>

      {pending.length === 0 ? (
        <p className="text-sm text-gray-400 bg-white border border-gray-200 rounded-lg p-8 text-center">
          Nothing pending. New submissions from &ldquo;Add a Therapist&rdquo; will show up here.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((t) => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-bold">{t.name}</p>
                <p className="text-sm text-gray-500">
                  {t.practice_name && <>{t.practice_name} · </>}
                  {t.city}, {t.state_abbr}
                </p>
                {t.credentials?.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{t.credentials.join(", ")}</p>
                )}
                {t.specialties?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {t.specialties.slice(0, 6).map((s) => (
                      <span key={s} className="text-xs bg-gray-100 rounded-full px-2 py-0.5 text-gray-600">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {t.bio && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{t.bio}</p>}
                <p className="text-xs text-gray-400 mt-2">
                  {t.email && <>{t.email} · </>}
                  {t.phone && <>{t.phone} · </>}
                  Submitted {new Date(t.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <form action={approveTherapistAction.bind(null, t.id)}>
                  <button className="bg-[#151515] text-white text-xs font-bold px-3 py-2 rounded hover:opacity-80 transition">
                    Approve
                  </button>
                </form>
                <form action={rejectTherapistAction.bind(null, t.id)}>
                  <button className="border border-gray-300 text-gray-600 text-xs font-bold px-3 py-2 rounded hover:border-red-400 hover:text-red-600 transition">
                    Reject
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
