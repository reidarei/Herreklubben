// Krever verifisert domene i Resend — sett RESEND_FROM til f.eks. "Herreklubben <noreply@dittdomene.no>"
const RESEND_API_KEY = process.env.RESEND_API_KEY!
const RESEND_FROM = process.env.RESEND_FROM ?? 'Herreklubben <onboarding@resend.dev>'

export async function sendEpost({ til, emne, html }: { til: string; emne: string; html: string }) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: RESEND_FROM, to: til, subject: emne, html }),
    })
    if (!res.ok) {
      console.error('Epost feilet:', await res.text())
    }
  } catch (err) {
    console.error('Epost-feil:', err)
  }
}

export function arrangementEpostHtml({
  tittel,
  tekst,
  url,
  knappTekst,
}: {
  tittel: string
  tekst: string
  url: string
  knappTekst: string
}) {
  return `
<!DOCTYPE html>
<html lang="no">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#111111;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;padding:32px 0;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#1e1e1e;border-radius:12px;border:1px solid #2a2a2a;padding:32px;">
        <tr><td>
          <p style="margin:0 0 4px;font-size:12px;color:#888;letter-spacing:0.1em;text-transform:uppercase;">Mortensrud Herreklubb</p>
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#f5f5f5;">${tittel}</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#aaa;">${tekst}</p>
          <a href="${url}" style="display:inline-block;background:#c17f24;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">${knappTekst}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
