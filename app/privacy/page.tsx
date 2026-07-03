import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Rate My Therapist collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14 text-[#151515]">
      <h1 className="text-3xl font-black mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: July 3, 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">1. Overview</h2>
          <p>
            Rate My Therapist (&ldquo;RMT&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a directory of
            therapists and counselors and lets visitors read and submit reviews. This policy explains what
            information we collect, how we use it, and the choices you have.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">2. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Account information:</strong> when you sign in with Google, we receive your name, email
              address, and profile picture from your Google account.
            </li>
            <li>
              <strong>Content you submit:</strong> reviews, ratings, therapist listings, and any text you
              provide through our forms.
            </li>
            <li>
              <strong>Location information:</strong> with your browser&apos;s permission, we use approximate
              geolocation to suggest therapists near you. You can decline this and search by location manually.
            </li>
            <li>
              <strong>Usage data:</strong> pages visited, device/browser type, and referring pages, collected via
              analytics tools (Vercel Analytics, Vercel Speed Insights).
            </li>
            <li>
              <strong>Cookies:</strong> we use a small number of cookies to keep you signed in and to remember
              your selected location.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">3. How We Use Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To operate and improve the site, including displaying reviews and therapist listings.</li>
            <li>To authenticate you and associate reviews or votes with your account.</li>
            <li>To detect abuse, spam, and fraudulent reviews.</li>
            <li>To show relevant advertising through Google AdSense (see Section 5).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">4. Sharing of Information</h2>
          <p>
            We do not sell your personal information. We share data only with service providers that help us run
            the site (e.g. hosting, authentication, analytics, and advertising providers), and only as needed for
            them to perform their services, or where required by law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">5. Advertising &amp; Third-Party Services</h2>
          <p>
            We use Google AdSense to display ads. Google and its partners may use cookies and similar
            technologies to serve ads based on your prior visits to this and other websites. You can opt out of
            personalized advertising by visiting{" "}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[#151515]"
            >
              Google Ads Settings
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">6. Your Choices</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You can decline location access in your browser; the site still works without it.</li>
            <li>You can sign out at any time from the account menu.</li>
            <li>
              You can request deletion of your account data by contacting us via the{" "}
              <a href="/add-therapist" className="underline hover:text-[#151515]">Help</a> page.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">7. Children&apos;s Privacy</h2>
          <p>
            RMT is not directed at children under 13, and we do not knowingly collect personal information from
            children under 13.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Material changes will be reflected by updating
            the &ldquo;Last updated&rdquo; date above.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#151515] mb-2">9. Contact</h2>
          <p>
            Questions about this policy? Reach out through our{" "}
            <a href="/add-therapist" className="underline hover:text-[#151515]">Help</a> page.
          </p>
        </section>
      </div>
    </div>
  );
}
