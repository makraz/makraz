export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { parseSubmission, sendViaResend, validate, verifyTurnstile } from '../../lib/contact';

const json = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request, redirect }) => {
  const wantsJson = request.headers.get('accept')?.includes('application/json') ?? false;
  const s = parseSubmission(await request.formData());
  const back = (frag: 'form-sent' | 'form-error') => redirect(`/${s.lang}/contact#${frag}`, 303);

  const errors = validate(s);
  if (Object.keys(errors).length) return wantsJson ? json({ ok: false, errors }, 400) : back('form-error');

  const ip = request.headers.get('cf-connecting-ip');
  if (!(await verifyTurnstile(s.turnstileToken, env.TURNSTILE_SECRET_KEY, ip)))
    return wantsJson ? json({ ok: false, error: 'turnstile' }, 400) : back('form-error');

  if (!(await sendViaResend(s, env.RESEND_API_KEY)))
    return wantsJson ? json({ ok: false, error: 'send' }, 500) : back('form-error');

  return wantsJson ? json({ ok: true }, 200) : back('form-sent');
};
