import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";

/**
 * Ensures that the current user is authenticated, active, and has the ADMIN role.
 * Queries live Database (via getCurrentUser) to protect against stale JWT session tokens.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
    redirect("/pos");
  }

  return user;
}
