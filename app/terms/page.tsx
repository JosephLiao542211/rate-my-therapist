import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms that govern your use of Rate My Therapist.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14 text-[#151515]">
      <h1 className="text-3xl font-black mb-2">Terms &amp; Conditions</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: July 3, 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Rate My Therapist (&ldquo;RMT&rdquo;), you agree to be bound by these Terms
            &amp; Conditions. If you do not agree, please do not use the site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">2. Nature of the Service</h2>
          <p>
            RMT is a directory of therapist listings and user-submitted reviews. RMT does not provide medical,
            psychological, or mental health advice, and does not verify the credentials, licensing, or fitness of
            any therapist listed. Listings and reviews reflect the opinions of contributors, not RMT.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">3. User Accounts</h2>
          <p>
            You may sign in using a Google account to submit reviews or vote on content. You are responsible for
            maintaining the confidentiality of your account and for all activity under it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">4. User-Submitted Content</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You must only submit reviews based on genuine, firsthand experience.</li>
            <li>Content must not be defamatory, harassing, hateful, or knowingly false.</li>
            <li>Content must not include another person&apos;s private medical or contact information.</li>
            <li>
              By submitting content, you grant RMT a non-exclusive, worldwide, royalty-free license to display,
              distribute, and moderate that content on the site.
            </li>
            <li>
              We reserve the right to remove any content, at our discretion, that violates these terms or our{" "}
              <a href="/guidelines" className="underline hover:text-[#151515]">Site Guidelines</a>.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">5. Prohibited Conduct</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Posting fake reviews, or reviews on behalf of a therapist about themselves.</li>
            <li>Attempting to manipulate ratings through repeated or automated submissions.</li>
            <li>Scraping, reverse-engineering, or interfering with the operation of the site.</li>
            <li>Using the site for any unlawful purpose.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">6. No Professional Relationship</h2>
          <p>
            Nothing on RMT creates a therapist-client, medical, or professional relationship between you and RMT.
            If you are in crisis, contact your local emergency services or a crisis hotline immediately.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">7. Disclaimer of Warranties</h2>
          <p>
            RMT is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee the accuracy,
            completeness, or reliability of any listing or review.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">8. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, RMT and its operators are not liable for any damages arising
            from your use of the site, including decisions made based on listings or reviews found here.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">9. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the site after changes are posted
            constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">10. Contact</h2>
          <p>
            Questions about these Terms? Reach out through our{" "}
            <a href="/feedback" className="underline hover:text-[#151515]">Help/Feedback</a> page.
          </p>
        </section>
      </div>
    </div>
  );
}
