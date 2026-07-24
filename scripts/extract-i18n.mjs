import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { load } from 'cheerio';
import { execSync } from 'node:child_process';

const SRC = 'design_handoff_makraz_website';
const PAGES = {
  home: 'Home.dc.html', services: 'Services.dc.html', portfolio: 'Portfolio.dc.html',
  about: 'About.dc.html', contact: 'Contact.dc.html', blog: 'Blog.dc.html',
  article: 'Article.dc.html', case_farblieferant: 'CaseFarblieferant.dc.html', legal: 'Legal.dc.html',
};
const COMMON_RE = /^(nav_|toggle$|foot_|footer_)/;

function extractDict(scriptText, name) {
  const start = scriptText.indexOf(`const ${name} = {`);
  if (start === -1) return {};
  let i = scriptText.indexOf('{', start), depth = 0;
  for (let j = i; j < scriptText.length; j++) {
    if (scriptText[j] === '{') depth++;
    if (scriptText[j] === '}') { depth--; if (depth === 0) return new Function(`return ${scriptText.slice(i, j + 1)}`)(); }
  }
  throw new Error(`Unbalanced ${name} object`);
}

const out = { fr: {}, en: {}, ar: {} };
for (const [page, file] of Object.entries(PAGES)) {
  const html = readFileSync(`${SRC}/${file}`, 'utf8');
  const $ = load(html);
  const script = $('script[data-dc-script]').text();
  const en = extractDict(script, 'EN');
  const ar = extractDict(script, 'AR');
  $('[data-i18n]').each((_, el) => {
    const k = $(el).attr('data-i18n');
    const frVal = $(el).text().trim();
    const ns = COMMON_RE.test(k) ? 'common' : page;
    const key = `${ns}.${k}`;
    for (const [lang, dict] of [['fr', { [k]: frVal }], ['en', en], ['ar', ar]]) {
      const val = dict[k];
      if (val == null) { if (lang !== 'fr') console.warn(`MISSING ${lang} ${page}.${k}`); continue; }
      if (out[lang][key] != null && out[lang][key] !== val)
        throw new Error(`Conflict for ${key} (${lang}) between pages`);
      out[lang][key] = val;
    }
  });
}
// Hand-maintained keys with no data-i18n source in the prototypes (e.g. form status
// strings living in Contact.dc.html's statusText() JS). Merged on every run so
// regeneration never drops them.
const MANUAL_KEYS = {
  fr: {
    'contact.status_sending': 'Envoi en cours…',
    'contact.status_sent': 'Message envoyé — nous revenons vers vous sous 24 h.',
    'contact.status_error': 'L\'envoi a échoué — écrivez-nous à contact@makraz.com.'
  },
  en: {
    'contact.status_sending': 'Sending…',
    'contact.status_sent': 'Message sent — we\'ll get back to you within 24 hours.',
    'contact.status_error': 'Sending failed — email us at contact@makraz.com.'
  },
  ar: {
    'contact.status_sending': 'جارٍ الإرسال…',
    'contact.status_sent': 'أُرسلت الرسالة — سنعود إليكم خلال ٢٤ ساعة.',
    'contact.status_error': 'فشل الإرسال — راسلونا على contact@makraz.com.'
  }
};

// Helper to get git HEAD version for key order reference
function getHeadKeyOrder(lang) {
  try {
    const content = execSync(`git show HEAD:src/i18n/${lang}.json`, { encoding: 'utf8' });
    return Object.keys(JSON.parse(content));
  } catch (e) {
    console.error(`ERROR getting HEAD key order for ${lang}:`, e.message);
    return [];
  }
}

mkdirSync('src/i18n', { recursive: true });
for (const lang of ['fr', 'en', 'ar']) {
  // Get key order from git HEAD version if available
  const headKeyOrder = getHeadKeyOrder(lang);

  // Merge extracted keys with manual keys
  const merged = { ...out[lang], ...MANUAL_KEYS[lang] };

  // Build final dict respecting original key order
  const final = {};
  for (const key of headKeyOrder) {
    if (key in merged) {
      final[key] = merged[key];
    }
  }
  // Add any new keys not in HEAD version
  for (const [key, val] of Object.entries(merged)) {
    if (!(key in final)) final[key] = val;
  }

  writeFileSync(`src/i18n/${lang}.json`, JSON.stringify(final, null, 2) + '\n');
}
console.log(`fr:${Object.keys(out.fr).length} en:${Object.keys(out.en).length} ar:${Object.keys(out.ar).length} keys`);
