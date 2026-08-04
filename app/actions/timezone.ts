"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { TIMEZONE_COOKIE, isValidTimezone } from "@/lib/user-timezone";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function setTimezone(formData: FormData) {
  const timezone = String(formData.get("timezone") ?? "").trim();

  if (!isValidTimezone(timezone)) {
    throw new Error("Invalid timezone");
  }

  const store = await cookies();
  store.set(TIMEZONE_COOKIE, timezone, {
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}
