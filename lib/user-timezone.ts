import { cookies } from "next/headers";

export const TIMEZONE_COOKIE = "tz";
export const DEFAULT_TIMEZONE = "UTC";

export function isValidTimezone(timezone: string): boolean {
  try {
    // throws RangeError on anything that isn't a real IANA zone name
    new Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

// Server Components render dates using the server's own runtime timezone,
// not the viewer's — wrong for anyone not in that timezone. Since the app
// has no per-user settings table (Clerk handles auth, not preferences),
// this is stored as a cookie: set once from the browser-detected guess (see
// components/TimezoneSetting.tsx), then read here on every server render.
export async function getUserTimezone(): Promise<string> {
  const store = await cookies();
  const value = store.get(TIMEZONE_COOKIE)?.value;
  return value && isValidTimezone(value) ? value : DEFAULT_TIMEZONE;
}

export async function hasUserTimezone(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(TIMEZONE_COOKIE)?.value;
  return Boolean(value && isValidTimezone(value));
}
