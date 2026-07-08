export interface HelpArticle {
  slug: string;
  title: string;
  category: string;
  summary: string;
  body: string[]; // paragraphs / list blocks rendered in order; markdown-lite (bold via **text**, lists via "- ")
}

export interface HelpCategory {
  slug: string;
  name: string;
  description: string;
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    slug: "getting-started",
    name: "Getting Started",
    description: "Creating an account, searching, and finding the right therapist.",
  },
  {
    slug: "reviews",
    name: "Writing & Managing Reviews",
    description: "How reviews work, editing, deleting, and voting.",
  },
  {
    slug: "for-therapists",
    name: "For Therapists & Clinics",
    description: "Claiming a listing, responding to reviews, and negative reviews.",
  },
  {
    slug: "privacy-safety",
    name: "Privacy & Safety",
    description: "Anonymity, moderation, and reporting content.",
  },
  {
    slug: "account",
    name: "Account & Billing",
    description: "Sign-in, notifications, and account deletion.",
  },
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "how-do-i-find-a-therapist",
    title: "How do I find a therapist on Rate My Therapist?",
    category: "getting-started",
    summary: "Search by name, city, state, or specialty to browse rated therapists near you.",
    body: [
      "Use the search bar on the homepage to look up a therapist by name, or search by city, state, or specialty (like Anxiety, CBT, or Couples Therapy).",
      "You can also browse by location or specialty using the links in our directory pages, or use one of our free tools like the Therapist Match Quiz to get personalized suggestions.",
      "Every listing shows an average rating, review count, specialties, and location so you can compare therapists before reaching out.",
    ],
  },
  {
    slug: "do-i-need-an-account-to-search",
    title: "Do I need an account to search or read reviews?",
    category: "getting-started",
    summary: "No — searching and reading reviews is free and open to everyone.",
    body: [
      "No account is required to search for therapists or read reviews. You only need to sign in with Google if you want to write a review, vote a review helpful, or submit a new therapist listing.",
    ],
  },
  {
    slug: "is-rate-my-therapist-free",
    title: "Is Rate My Therapist free to use?",
    category: "getting-started",
    summary: "Yes, searching, reading, and writing reviews is completely free.",
    body: [
      "Rate My Therapist is free for everyone. We don't charge users or therapists to be listed or reviewed. The site is supported by advertising.",
    ],
  },
  {
    slug: "how-do-i-write-a-review",
    title: "How do I write a review?",
    category: "reviews",
    summary: "Visit a therapist's page, sign in with Google, and share your firsthand experience.",
    body: [
      "Go to the therapist's profile page and click **Write a Review**. You'll need to sign in with Google first.",
      "Rate your overall experience, and let us know whether you'd recommend them, whether you felt heard, and whether they helped with your goals. Add specific, constructive details about your sessions — this helps other people the most.",
      "Reviews should only be based on your own, genuine experience as a client. See our [Site Guidelines](/guidelines) for what's allowed.",
    ],
  },
  {
    slug: "can-i-edit-or-delete-my-review",
    title: "Can I edit or delete my review?",
    category: "reviews",
    summary: "Yes, from your account you can update or remove any review you've written.",
    body: [
      "Yes. Sign in and go to your profile menu to see the reviews you've written. From there you can edit the text or rating, or delete the review entirely.",
      "If you deleted your account, contact us via the [Feedback](/feedback) page and we can remove your content on request.",
    ],
  },
  {
    slug: "are-reviews-anonymous",
    title: "Are my reviews anonymous?",
    category: "privacy-safety",
    summary: "Your display name is shown, but your email and account details stay private.",
    body: [
      "Reviews are published with the display name from your Google account (or a name you choose), but your email address and other account details are never shown publicly.",
      "We don't publish any information about your therapy — like diagnoses or session notes — unless you choose to include it in your review text, which we recommend avoiding for your own privacy.",
    ],
  },
  {
    slug: "how-is-the-rating-calculated",
    title: "How is a therapist's overall rating calculated?",
    category: "reviews",
    summary: "The average rating is the mean of all star ratings left on a therapist's profile.",
    body: [
      "A therapist's overall rating is the average of every star rating (1–5) submitted in a review on their profile. The number updates automatically as new reviews come in or existing ones are edited or removed.",
      "We don't weight, hide, or curate ratings — every published review counts equally toward the average.",
    ],
  },
  {
    slug: "how-do-i-report-a-review",
    title: "How do I report a review that violates the guidelines?",
    category: "privacy-safety",
    summary: "Use the report/feedback flow to flag reviews for our moderation team.",
    body: [
      "If you see a review that looks fake, abusive, or that shares private information about a third party, let us know via the [Feedback](/feedback) page with a link to the review. Include why you believe it violates our [Site Guidelines](/guidelines).",
      "Our team reviews reports and removes content that violates our guidelines or [Terms & Conditions](/terms).",
    ],
  },
  {
    slug: "how-do-i-add-a-therapist",
    title: "How do I add a therapist who isn't listed yet?",
    category: "getting-started",
    summary: "Use the Add a Therapist form — submissions are reviewed before they go live.",
    body: [
      "Click **Add a Therapist** in the footer or navigation and fill out the form with their name, location, and specialties.",
      "New submissions are reviewed by our team before they appear publicly, to keep listings for real, practicing therapists. This usually takes a short time.",
    ],
  },
  {
    slug: "therapist-negative-reviews",
    title: "I'm a therapist and I received a negative review. What can I do?",
    category: "for-therapists",
    summary:
      "Negative reviews generally stay up unless they violate our guidelines — here's what you can do about one.",
    body: [
      "We understand that a negative review can be frustrating, especially in a field built on trust. However, Rate My Therapist exists to give clients an honest, unfiltered space to share their experience, so we don't remove reviews simply because they are negative or because you disagree with them.",
      "**When we will remove a review:**",
      "- It violates our [Site Guidelines](/guidelines) — for example, it's fake, was not written by an actual client, contains hate speech or threats, or discloses another person's private medical information.",
      "- It was posted by a competitor, a former employee, or anyone without a genuine client relationship with you.",
      "- It's a duplicate of a review already posted about the same experience.",
      "**When we will not remove a review:**",
      "- The review is a fair, honest account of someone's experience — even if it's critical of your communication style, availability, or fit.",
      "- You simply disagree with the client's opinion or rating.",
      "**What you can do:**",
      "- Report the review via [Feedback](/feedback) with the specific guideline you believe it violates, and we'll investigate.",
      "- Focus on building a strong base of honest reviews over time — a large volume of genuine, recent reviews naturally outweighs the impact of any single negative one.",
      "- Encourage past clients who had a positive experience to leave an honest review; we don't allow incentivized or solicited-in-bulk reviews, but organically inviting satisfied clients to share their experience is fine.",
      "Remember that RMT does not verify the therapeutic outcome or professional conduct behind any review — we only enforce whether the content follows our posting rules.",
    ],
  },
  {
    slug: "can-therapists-respond-to-reviews",
    title: "Can therapists respond to reviews about them?",
    category: "for-therapists",
    summary: "Public responses aren't supported yet — use Feedback for a factual correction.",
    body: [
      "We don't currently support public responses to individual reviews. If a review contains factual inaccuracies (for example, the wrong location or an experience that clearly doesn't match your practice), reach out via [Feedback](/feedback) with details and we'll take a look.",
    ],
  },
  {
    slug: "how-do-i-claim-my-listing",
    title: "How do I claim or update my professional listing?",
    category: "for-therapists",
    summary: "Contact us via Feedback to verify and update your practice details.",
    body: [
      "If you're a therapist and want to update your listed specialties, location, or other details, contact us via [Feedback](/feedback). Include your name and practice so we can verify the request before making changes, since listings reflect information used by prospective clients.",
    ],
  },
  {
    slug: "how-do-i-sign-in",
    title: "How do I sign in or create an account?",
    category: "account",
    summary: "We use Google Sign-In — no separate password to create or remember.",
    body: [
      "Click **Sign In** and continue with your Google account. We use this only to authenticate you and to attach your name to content you submit — we never post to Google or access anything outside your basic profile (name, email, photo).",
    ],
  },
  {
    slug: "how-do-i-delete-my-account",
    title: "How do I delete my account and data?",
    category: "account",
    summary: "Reach out via Feedback and we'll remove your account and content.",
    body: [
      "To delete your account, send a request through [Feedback](/feedback). We'll delete your account and, on request, remove reviews tied to it. See our [Privacy Policy](/privacy) for more on how we handle your data.",
    ],
  },
  {
    slug: "is-rmt-a-crisis-service",
    title: "Is Rate My Therapist a crisis or emergency service?",
    category: "privacy-safety",
    summary: "No. RMT is a review directory only — not a substitute for emergency care.",
    body: [
      "No. Rate My Therapist is a directory of therapist listings and reviews, not a crisis service, and nothing on the site creates a therapist-client relationship. If you or someone else is in immediate danger, contact your local emergency number or a crisis hotline right away.",
    ],
  },
];

export function getArticlesByCategory(categorySlug: string): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.category === categorySlug);
}

export function getArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}

export function getCategoryBySlug(slug: string): HelpCategory | undefined {
  return HELP_CATEGORIES.find((c) => c.slug === slug);
}
