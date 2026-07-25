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

/** Published Resend templates (managed in the Resend dashboard, referenced by alias). */
export const NOTIFICATION_TEMPLATE = 'makraz-contact-notification';
export const confirmationTemplate = (lang: Lang) => `makraz-contact-confirmation-${lang}`;

/** Mirrors each confirmation template's own subject; sent explicitly so the payload is self-contained. */
const CONFIRMATION_SUBJECTS: Record<Lang, string> = {
  fr: 'Merci, votre message est bien arrivé — MAKRAZ',
  en: 'Thanks — your message reached me — MAKRAZ',
  ar: 'شكراً، وصلت رسالتك — MAKRAZ',
};

async function postEmail(
  apiKey: string, payload: Record<string, unknown>, fetchImpl: typeof fetch,
): Promise<boolean> {
  try {
    const r = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** Internal notification to contact@makraz.com. Failure means the submission is lost — treat as fatal. */
export async function sendViaResend(
  s: Submission, apiKey: string, fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  return postEmail(apiKey, {
    from: 'MAKRAZ Site <contact@makraz.com>',
    to: ['contact@makraz.com'],
    reply_to: s.email,
    subject: `Contact makraz.com — ${s.name}`,
    template: {
      id: NOTIFICATION_TEMPLATE,
      variables: {
        SENDER_NAME: s.name,
        SENDER_EMAIL: s.email,
        COMPANY: s.company || '—',
        LANG: s.lang,
        MESSAGE: s.message,
      },
    },
  }, fetchImpl);
}

/** Localized auto-reply to the person who filled the form. Best-effort: never blocks a successful submission. */
export async function sendConfirmation(
  s: Submission, apiKey: string, fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  // From is the real Zoho mailbox, so a reply reaches the inbox even if a client ignores Reply-To.
  return postEmail(apiKey, {
    from: 'MAKRAZ <contact@makraz.com>',
    to: [s.email],
    subject: CONFIRMATION_SUBJECTS[s.lang],
    template: {
      id: confirmationTemplate(s.lang),
      variables: { SENDER_NAME: s.name, MESSAGE: s.message },
    },
  }, fetchImpl);
}
