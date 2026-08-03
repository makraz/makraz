import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { locales, t } from '../src/i18n';

// The contact details printed on the physical business cards. If these ever change, the card page,
// the vCard and these constants must move together — hence one assertion per surface below.
const PHONE = '+212661764392';
const EMAIL = 'contact@makraz.com';

const CARD_KEYS = [
  'seo.mycard_title', 'seo.mycard_desc', 'mycard.tagline', 'mycard.intro', 'mycard.call',
  'mycard.whatsapp', 'mycard.email', 'mycard.save', 'mycard.website', 'mycard.address_label',
  'mycard.address', 'mycard.lang_label',
];

describe('mycard i18n', () => {
  it('defines every card key in all three locales', () => {
    for (const lang of locales) {
      for (const key of CARD_KEYS) expect(t(lang, key), `${lang}/${key}`).toBeTruthy();
    }
  });

  it('actually translates the card copy rather than falling back to French', () => {
    // t() silently falls back to FR for a missing key, so identical strings would hide a gap.
    for (const key of ['mycard.call', 'mycard.save', 'mycard.address']) {
      expect(t('en', key)).not.toBe(t('fr', key));
      expect(t('ar', key)).not.toBe(t('fr', key));
    }
  });

  it('names the office in every localized address', () => {
    expect(t('fr', 'mycard.address')).toContain('B52');
    expect(t('en', 'mycard.address')).toContain('B52');
    expect(t('ar', 'mycard.address')).toContain('B52');
    expect(t('fr', 'mycard.address')).toContain('Marrakech');
    expect(t('en', 'mycard.address')).toContain('Marrakech');
  });
});

describe('makraz.vcf', () => {
  const vcf = readFileSync(new URL('../public/makraz.vcf', import.meta.url), 'utf8');

  it('uses CRLF line endings as RFC 2426 requires', () => {
    expect(vcf).toMatch(/\r\n/);
    // A bare LF would be a spec violation some contact apps reject outright.
    expect(vcf.replace(/\r\n/g, '')).not.toMatch(/\n/);
  });

  it('is a well-formed vCard 3.0 envelope', () => {
    const lines = vcf.split('\r\n').filter(Boolean);
    expect(lines[0]).toBe('BEGIN:VCARD');
    expect(lines[1]).toBe('VERSION:3.0');
    expect(lines.at(-1)).toBe('END:VCARD');
  });

  it('carries the company name, phone, email and site', () => {
    expect(vcf).toContain('FN:MAKRAZ SARLAU');
    expect(vcf).toContain('ORG:MAKRAZ SARLAU');
    expect(vcf).toContain(`TEL;TYPE=WORK,VOICE:${PHONE}`);
    expect(vcf).toContain(`EMAIL;TYPE=WORK,INTERNET:${EMAIL}`);
    expect(vcf).toContain('URL:https://makraz.com');
  });

  it('escapes the commas inside the ADR street component', () => {
    const adr = vcf.split('\r\n').find((l) => l.startsWith('ADR'));
    expect(adr).toBeDefined();
    // Unescaped commas inside a component would corrupt the field split on import.
    const value = adr!.slice(adr!.indexOf(':') + 1);
    const components = value.split(';');
    expect(components).toHaveLength(7);
    expect(components[2]).toContain('B52');
    expect(components[2]).not.toMatch(/(^|[^\\]),/);
    expect(components[3]).toBe('Marrakech');
    expect(components[6]).toBe('Maroc');
  });
});
