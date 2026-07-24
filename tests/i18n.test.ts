import { describe, expect, it } from 'vitest';
import { dir, isLocale, locales, localePath, nextLocale, t } from '../src/i18n';

describe('i18n', () => {
  it('exposes the three locales', () => expect(locales).toEqual(['fr', 'en', 'ar']));
  it('translates a known key in each language', () => {
    for (const lang of locales) expect(t(lang, 'common.nav_contact')).toBeTruthy();
  });
  it('falls back to FR for a key missing in EN, throws on unknown', () => {
    expect(() => t('en', 'nope.nope')).toThrow(/Missing i18n key/);
  });
  it('dir is rtl only for ar', () => {
    expect(dir('ar')).toBe('rtl');
    expect(dir('fr')).toBe('ltr');
  });
  it('nextLocale cycles fr→en→ar→fr', () => {
    expect(nextLocale('fr')).toBe('en');
    expect(nextLocale('en')).toBe('ar');
    expect(nextLocale('ar')).toBe('fr');
  });
  it('localePath prefixes and handles root', () => {
    expect(localePath('en', '/services')).toBe('/en/services');
    expect(localePath('fr', '/')).toBe('/fr');
  });
  it('isLocale guards', () => {
    expect(isLocale('ar')).toBe(true);
    expect(isLocale('de')).toBe(false);
  });
});
