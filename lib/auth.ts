// lib/auth.ts
import { cookies } from "next/headers";

export async function getCurrentUserId() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  return userId;
}