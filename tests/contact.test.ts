import { describe, expect, it, vi } from 'vitest';
import {
  NOTIFICATION_TEMPLATE, parseSubmission, sendConfirmation, sendViaResend, validate, verifyTurnstile,
} from '../src/lib/contact';

const valid = {
  name: 'Jane', email: 'jane@example.com', company: '', message: 'Bonjour',
  lang: 'fr' as const, turnstileToken: 'tok', honeypot: '',
};

describe('parseSubmission', () => {
  it('reads FormData fields including turnstile + honeypot', () => {
    const fd = new FormData();
    fd.set('name', 'Jane'); fd.set('email', 'jane@example.com');
    fd.set('message', 'Bonjour'); fd.set('lang', 'ar');
    fd.set('cf-turnstile-response', 'tok'); fd.set('website', '');
    const s = parseSubmission(fd);
    expect(s).toMatchObject({ name: 'Jane', lang: 'ar', turnstileToken: 'tok', honeypot: '' });
  });
  it('defaults missing fields to empty string and lang to fr', () => {
    const s = parseSubmission({});
    expect(s).toMatchObject({ name: '', email: '', message: '', lang: 'fr' });
  });
});

describe('validate', () => {
  it('accepts a valid submission', () => expect(validate(valid)).toEqual({}));
  it('rejects missing name, bad email, empty message', () => {
    const errors = validate({ ...valid, name: '', email: 'nope', message: '' });
    expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'name']);
  });
  it('rejects filled honeypot', () => {
    expect(validate({ ...valid, honeypot: 'spam' })).toHaveProperty('honeypot');
  });
});

describe('verifyTurnstile', () => {
  it('returns true on success:true', async () => {
    const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true })));
    await expect(verifyTurnstile('tok', 'secret', '1.2.3.4', f)).resolves.toBe(true);
    const body = f.mock.calls[0][1].body as URLSearchParams;
    expect(body.get('secret')).toBe('secret');
    expect(body.get('response')).toBe('tok');
  });
  it('returns false on success:false or fetch failure', async () => {
    const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false })));
    await expect(verifyTurnstile('tok', 'secret', null, f)).resolves.toBe(false);
    const boom = vi.fn().mockRejectedValue(new Error('net'));
    await expect(verifyTurnstile('tok', 'secret', null, boom)).resolves.toBe(false);
  });
});

describe('sendViaResend', () => {
  it('POSTs to resend with auth header and reply_to', async () => {
    const f = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    await expect(sendViaResend(valid, 'key123', f)).resolves.toBe(true);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer key123');
    expect(JSON.parse(init.body).reply_to).toBe('jane@example.com');
  });
  it('sends the notification template with the submission as variables', async () => {
    const f = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    await sendViaResend({ ...valid, company: '' }, 'key123', f);
    const body = JSON.parse(f.mock.calls[0][1].body);
    expect(body.from).toContain('contact@makraz.com');
    expect(body.to).toEqual(['contact@makraz.com']);
    expect(body.template.id).toBe(NOTIFICATION_TEMPLATE);
    expect(body.template.variables).toEqual({
      SENDER_NAME: 'Jane', SENDER_EMAIL: 'jane@example.com',
      COMPANY: '—', LANG: 'fr', MESSAGE: 'Bonjour',
    });
    expect(body.html).toBeUndefined();
    expect(body.text).toBeUndefined();
  });
  it('returns false on non-2xx', async () => {
    const f = vi.fn().mockResolvedValue(new Response('err', { status: 500 }));
    await expect(sendViaResend(valid, 'key123', f)).resolves.toBe(false);
  });
});

describe('sendConfirmation', () => {
  it('replies to the sender with the locale template', async () => {
    const f = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    await expect(sendConfirmation({ ...valid, lang: 'ar' }, 'key123', f)).resolves.toBe(true);
    const body = JSON.parse(f.mock.calls[0][1].body);
    expect(body.to).toEqual(['jane@example.com']);
    expect(body.from).toContain('contact@makraz.com');
    expect(body.template.id).toBe('makraz-contact-confirmation-ar');
    expect(body.template.variables).toEqual({ SENDER_NAME: 'Jane', MESSAGE: 'Bonjour' });
    expect(body.subject).toBeTruthy();
  });
  it('picks a distinct template and subject per locale', async () => {
    const f = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    for (const lang of ['fr', 'en', 'ar'] as const) await sendConfirmation({ ...valid, lang }, 'k', f);
    const bodies = f.mock.calls.map((c) => JSON.parse(c[1].body));
    expect(bodies.map((b) => b.template.id)).toEqual([
      'makraz-contact-confirmation-fr', 'makraz-contact-confirmation-en', 'makraz-contact-confirmation-ar',
    ]);
    expect(new Set(bodies.map((b) => b.subject)).size).toBe(3);
  });
  it('returns false on non-2xx or fetch failure without throwing', async () => {
    const bad = vi.fn().mockResolvedValue(new Response('err', { status: 422 }));
    await expect(sendConfirmation(valid, 'k', bad)).resolves.toBe(false);
    const boom = vi.fn().mockRejectedValue(new Error('net'));
    await expect(sendConfirmation(valid, 'k', boom)).resolves.toBe(false);
  });
});
