// These run in Server Components, so without an explicit timeZone,
// toLocaleDateString/toDateString would silently use the server's runtime
// timezone rather than the viewer's — showing the wrong calendar day (and
// wrong "same day" grouping below) for anyone not in that timezone.
function dateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// Analyses are usually one-per-day, so the date alone is enough to tell
// them apart. When a ticker has more than one on the same calendar day
// (e.g. a manual re-run shortly after the first), the date alone can't
// distinguish them, so fall back to including the time.
export function formatAnalysisDate(
  date: Date,
  siblingDates: Date[],
  timeZone: string
): string {
  const sameDay = siblingDates.filter(
    (d) => dateKey(d, timeZone) === dateKey(date, timeZone)
  );

  if (sameDay.length <= 1) {
    return date.toLocaleDateString(undefined, { timeZone });
  }

  return `${date.toLocaleDateString(undefined, { timeZone })} ${date.toLocaleTimeString(undefined, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  })}`;
}
