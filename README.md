# makraz.com

Production site for [makraz.com](https://makraz.com), built with Astro on Cloudflare Pages/Workers. Visual and copy source of truth is `design_handoff_makraz_website/` (static HTML prototypes); the spec and implementation plan live under `docs/superpowers/` (`specs/`, `plans/`).

## Stack

- **Astro 7.1.3** with `@astrojs/cloudflare` 14.1.4, `output: 'static'`.
- Build produces a static client bundle at `dist/client/` and a server bundle (contact API route) at `dist/server/`. The root `wrangler.jsonc` is the pre-build source config (adapter placeholder `main`, `assets.directory: ./dist`); the build resolves it into the config that's actually consumed, `dist/server/wrangler.json` (`main: entry.mjs`, `assets.directory: ../client`), which is what `wrangler dev`/`wrangler deploy` run against.
- Tailwind CSS 4 via `@tailwindcss/vite`.
- `@astrojs/sitemap` for the sitemap, locale-aware (`fr`/`en`/`ar`).
- Content collections: `src/content/blog/` (one article, `fr`/`en`/`ar`, shared slug via `generateId` in `content.config.ts`) and `src/content/case-studies/` (Farblieferant case study, same 3-locale pattern).

## Routes and i18n

Every page exists in three locales — `/fr`, `/en`, `/ar` — with French slugs used throughout (e.g. `/fr/a-propos`). The root `/` redirects to `/fr`. Arabic pages render right-to-left. Translation strings live in `src/i18n/*.json`, namespaced per page plus a shared `common.*` namespace.

## Contact form / API

`src/pages/api/contact.ts` sends form submissions via Resend and verifies Cloudflare Turnstile. Secrets are read at runtime via `import { env } from 'cloudflare:workers'` (not `import.meta.env`), matching how Cloudflare Pages/Workers inject bindings and secrets in production. If `TURNSTILE_SECRET_KEY` is missing or empty at request time, the route logs a distinct error and returns `500 {ok:false,error:'config'}` instead of calling the verify API with an undefined secret. A filled honeypot field returns a fake success (`200 {ok:true}` / redirect to `#form-sent`) without sending mail, so bots can't tell they were caught.

**Production builds require `PUBLIC_TURNSTILE_SITE_KEY` to be set.** `astro build` runs with `PROD=true`, and `ContactForm.astro` throws during prerender if that var is empty in a production build — this is intentional, so a misconfigured deploy fails loudly instead of shipping a contact form with no widget. Local dev (`npm run dev`) is unaffected since it isn't a production build. For local/CI builds without real keys (e.g. Playwright's `test:e2e`, which runs `npm run build` under the hood), set `ALLOW_MISSING_TURNSTILE=1` as an escape hatch — already wired into `playwright.config.ts`'s `webServer.command`. Do not set it in the deploy/CI build used for production.

## Commands

```bash
npm run dev         # local dev server
npm run build        # astro build -> dist/client + dist/server
npm run preview      # wrangler-backed preview of the built output
npm run check        # astro check (TypeScript + template diagnostics)
npm test             # vitest run (unit/integration tests, excludes e2e/)
npm run test:e2e     # playwright test (builds + starts preview itself, pinned to port 4331)
npm run extract:i18n # regenerate src/i18n/*.json from design_handoff_makraz_website/ prototypes
```

`extract:i18n` (`scripts/extract-i18n.mjs`) only needs to be rerun if the design reference HTML changes. Hand-maintained translation keys that don't come from the prototypes are preserved across regeneration via the `MANUAL_KEYS` overlay in that script.

## Local development secrets

Secret keys (read via `cloudflare:workers` at runtime) and public build-time vars (read via `import.meta.env`, embedded by Vite) live in two different files — Vite only ever reads `PUBLIC_*` vars from `.env`, not from `.dev.vars`, so keep them separate:

```bash
cp .dev.vars.example .dev.vars   # RESEND_API_KEY, TURNSTILE_SECRET_KEY (secrets, git-ignored)
cp .env.example .env             # PUBLIC_TURNSTILE_SITE_KEY (public; git-ignored, only needed to override the committed value)
```

Fill in real values in both. Both files are git-ignored and must never be committed.

## One-time manual setup (production)

### Cloudflare Workers

`@astrojs/cloudflare` 14 targets **Cloudflare Workers with static assets**, not classic Pages — there is no "output directory" setting to configure in a Pages project. Two ways to deploy:

**Option A — Git integration (Workers Builds), preferred:**

1. Create a Cloudflare Workers project connected to this repository (Workers & Pages → Create → connect to Git; this is the "Workers Builds" flow, not the legacy Pages flow).
2. Production branch: `main`.
3. Build command: `npm run build`.
4. Deploy command: `npx wrangler deploy` (run from the repo root — it reads `wrangler.jsonc`, which Astro/Wrangler resolve against the just-built `dist/server/wrangler.json` for the actual `main`/`assets` paths). Validated locally with `npx wrangler deploy --dry-run`.
5. Add environment variables/secrets under the Worker's Settings:
   - `RESEND_API_KEY` (secret)
   - `TURNSTILE_SECRET_KEY` (secret)
   - `PUBLIC_TURNSTILE_SITE_KEY` — **no longer needs setting**: the site key is committed in `.env.production` (public by design, inlined at build time). Only set it here to override with a different widget.
6. Attach the custom domain `makraz.com` to the Worker (Settings → Domains & Routes). Done — both `makraz.com` and `www.makraz.com` are declared in `wrangler.jsonc` as custom domains.

   ⚠️ **`www` currently serves the site instead of redirecting.** Because `www.makraz.com` is a custom domain on the Worker, both hosts return 200. Canonical tags on every page point at the apex, so search engines pick the right host, but a real 301 is cleaner. Fix in the Cloudflare dashboard (Rules → Redirect Rules → Single Redirect), since it can't be expressed in `wrangler.jsonc`:

   - **When:** hostname equals `www.makraz.com`
   - **Then:** static/dynamic redirect to `concat("https://makraz.com", http.request.uri.path)`, status **301**, preserve query string

   Leave the `www.makraz.com` custom-domain route in place — the redirect rule runs before the Worker.
7. The first deploy may prompt to provision a `SESSION` KV namespace that the `@astrojs/cloudflare` adapter declares even though this site doesn't use sessions — accept the prompt (or disable sessions in the adapter config) to proceed; current config leaves this as-is.

**Option B — Manual deploy from a local/CI shell:**

1. `npm run build`
2. `npx wrangler deploy` (add `--dry-run` first to verify without publishing)
3. Set secrets once via `wrangler secret put RESEND_API_KEY` and `wrangler secret put TURNSTILE_SECRET_KEY`. `PUBLIC_TURNSTILE_SITE_KEY` comes from the committed `.env.production`.
4. Attach the custom domain as in step 6 above.

### Resend

1. Create an API key in the Resend dashboard, use it as `RESEND_API_KEY`.
2. Verify the `makraz.com` domain (add the SPF/DKIM DNS records shown in the Resend dashboard). Done — verified, region `eu-west-1`.
3. Sender address used by the contact form: `contact@makraz.com` — the real Zoho mailbox, so replies land in the inbox even if a mail client ignores `Reply-To`. No separate `site@`/`noreply@` mailbox is needed.

#### Email templates

The contact form sends **published Resend templates**, referenced by stable alias — the copy and design live in the Resend dashboard, not in this repo:

| Alias | Purpose | Variables |
|---|---|---|
| `makraz-contact-notification` | Internal notification to `contact@makraz.com` | `SENDER_NAME`, `SENDER_EMAIL`, `COMPANY`, `LANG`, `MESSAGE` |
| `makraz-contact-confirmation-fr` | Auto-reply to the sender (French) | `SENDER_NAME`, `MESSAGE` |
| `makraz-contact-confirmation-en` | Auto-reply to the sender (English) | `SENDER_NAME`, `MESSAGE` |
| `makraz-contact-confirmation-ar` | Auto-reply to the sender (Arabic, RTL) | `SENDER_NAME`, `MESSAGE` |

Notes:
- Editing copy in the dashboard requires **re-publishing** the template; unpublished drafts are not sendable.
- Adding, removing or renaming a variable requires a matching change in `src/lib/contact.ts`.
- The notification send is fatal (a failure returns `form-error`); the confirmation is best-effort and only logged on failure, so a broken auto-reply never loses a lead.
- Confirmation subjects are also set in `src/lib/contact.ts` (`CONFIRMATION_SUBJECTS`) so the payload is self-contained — keep them in sync with the templates' own subjects.

#### Inbound mail

Inbound mail for `@makraz.com` is handled by **Zoho** — Resend is used for *sending only* (`receiving: disabled`). Do not enable Resend receiving: it requires an apex `MX` record pointing at `inbound-smtp.<region>.amazonaws.com`, which would take over all mail for the domain and break Zoho delivery to `contact@makraz.com`.

### Turnstile

1. Create a Turnstile widget for `makraz.com` in the Cloudflare dashboard.
2. The site key is committed in `.env.production` (`PUBLIC_TURNSTILE_SITE_KEY`) — public by design, since it is served inside the contact page HTML. The secret key is a Worker secret (`TURNSTILE_SECRET_KEY`) and must never be committed. To swap widgets, edit `.env.production` and re-run `wrangler secret put TURNSTILE_SECRET_KEY`.

## Content gaps awaiting client input

The site builds and deploys cleanly, but the following content is still placeholder pending material from the client:

- **Portfolio screenshots and founder photo** — currently `ImagePlaceholder` slots; swap in real images once supplied.
- **Real testimonials** — `home.tm*` translation keys currently hold placeholder quotes.
- **Case study metrics** — the Farblieferant case study has `[à compléter]` markers where real performance numbers are needed.
- **Legal information** — RC/ICE/IF registration numbers and the hosting provider name are placeholders in the legal notice page.
- **Blog article review** — the existing article needs a content/editorial pass from the client before publishing.
- **EN/AR page titles and meta descriptions** — currently the French copy verbatim for all three locales; need proper translations.

## Testing

- `npm test` runs 19 Vitest tests (unit/integration, excludes `e2e/`).
- `npm run test:e2e` runs 30 Playwright tests; it builds the site and starts `wrangler`/`astro preview` itself on port 4331, so no separate server needs to be running first.
