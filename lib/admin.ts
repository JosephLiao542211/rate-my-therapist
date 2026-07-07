import "server-only";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export interface AdminSession {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

/** Redirects to sign-in (or home, if signed in but not an admin) unless the caller is an admin. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/admin");
  }
  if (session.user.role !== "admin") {
    redirect("/");
  }
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    role: session.user.role,
  };
}

/** Same check for Route Handlers, which can't redirect — returns null when unauthorized. */
export async function requireAdminApi(): Promise<AdminSession | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    role: session.user.role,
  };
}
