// Customer reviews — client-side data access for the homepage bubble field.
// Reads the public, APPROVED-only feed from the KV-backed Pages Function.

export interface Review {
  id: string;
  rating: number; // 1–5
  name: string;
  text: string;
  date: string; // ISO
}

export const REVIEWS_ENDPOINT = "/api/reviews";

/** Fetch approved reviews (newest first). Throws on network/HTTP error. */
export async function fetchApprovedReviews(signal?: AbortSignal): Promise<Review[]> {
  const res = await fetch(REVIEWS_ENDPOINT, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`reviews fetch failed: ${res.status}`);
  const json = (await res.json()) as { reviews?: Review[] };
  const list = Array.isArray(json.reviews) ? json.reviews : [];
  // Trust-but-verify the shape; drop anything malformed.
  return list.filter(
    (r) =>
      r &&
      typeof r.id === "string" &&
      typeof r.name === "string" &&
      typeof r.text === "string" &&
      typeof r.rating === "number",
  );
}

/**
 * DEV-ONLY sample reviews — CLEARLY marked and gated behind `import.meta.env.DEV`
 * so Vite tree-shakes them out of the production bundle. They exist purely to
 * demo the floating-bubble animation before any real reviews are approved, and
 * must NEVER be presented as genuine customer reviews on the live site.
 */
export const SAMPLE_REVIEWS: Review[] = [
  { id: "sample-1", rating: 5, name: "Sample · Dana R.", text: "The nutcracker print came out crisp — layer lines barely visible and the paint detail is gorgeous. Shipped faster than expected.", date: "2026-09-28T14:00:00.000Z" },
  { id: "sample-2", rating: 5, name: "Sample · Marcus T.", text: "Asked for a custom desk nameplate and it was perfect on the first try. Great communication throughout.", date: "2026-09-25T10:30:00.000Z" },
  { id: "sample-3", rating: 4, name: "Sample · Priya N.", text: "Lovely little cardinal ornament. Packaging was solid, arrived without a scratch. Would order again for the holidays.", date: "2026-09-21T18:45:00.000Z" },
  { id: "sample-4", rating: 5, name: "Sample · Jordan", text: "Quality is a cut above the usual Etsy prints. The snowflake coaster set feels premium.", date: "2026-09-18T09:15:00.000Z" },
  { id: "sample-5", rating: 5, name: "Sample · Lena K.", text: "Fast, friendly, and the star topper is stunning lit up. Highly recommend.", date: "2026-09-12T22:05:00.000Z" },
  { id: "sample-6", rating: 4, name: "Sample · Theo", text: "Great print, tiny bit of stringing on the sled but nothing a quick trim didn't fix. Still thrilled with it.", date: "2026-09-08T12:40:00.000Z" },
  { id: "sample-7", rating: 5, name: "Sample · Ava M.", text: "Reached out about a bulk order and got a thoughtful reply within the hour. The nordic ornaments are beautiful.", date: "2026-09-03T16:20:00.000Z" },
  { id: "sample-8", rating: 5, name: "Sample · Sam P.", text: "Exactly what I wanted — clean, sturdy, and the purple accent color matched perfectly.", date: "2026-08-29T08:10:00.000Z" },
];
