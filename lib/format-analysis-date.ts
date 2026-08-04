// Analyses are usually one-per-day, so the date alone is enough to tell
// them apart. When a ticker has more than one on the same calendar day
// (e.g. a manual re-run shortly after the first), the date alone can't
// distinguish them, so fall back to including the time.
export function formatAnalysisDate(date: Date, siblingDates: Date[]): string {
  const sameDay = siblingDates.filter(
    (d) => d.toDateString() === date.toDateString()
  );

  if (sameDay.length <= 1) {
    return date.toLocaleDateString();
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}
