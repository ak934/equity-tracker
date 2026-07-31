import { Resend } from "resend";
import { buildDigestEmailHtml, type DigestTargetPriceHit } from "./digest";

export async function sendTargetPriceHitEmail(hits: DigestTargetPriceHit[]): Promise<void> {
  if (hits.length === 0) return;

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Equity Tracker <onboarding@resend.dev>",
    to: process.env.DIGEST_EMAIL_TO!,
    subject:
      hits.length === 1
        ? `${hits[0].ticker} hit your target price`
        : `${hits.length} stocks hit their target price`,
    html: buildDigestEmailHtml(hits, []),
  });
}
