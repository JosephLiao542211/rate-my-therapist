import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTherapistBySlug, getAllTherapistSlugs, getSimilarTherapists, getClinicsForTherapist } from "@/lib/therapists";
import { getReviewsByTherapist } from "@/lib/reviews";
import { auth } from "@/lib/auth";
import ReviewCard from "@/components/ReviewCard";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllTherapistSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const therapist = await getTherapistBySlug(slug);
  if (!therapist) return { title: "Therapist Not Found" };
  const location = [therapist.city, therapist.state_abbr].filter(Boolean).join(", ");
  const specialty = therapist.specialties[0] ?? "Therapist";
  return {
    title: `${therapist.name} Reviews`,
    description: `Read ${therapist.review_count} reviews of ${therapist.name}, a ${specialty} therapist in ${location}. Average rating: ${therapist.avg_rating}/5.`,
  };
}

function ratingLabel(star: number) {
  return ["", "Awful", "OK", "Good", "Great", "Awesome"][star];
}

function ratingBarColor(star: number) {
  if (star >= 4) return "bg-[#41F9C0]";
  if (star === 3) return "bg-[#FFF155]";
  return "bg-[#FF969A]";
}

function bigRatingColor(rating: number) {
  if (rating >= 4) return "text-[#41F9C0]";
  if (rating >= 3) return "text-[#FFF155]";
  return "text-[#FF969A]";
}

export default async function TherapistPage({ params }: Props) {
  const { slug } = await params;
  const [therapist, session] = await Promise.all([
    getTherapistBySlug(slug),
    auth(),
  ]);
  if (!therapist) notFound();

  const [reviews, similar, clinics] = await Promise.all([
    getReviewsByTherapist(therapist.id),
    getSimilarTherapists(therapist.id, therapist.specialties, therapist.state_abbr),
    getClinicsForTherapist(therapist.id),
  ]);

  // Rating distribution
  const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of reviews) dist[r.rating] = (dist[r.rating] ?? 0) + 1;
  const maxCount = Math.max(...Object.values(dist), 1);

  // % would recommend
  const withRecommend = reviews.filter((r) => r.would_recommend !== null);
  const pctRecommend =
    withRecommend.length > 0
      ? Math.round((withRecommend.filter((r) => r.would_recommend).length / withRecommend.length) * 100)
      : null;

  // avg sessions
  const withSessions = reviews.filter((r) => r.num_sessions != null);
  const avgSessions =
    withSessions.length > 0
      ? (withSessions.reduce((s, r) => s + (r.num_sessions ?? 0), 0) / withSessions.length).toFixed(1)
      : null;

  const location = [therapist.city, therapist.state_abbr].filter(Boolean).join(", ");

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: therapist.name,
    address: {
      "@type": "PostalAddress",
      addressLocality: therapist.city,
      addressRegion: therapist.state_abbr,
      addressCountry: "US",
    },
    ...(therapist.review_count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: therapist.avg_rating,
        reviewCount: therapist.review_count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT — profile */}
          <div className="lg:w-[380px] shrink-0">
            {/* Big rating number */}
            <div className="mb-2">
              <div className="flex items-baseline gap-1">
                <span className={`text-7xl font-black leading-none ${therapist.review_count > 0 ? bigRatingColor(Number(therapist.avg_rating)) : "text-gray-300"}`}>
                  {therapist.review_count > 0 ? Number(therapist.avg_rating).toFixed(1) : "—"}
                </span>
                <span className="text-2xl font-bold text-gray-400">/ 5</span>
              </div>
              <p className="text-sm font-semibold text-[#151515] mt-1">
                Overall Quality Based on{" "}
                <span className="underline">{therapist.review_count} ratings</span>
              </p>
            </div>

            {/* Name */}
            <div className="flex items-start gap-2 mt-4 mb-1">
              <h1 className="text-4xl font-black text-[#151515] leading-tight">{therapist.name}</h1>
              {/* bookmark icon */}
              <svg className="w-5 h-5 mt-2 shrink-0 text-gray-400 hover:text-gray-700 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>

            {/* Info */}
            <p className="text-sm text-[#151515] mb-5">
              {therapist.specialties.length > 0 && (
                <>Therapist specializing in{" "}
                  <strong>{therapist.specialties[0]}</strong>
                  {location && <> in <strong>{location}</strong></>}
                </>
              )}
              {therapist.specialties.length === 0 && location && (
                <>Therapist in <strong>{location}</strong></>
              )}
            </p>

            {/* Stats row */}
            {(pctRecommend !== null || avgSessions !== null) && (
              <div className="flex items-center gap-6 mb-6">
                {pctRecommend !== null && (
                  <div>
                    <p className="text-3xl font-black text-[#151515]">{pctRecommend}%</p>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5">Would Recommend</p>
                  </div>
                )}
                {pctRecommend !== null && avgSessions !== null && (
                  <div className="w-px h-12 bg-gray-300" />
                )}
                {avgSessions !== null && (
                  <div>
                    <p className="text-3xl font-black text-[#151515]">{avgSessions}</p>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5">Avg Sessions</p>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mb-6">
              <Link
                href={`/therapist/${slug}/review`}
                className="flex items-center gap-2 bg-[#151515] text-white font-bold text-sm px-6 py-3 rounded-full hover:opacity-80 transition"
              >
                Rate <span>→</span>
              </Link>
              <button className="border-2 border-[#151515] text-[#151515] font-bold text-sm px-6 py-3 rounded-full hover:bg-[#151515] hover:text-white transition">
                Compare
              </button>
            </div>

            <p className="text-sm font-semibold underline underline-offset-2 cursor-pointer hover:opacity-70 transition">
              I&apos;m {therapist.name.split(" ")[0]}
            </p>

            {/* Credentials / quick facts */}
            {(therapist.credentials?.length > 0 || therapist.health_role || therapist.years_in_practice) && (
              <div className="mt-5 border-t border-gray-200 pt-5 flex flex-col gap-2">
                {therapist.credentials?.length > 0 && (
                  <p className="text-sm text-[#151515]">
                    <span className="font-bold">Credentials:</span>{" "}
                    {therapist.credentials.join(", ")}
                  </p>
                )}
                {therapist.years_in_practice && (
                  <p className="text-sm text-[#151515]">
                    <span className="font-bold">Years in Practice:</span>{" "}
                    {therapist.years_in_practice}
                  </p>
                )}
                {therapist.individual_session_cost && (
                  <p className="text-sm text-[#151515]">
                    <span className="font-bold">Session Fee:</span>{" "}
                    ${therapist.individual_session_cost}
                    {therapist.sliding_scale && " (sliding scale available)"}
                  </p>
                )}
                {therapist.telehealth && (
                  <p className="text-sm text-[#151515]">✓ Offers Telehealth / Online Sessions</p>
                )}
              </div>
            )}

            {/* Contact */}
            {(therapist.phone || therapist.email || therapist.website) && (
              <div className="mt-4 border-t border-gray-200 pt-4 flex flex-col gap-1.5">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Contact</p>
                {therapist.phone && (
                  <a href={`tel:${therapist.phone}`} className="text-sm font-semibold hover:underline">
                    📞 {therapist.phone}
                  </a>
                )}
                {therapist.email && (
                  <a href={`mailto:${therapist.email}`} className="text-sm font-semibold hover:underline truncate">
                    ✉️ {therapist.email}
                  </a>
                )}
                {therapist.website && (
                  <a href={therapist.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold hover:underline truncate">
                    🌐 Website
                  </a>
                )}
              </div>
            )}

            {/* Clinic locations */}
            {clinics.length > 0 && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Location{clinics.length > 1 ? "s" : ""}</p>
                {clinics.map((c) => (
                  <div key={c.id} className="text-sm text-[#151515] mb-2">
                    {c.name && <p className="font-semibold">{c.name}</p>}
                    {c.address_line && <p>{c.address_line}</p>}
                    <p>{[c.city, c.state_abbr, c.postal_code].filter(Boolean).join(", ")}</p>
                    {c.phone && <p className="text-gray-500">{c.phone}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Languages */}
            {therapist.languages?.length > 0 && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Languages</p>
                <div className="flex flex-wrap gap-1.5">
                  {therapist.languages.map((l) => (
                    <span key={l} className="text-xs border border-gray-300 rounded-full px-2 py-0.5 text-[#151515]">{l}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Bio snippet */}
            {therapist.bio && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">About</p>
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-5">{therapist.bio}</p>
              </div>
            )}
          </div>

          {/* RIGHT — distribution + similar */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Rating Distribution */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="font-black text-[#151515] text-lg mb-4">Rating Distribution</h2>
              <div className="flex flex-col gap-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = dist[star] ?? 0;
                  const pct = (count / maxCount) * 100;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 w-20 text-right shrink-0">
                        {ratingLabel(star)} <strong>{star}</strong>
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-sm h-6 overflow-hidden">
                        <div
                          className={`h-full ${ratingBarColor(star)} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-[#151515] w-6 shrink-0">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Similar Therapists */}
            {similar.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
                <h2 className="font-black text-[#151515] text-base mb-4">Similar Therapists</h2>
                <div className="flex flex-wrap gap-3">
                  {similar.map((t) => (
                    <Link
                      key={t.id}
                      href={`/therapist/${t.slug}`}
                      className="flex items-center gap-2 hover:opacity-80 transition"
                    >
                      <span className={`text-xs font-black px-2 py-1 ${Number(t.avg_rating) >= 4 ? "bg-[#41F9C0]" : Number(t.avg_rating) >= 3 ? "bg-[#FFF155]" : "bg-[#FF969A]"} text-[#151515]`}>
                        {Number(t.avg_rating).toFixed(2)}
                      </span>
                      <span className="text-sm font-semibold text-[#151515]">{t.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Issues / Modalities / Insurance row */}
        {(therapist.issues?.length > 0 || therapist.modalities?.length > 0 || therapist.insurance_accepted?.length > 0) && (
          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            {therapist.issues?.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Specializes In</p>
                <div className="flex flex-wrap gap-1">
                  {therapist.issues.map((s) => (
                    <span key={s} className="text-xs border border-gray-200 rounded-full px-2 py-0.5 text-[#151515]">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {therapist.modalities?.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Therapy Approaches</p>
                <div className="flex flex-wrap gap-1">
                  {therapist.modalities.map((m) => (
                    <span key={m} className="text-xs border border-gray-200 rounded-full px-2 py-0.5 text-[#151515]">{m}</span>
                  ))}
                </div>
              </div>
            )}
            {therapist.insurance_accepted?.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Insurance Accepted</p>
                <div className="flex flex-wrap gap-1">
                  {therapist.insurance_accepted.map((i) => (
                    <span key={i} className="text-xs border border-gray-200 rounded-full px-2 py-0.5 text-[#151515]">{i}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reviews section */}
        <div className="mt-10 border-t-2 border-[#151515] pt-8">
          <h2 className="text-lg font-black text-[#151515] border-b-4 border-[#151515] inline-block pb-1 mb-6">
            {therapist.review_count} {therapist.review_count === 1 ? "Therapist Rating" : "Therapist Ratings"}
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="font-bold text-lg text-gray-500">No ratings yet.</p>
              <p className="text-sm text-gray-400 mt-1 mb-6">Be the first to rate {therapist.name}.</p>
              <Link
                href={`/therapist/${slug}/review`}
                className="bg-[#151515] text-white font-bold text-sm px-8 py-3 rounded-full hover:opacity-80 transition"
              >
                Rate
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  userId={session?.user?.id ?? null}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
