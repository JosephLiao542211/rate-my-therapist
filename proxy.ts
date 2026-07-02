export { auth as proxy } from "@/lib/auth";

export const config = {
  // Protect only the vote API; everything else is public.
  matcher: ["/api/reviews/:id/vote"],
};
