export const langs = ['fr', 'en', 'ar'] as const;
export type Lang = (typeof langs)[number];

export type Submission = {
  name: string; email: string; company: string; message: string;
  lang: Lang; turnstileToken: string; honeypot: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(data: FormData | Record<string, unknown>, key: string): string {
  const v = data instanceof FormData ? data.get(key) : data[key];
  return typeof v === 'string' ? v.trim() : '';
}

export function parseSubmission(data: FormData | Record<string, unknown>): Submission {
  const rawLang = field(data, 'lang');
  return {
    name: field(data, 'name'),
    email: field(data, 'email'),
    company: field(data, 'company'),
    message: field(data, 'message'),
    lang: (langs as readonly string[]).includes(rawLang) ? (rawLang as Lang) : 'fr',
    turnstileToken: field(data, 'cf-turnstile-response'),
    honeypot: field(data, 'website'),
  };
}

export function validate(s: Submission): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!s.name) errors.name = 'required';
  if (!EMAIL_RE.test(s.email)) errors.email = 'invalid';
  if (!s.message) errors.message = 'required';
  if (s.honeypot) errors.honeypot = 'spam';
  return errors;
}

export async function verifyTurnstile(
  token: string, secret: string, ip: string | null, fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip);
    const r = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const data = (await r.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export async function sendViaResend(
  s: Submission, apiKey: string, fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const r = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'MAKRAZ Site <site@makraz.com>',
        to: ['contact@makraz.com'],
        reply_to: s.email,
        subject: `Contact makraz.com — ${s.name}`,
        text: `Nom: ${s.name}\nEmail: ${s.email}\nSociété: ${s.company || '—'}\nLangue: ${s.lang}\n\n${s.message}`,
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}
