import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { load } from 'cheerio';
import { execSync } from 'node:child_process';

// GUARD — read this before removing it.
//
// This script was the one-off tool that seeded src/i18n/*.json from the design-handoff prototypes.
// The site has since moved well past those prototypes, so THEY ARE NO LONGER THE SOURCE OF TRUTH:
// src/i18n/*.json is. Anything this script cannot find in a prototype or in MANUAL_KEYS below is
// deleted from the locale files, and `t()` throws on a missing key — so a run breaks the build.
//
// It has already happened once. On 2026-08-04 a run removed 88 keys (414 → 326: every mycard.*,
// case_aya.*, case_phpmorocco.*, services.t*/ph*, home.cap*/p4*, portfolio.f4*/soon*) and reverted
// 10 values to prototype copy, including the home hero and the page titles that had just been
// de-duplicated for SEO. Recovery was `git checkout -- src/i18n`.
//
// If you genuinely need to re-seed from the prototypes, pass --force and diff the result carefully
// before committing.
if (!process.argv.includes('--force')) {
  console.error(
    '\nrefusing to run: this would rebuild src/i18n/*.json from the prototypes and delete every key\n' +
    'added since the handoff (88 keys, last time), breaking the build.\n\n' +
    'The locale files are the source of truth now — edit them directly.\n' +
    'If you really mean it: npm run extract:i18n -- --force\n',
  );
  process.exit(1);
}

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
    'contact.status_error': 'L\'envoi a échoué — écrivez-nous à contact@makraz.com.',
    'seo.home_title': "MAKRAZ — Agence digitale à Marrakech",
    'seo.home_desc': "Développement web & mobile, design et communication digitale. Des produits digitaux construits pour durer.",
    'seo.services_title': "Services — MAKRAZ",
    'seo.services_desc': "Développement, design et communication : tout ce qu'il faut pour exister en ligne, sous un même toit.",
    'seo.portfolio_title': "Portfolio — MAKRAZ",
    'seo.portfolio_desc': "Des projets en production sur trois marchés : e-commerce, plateformes et communautés.",
    'seo.case_farblieferant_title': "Étude de cas : Farblieferant — MAKRAZ",
    'seo.case_farblieferant_desc': "Comment nous avons construit la plateforme e-commerce de Farblieferant pour le marché allemand.",
    'seo.about_title': "À propos — MAKRAZ",
    'seo.about_desc': "Dix ans d'ingénierie entre la Suisse, l'Italie et Dubaï — installée à Marrakech.",
    'seo.contact_title': "Contact — MAKRAZ",
    'seo.contact_desc': "Parlons de votre projet. Un appel découverte gratuit, réponse sous 24 h — par email, WhatsApp ou téléphone.",
    'seo.legal_title': "Mentions légales — MAKRAZ",
    'seo.legal_desc': "Mentions légales et politique de confidentialité de MAKRAZ SARLAU.",
    'img.fb_card': "Page d'accueil de la boutique en ligne Farblieferant",
    'img.fb_hero': "Farblieferant — page d'accueil et catégories de produits",
    'img.fb_catalogue': "Catalogue produits Farblieferant avec filtres par pièce et par type de peinture",
    'img.fb_product': "Fiche produit Farblieferant : choix du format, du coloris et calculateur de surface",
    'img.php_card': "Page d'accueil de la plateforme communautaire PHP Morocco",
    'img.mphp_card': "Page d'accueil du site des meetups MarrakechPHP"
  },
  en: {
    'contact.status_sending': 'Sending…',
    'contact.status_sent': 'Message sent — we\'ll get back to you within 24 hours.',
    'contact.status_error': 'Sending failed — email us at contact@makraz.com.',
    'seo.home_title': "MAKRAZ — Digital agency in Marrakech",
    'seo.home_desc': "Web & mobile development, design and digital communication. Digital products built to last.",
    'seo.services_title': "Services — MAKRAZ",
    'seo.services_desc': "Development, design and communication: everything you need to exist online, under one roof.",
    'seo.portfolio_title': "Portfolio — MAKRAZ",
    'seo.portfolio_desc': "Projects live in production across three markets: e-commerce, platforms and communities.",
    'seo.case_farblieferant_title': "Case study: Farblieferant — MAKRAZ",
    'seo.case_farblieferant_desc': "How we built Farblieferant's e-commerce platform for the German market.",
    'seo.about_title': "About — MAKRAZ",
    'seo.about_desc': "Ten years of engineering across Switzerland, Italy and Dubai — now based in Marrakech.",
    'seo.contact_title': "Contact — MAKRAZ",
    'seo.contact_desc': "Let's talk about your project. A free discovery call, answered within 24 hours — by email, WhatsApp or phone.",
    'seo.legal_title': "Legal notice — MAKRAZ",
    'seo.legal_desc': "Legal notice and privacy policy of MAKRAZ SARLAU.",
    'img.fb_card': "Home page of the Farblieferant online shop",
    'img.fb_hero': "Farblieferant — home page and product categories",
    'img.fb_catalogue': "Farblieferant product catalogue with filters by room and paint type",
    'img.fb_product': "Farblieferant product page: size and colour selection with a coverage calculator",
    'img.php_card': "Home page of the PHP Morocco community platform",
    'img.mphp_card': "Home page of the MarrakechPHP meetup site"
  },
  ar: {
    'contact.status_sending': 'جارٍ الإرسال…',
    'contact.status_sent': 'أُرسلت الرسالة — سنعود إليكم خلال ٢٤ ساعة.',
    'contact.status_error': 'فشل الإرسال — راسلونا على contact@makraz.com.',
    'seo.home_title': "MAKRAZ — وكالة رقمية في مراكش",
    'seo.home_desc': "تطوير الويب والتطبيقات، التصميم والتواصل الرقمي. منتجات رقمية صُنعت لتدوم.",
    'seo.services_title': "الخدمات — MAKRAZ",
    'seo.services_desc': "التطوير والتصميم والتواصل: كل ما تحتاجه للحضور على الإنترنت، تحت سقف واحد.",
    'seo.portfolio_title': "أعمالنا — MAKRAZ",
    'seo.portfolio_desc': "مشاريع قيد الاستخدام الفعلي في ثلاثة أسواق: التجارة الإلكترونية والمنصات والمجتمعات.",
    'seo.case_farblieferant_title': "دراسة حالة: Farblieferant — MAKRAZ",
    'seo.case_farblieferant_desc': "كيف بنينا منصة التجارة الإلكترونية لشركة Farblieferant في السوق الألمانية.",
    'seo.about_title': "من نحن — MAKRAZ",
    'seo.about_desc': "عشر سنوات من الهندسة بين سويسرا وإيطاليا ودبي — من مقرّنا في مراكش.",
    'seo.contact_title': "اتصل بنا — MAKRAZ",
    'seo.contact_desc': "لنتحدث عن مشروعك. مكالمة تعريفية مجانية، والرد خلال ٢٤ ساعة — بالبريد الإلكتروني أو واتساب أو الهاتف.",
    'seo.legal_title': "الإشعارات القانونية — MAKRAZ",
    'seo.legal_desc': "الإشعارات القانونية وسياسة الخصوصية لشركة MAKRAZ SARLAU.",
    'img.fb_card': "الصفحة الرئيسية لمتجر Farblieferant الإلكتروني",
    'img.fb_hero': "Farblieferant — الصفحة الرئيسية وفئات المنتجات",
    'img.fb_catalogue': "كتالوج منتجات Farblieferant مع فلاتر حسب الغرفة ونوع الطلاء",
    'img.fb_product': "صفحة المنتج في Farblieferant: اختيار الحجم واللون مع حاسبة المساحة",
    'img.php_card': "الصفحة الرئيسية لمنصة مجتمع PHP Morocco",
    'img.mphp_card': "الصفحة الرئيسية لموقع لقاءات MarrakechPHP"
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
