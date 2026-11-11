// Builds every brand asset: logo SVGs, logo PNGs, social profile images and the results cards.
// Numbers on the results cards come only from runs/results.jsonl, never typed in by hand.
// Run: node brand/render.mjs   (needs Playwright with Chromium, plus Inter and JetBrains Mono installed)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const out = (p, s) => { mkdirSync(dirname(join(here, p)), { recursive: true }); writeFileSync(join(here, p), s); };

export const C = {
  ink: '#0C1116',
  ink2: '#161D25',
  paper: '#F5F2EA',
  proof: '#22D47B',
  frozen: '#F2A93B',
  slate: '#5B6573',
  mist: '#A9B3BF',
};

// ---------- logo geometry ----------
// The mark: a check whose long stroke ends in an arrow. Checked, and moved up. On a 64 unit tile.
const MARK_STROKE = 'M16 33.5L27 44.5L47 21M35.5 20.5L47.5 20L47 32';
const tile = (bg, fg) =>
  `<rect width="64" height="64" rx="15" fill="${bg}"/>` +
  `<path d="${MARK_STROKE}" fill="none" stroke="${fg}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>`;
const bare = (fg) =>
  `<path d="${MARK_STROKE}" fill="none" stroke="${fg}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>`;

// Wordmark: "upkeep" in Inter Display Bold, outlined to paths (no font needed to show it), tracking -3.5%.
const wordPath = readFileSync(join(here, 'wordmark.path'), 'utf8')
  .trim()
  .replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n))));
const S = 0.024; // font units to logo units
const word = (fill, x, baseline) =>
  `<path transform="translate(${x} ${baseline}) scale(${S})" d="${wordPath}" fill="${fill}"/>`;

const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 4}" height="${h * 4}">${body}</svg>\n`;

const logos = {
  'logo/upkeep-mark.svg': svg(64, 64, tile(C.ink, C.proof)),
  'logo/upkeep-mark-light.svg': svg(64, 64, tile(C.paper, C.ink)),
  'logo/upkeep-mark-green.svg': svg(64, 64, tile(C.proof, C.ink)),
  'logo/upkeep-glyph.svg': svg(64, 64, bare(C.proof)),
  'logo/upkeep-lockup.svg': svg(242, 64, tile(C.ink, C.proof) + word(C.ink, 77.5, 46)),
  'logo/upkeep-lockup-on-dark.svg': svg(242, 64, tile(C.proof, C.ink) + word(C.paper, 77.5, 46)),
  'logo/upkeep-wordmark.svg': svg(162, 48, word(C.ink, -2.5, 36)),
};
for (const [p, s] of Object.entries(logos)) out(p, s);
out('logo/favicon.svg', logos['logo/upkeep-mark.svg']);

// ---------- data, only from runs/results.jsonl ----------
const spec = JSON.parse(readFileSync(join(root, 'specs/hexclave.json'), 'utf8'));
const rows = readFileSync(join(root, 'runs/results.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const greenBefore = rows.filter((r) => r.before?.install?.ok && r.before?.typecheck?.ok);
const moved = greenBefore.filter((r) => r.after?.typecheck?.ok && r.checkC?.pass);
const files = moved.reduce((a, r) => a + (r.change?.files ?? 0), 0);
const lines = moved.reduce((a, r) => a + (r.change?.added ?? 0) + (r.change?.removed ?? 0), 0);
const stats = { attempted: rows.length, counted: greenBefore.length, moved: moved.length, files, lines };
out('social/stats.json', JSON.stringify(stats, null, 2) + '\n');

// ---------- HTML templates for the PNGs ----------
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const base = (w, h, body, bg = C.ink) => `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${w}px;height:${h}px;background:${bg};overflow:hidden}
body{font-family:'Inter Display','Inter',sans-serif;color:${C.paper};-webkit-font-smoothing:antialiased}
.mono{font-family:'JetBrains Mono',monospace}
.grid{position:absolute;inset:0;background-image:linear-gradient(${C.ink2} 1px,transparent 1px),linear-gradient(90deg,${C.ink2} 1px,transparent 1px);background-size:48px 48px;opacity:.9}
.ok{color:${C.proof}} .old{color:${C.frozen}} .dim{color:${C.mist}}
</style></head><body>${body}</body></html>`;

const lockupDark = logos['logo/upkeep-lockup-on-dark.svg'];
const sized = (s, w) => s.replace(/width="\d+" height="\d+"/, `width="${w}"`);

const pill = (ok, label) =>
  `<span class="mono" style="display:inline-flex;align-items:center;gap:10px;padding:8px 16px;border-radius:999px;background:${ok ? 'rgba(34,212,123,.12)' : 'rgba(242,169,59,.12)'};color:${ok ? C.proof : C.frozen};font-size:24px;font-weight:600">● ${label}</span>`;

const pages = {
  // 400 x 400 profile picture (X, GitHub, LinkedIn, Discord)
  'social/avatar.png': [400, 400, base(400, 400, sized(logos['logo/upkeep-mark.svg'], 400), C.ink)],

  // Open Graph / link preview, also the GitHub social preview (1280 x 640)
  'social/og.png': [1280, 640, base(1280, 640, `<div class="grid"></div>
    <div style="position:absolute;left:96px;top:88px">${sized(lockupDark, 360)}</div>
    <div style="position:absolute;left:96px;top:250px;width:1090px;font-size:68px;font-weight:700;line-height:1.08;letter-spacing:-.02em">
      Moves repos off a frozen SDK.<br><span class="ok">Proves it with their own build.</span></div>
    <div class="mono dim" style="position:absolute;left:96px;bottom:84px;font-size:26px">type check + build, run before and after, in a sandbox with no network</div>`)],

  // X / Twitter header 1500 x 500. Left 400px stays clear for the avatar overlap on mobile.
  'social/x-header.png': [1500, 500, base(1500, 500, `<div class="grid"></div>
    <div style="position:absolute;right:110px;top:120px;text-align:right">
      <div style="font-size:64px;font-weight:700;letter-spacing:-.02em;line-height:1.1">Old SDK <span class="old">→</span> new SDK.</div>
      <div style="font-size:64px;font-weight:700;letter-spacing:-.02em;line-height:1.1" class="ok">Green before. Green after.</div>
      <div class="mono dim" style="margin-top:28px;font-size:24px">github.com/dshak1/upkeep</div></div>`)],

  // LinkedIn banner 1584 x 396
  'social/linkedin-banner.png': [1584, 396, base(1584, 396, `<div class="grid"></div>
    <div style="position:absolute;right:96px;top:96px;text-align:right">
      <div style="font-size:56px;font-weight:700;letter-spacing:-.02em;line-height:1.12">SDK migrations, <span class="ok">proved by the repo's own build.</span></div>
      <div class="mono dim" style="margin-top:24px;font-size:22px">upkeep · github.com/dshak1/upkeep</div></div>`)],

  // 1080 x 1350 scoreboard card: totals only, from results.jsonl
  'social/card-scoreboard.png': [1080, 1350, base(1080, 1350, `<div class="grid"></div>
    <div style="position:absolute;left:80px;top:80px">${sized(lockupDark, 300)}</div>
    <div class="mono dim" style="position:absolute;left:80px;top:250px;font-size:28px">@stackframe/* → @hexclave/*</div>
    <div style="position:absolute;left:80px;top:330px;display:flex;align-items:baseline;gap:24px;font-weight:800;line-height:1"><span class="ok" style="font-size:300px;letter-spacing:-.05em">${stats.moved}</span><span class="dim" style="font-size:120px;letter-spacing:-.02em">of ${stats.counted}</span></div>
    <div style="position:absolute;left:80px;top:660px;width:920px;font-size:52px;font-weight:700;line-height:1.15;letter-spacing:-.02em">repos that type-checked before the move still type-check after it.</div>
    <div class="mono" style="position:absolute;left:80px;top:900px;font-size:30px;line-height:1.8">
      <div><span class="dim">repos attempted ·</span> ${stats.attempted}</div>
      <div><span class="dim">files changed ·</span> ${stats.files}</div>
      <div><span class="dim">lines changed ·</span> ${stats.lines}</div></div>
    <div class="mono dim" style="position:absolute;left:80px;bottom:72px;font-size:24px">every number from runs/results.jsonl · github.com/dshak1/upkeep</div>`)],
};

// One 1080 x 1350 receipt card per moved repo
for (const r of moved) {
  const t = (s) => `${s.ok ? 'green' : 'red'} ${s.secs}s`;
  const row = (label, b, a) => `<tr><td class="dim" style="padding:14px 32px 14px 0">${label}</td>
    <td style="padding:14px 0">${pill(b.ok, t(b))}</td><td class="dim" style="padding:14px 18px">→</td><td style="padding:14px 0">${pill(a.ok, t(a))}</td></tr>`;
  const oldPkg = Object.entries(r.oldVersions ?? {}).map(([k, v]) => `${k}@${v}`).join(', ');
  const newPkg = Object.keys(r.oldVersions ?? {}).map((k) => `${spec.packages[k]?.to ?? k}@${r.versionLanded}`).join(', ');
  pages[`social/card-${r.id}.png`] = [1080, 1350, base(1080, 1350, `<div class="grid"></div>
    <div style="position:absolute;left:80px;top:80px">${sized(lockupDark, 300)}</div>
    <div class="mono dim" style="position:absolute;left:80px;top:240px;font-size:26px">receipt · commit ${esc(r.commit.slice(0, 7))}</div>
    <div style="position:absolute;left:80px;top:300px;width:920px;font-size:56px;font-weight:700;letter-spacing:-.02em;line-height:1.1;word-break:break-word">${esc(r.repo)}</div>
    <div class="mono" style="position:absolute;left:80px;top:480px;font-size:26px;line-height:1.7">
      <div><span class="old">${esc(oldPkg)}</span></div>
      <div><span class="ok">${esc(newPkg)}</span></div></div>
    <table class="mono" style="position:absolute;left:80px;top:640px;font-size:26px;border-collapse:collapse">
      ${row('type check', r.before.typecheck, r.after.typecheck)}
      ${r.before.build && r.after.build ? row('build', r.before.build, r.after.build) : ''}
    </table>
    <div class="mono" style="position:absolute;left:80px;top:900px;font-size:30px;line-height:1.8">
      <div><span class="dim">files changed ·</span> ${r.change.files}</div>
      <div><span class="dim">lines ·</span> +${r.change.added} / -${r.change.removed}</div>
      <div><span class="dim">old imports left ·</span> ${r.checkC.oldSpecifiers.length}</div>
      <div><span class="dim">left for a human ·</span> ${r.human}</div></div>
    <div class="mono dim" style="position:absolute;left:80px;bottom:72px;font-size:24px">from runs/results.jsonl · github.com/dshak1/upkeep</div>`)];
}

// Logo PNGs for places that will not take SVG
for (const [p, w, h] of [['logo/upkeep-mark', 512, 512], ['logo/upkeep-lockup', 968, 256], ['logo/upkeep-lockup-on-dark', 968, 256]]) {
  const bg = p.endsWith('on-dark') ? C.ink : 'transparent';
  pages[`${p}.png`] = [w, h, base(w, h, sized(logos[`${p}.svg`], w), bg)];
}

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const browser = await chromium.launch();
for (const [p, [w, h, html]] of Object.entries(pages)) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(here, p), omitBackground: html.includes('background:transparent') });
  await page.close();
}
await browser.close();
console.log(`brand: ${Object.keys(logos).length} svg, ${Object.keys(pages).length} png`, stats);
