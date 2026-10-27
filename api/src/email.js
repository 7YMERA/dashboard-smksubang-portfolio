// Email through Resend (https://resend.com), only for account setup links. Set RESEND_API_KEY and EMAIL_FROM
// (an address on a domain verified in Resend). Optional: without them nothing is sent, and the admin sends the link
// with "Salin pautan" (WhatsApp), which is the normal way.
export const emailReady = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Sends the "Tetapkan kata laluan" email. Returns true if Resend accepted it. */
export async function sendSetupEmail({ to, name, url, purpose, minutes }) {
  if (!emailReady()) return false;
  const valid = minutes % 60 ? `${minutes} minit` : `${minutes / 60} jam`;
  const subject = purpose === 'invite' ? 'Akaun Panel Admin Dashboard SMK Subang' : 'Tetapkan kata laluan Panel Admin Dashboard SMK Subang';
  const lead = purpose === 'invite'
    ? 'Akaun Panel Admin Dashboard Data SMK Subang telah dibuat untuk anda.'
    : 'Ada permintaan untuk menetapkan kata laluan baharu bagi akaun Panel Admin anda.';
  const text = `Salam ${name || ''},\n\n${lead}\nTekan pautan ini untuk menetapkan kata laluan (sah ${valid}, sekali guna sahaja):\n${url}\n\nJika anda tidak meminta ini, abaikan emel ini.`;
  const html = `<p>Salam ${esc(name || '')},</p><p>${esc(lead)}</p>
<p><a href="${esc(url)}" style="display:inline-block;padding:10px 18px;background:#00477a;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">Tetapkan kata laluan</a></p>
<p style="color:#555">Pautan ini sah selama ${valid} dan boleh digunakan sekali sahaja. Jika anda tidak meminta ini, abaikan emel ini.</p>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text, html }),
    });
    if (!res.ok) console.error('email failed', res.status, (await res.text()).slice(0, 300));
    return res.ok;
  } catch (err) {
    console.error('email failed', err.message);
    return false;
  }
}
