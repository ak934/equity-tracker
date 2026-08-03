// A real analysis run (research + Triple-Pass Discipline) takes well under
// this. If analysisRunning has been true longer than this, the process that
// set it (e.g. a dev server restart, deploy, or crash) almost certainly died
// mid-run without clearing the flag — treat it as not running rather than
// wedging the ticker until someone manually fixes the DB.
const STALE_AFTER_MS = 5 * 60 * 1000;

export function isAnalysisRunning(stock: {
  analysisRunning: boolean;
  analysisStartedAt: Date | null;
}): boolean {
  if (!stock.analysisRunning) return false;
  if (!stock.analysisStartedAt) return true;
  return Date.now() - stock.analysisStartedAt.getTime() < STALE_AFTER_MS;
}
