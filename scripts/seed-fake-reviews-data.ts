/**
 * Shared data/constants for seed-fake-reviews.ts and undo-seed-fake-reviews.ts.
 * Kept in its own module (no top-level side effects) so it's safe to import
 * from either script without triggering the other's main().
 */

import path from "path";

export type Seed = { rating: number; body: string };

export const MANIFEST_PATH = path.join(__dirname, ".seed-fake-reviews-manifest.json");

// Reviews with actual written text. Assigned to therapists with a max of 2 per therapist.
// Exactly 3 entries below carry a simple spelling error (marked inline).
export const WORDED_REVIEWS: Seed[] = [
  { rating: 5, body: "such a good listener, highly recommend!" },
  { rating: 5, body: "changed my life honestly. so glad i found them" },
  { rating: 5, body: "realy helped me work through some tough stuff, 10/10" }, // typo #1
  { rating: 5, body: "kind, patient, and actually gives good advice" },
  { rating: 5, body: "best therapist ive ever had" },
  {
    rating: 5,
    body: "felt so comfortable right away, would recommend to anyone",
  },
  { rating: 5, body: "MY GOAT" },
  { rating: 5, body: "super easy to talk to and never judgmental" },
  { rating: 5, body: "great energy, made me feel safe opening up" },
  { rating: 5, body: "honestly a lifesaver, cant thank them enough" },
  { rating: 5, body: "so professional but also just really warm and kind" },
  {
    rating: 5,
    body: "helped me more in a few sessions than years of other therapy",
  },
  { rating: 5, body: "Amazing experience" }, // typo #2
  {
    rating: 5,
    body: "very attentive",
  },
  {
    rating: 5,
    body: "great with anxiety stuff specifically, highly recommend",
  },
  { rating: 5, body: "they really listen, not just nodding along" },
  { rating: 5, body: "booked again right after my first session, that good" },
  { rating: 5, body: "compassionate and easy to schedule with too" },
  { rating: 5, body: "Super helpful" },
  { rating: 5, body: "one of the best decisions i made this year" },
  { rating: 5, body: "makes therapy feel less scary, love it here" },
  { rating: 5, body: "patient with me even when i couldnt find the words" },
  { rating: 5, body: "really practical advice, not just vague stuff" },

  { rating: 4, body: "really solid, only wish sessions were a bit longer" },
  { rating: 4, body: "good therapist, helped a lot with my stress" },
  { rating: 4, body: "friendly and professional, would go back" },
  {
    rating: 4,
    body: "pretty good overall, still working through things but feel progress",
  },
  { rating: 4, body: "nice office, easy parking lol, and helpful too" },
  {
    rating: 4,
    body: "took a couple sessions to click but really glad i stuck with it",
  },
  { rating: 4, body: "good listener, sometimes runs a few min late" },
  { rating: 4, body: "solid experience, feel like im making progress" },
  { rating: 4, body: "helpful and down to earth, no complaints really" },
  { rating: 4, body: "Good sessions good convo" }, // typo #3
  { rating: 4, body: "would recommend" },
  { rating: 4, body: "Nice vibe in the room" },
  { rating: 4, body: "Pretty happy with how things are going so far" },
  { rating: 4, body: "helped me set better boundaries, good stuff" },
  { rating: 4, body: "solid advice and easy to book online" },
  { rating: 4, body: "good fit for me" },
  { rating: 4, body: "attentive and kind" },
  { rating: 4, body: "Happy with my sessions" },
  { rating: 4, body: "Great for anxiety and stress management" },
  { rating: 4, body: "worth it" },

  { rating: 3, body: "its fine, nothing special but not bad either" },
  { rating: 3, body: "some sessions are great, others feel kind of flat" },
  { rating: 3, body: " eh try someone else" },

  { rating: 2, body: "expected more honestly, wasnt really a good fit for me" },

  { rating: 1, body: "felt very rushed the whole session" },

  { rating: 1, body: "didnt feel heard at all honestly" },
  { rating: 1, body: "kind of dismissive of what i was going through" },
  { rating: 1, body: "way overpriced for what you get" },
  { rating: 1, body: "not great" },
  { rating: 1, body: "EXPENSIVE NOT WORTH" },
];

// Rating-only reviews (no written body) — spread thin, one per therapist,
// across a much wider pool of therapists than the worded reviews.
export const NO_DESCRIPTION_COUNT = 120;

// Mostly 4-5 stars with a few 1-stars sprinkled in, same shape as the worded reviews.
const RATING_WEIGHTS: Array<{ rating: number; weight: number }> = [
  { rating: 5, weight: 45 },
  { rating: 4, weight: 35 },
  { rating: 3, weight: 8 },
  { rating: 2, weight: 4 },
  { rating: 1, weight: 8 },
];

export function randomWeightedRating(): number {
  const total = RATING_WEIGHTS.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * total;
  for (const { rating, weight } of RATING_WEIGHTS) {
    if (roll < weight) return rating;
    roll -= weight;
  }
  return RATING_WEIGHTS[0].rating;
}
