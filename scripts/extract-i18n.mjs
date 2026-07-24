import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { load } from 'cheerio';

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
mkdirSync('src/i18n', { recursive: true });
for (const lang of ['fr', 'en', 'ar'])
  writeFileSync(`src/i18n/${lang}.json`, JSON.stringify(out[lang], null, 2) + '\n');
console.log(`fr:${Object.keys(out.fr).length} en:${Object.keys(out.en).length} ar:${Object.keys(out.ar).length} keys`);
