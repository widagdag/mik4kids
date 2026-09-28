// Summarize one or more Lighthouse JSON reports: scores + failing audits.
// Usage: node scripts/lh-summary.mjs .lh-home-m.json [...more.json]
import { readFileSync } from "node:fs";

const CATEGORY_LABELS = {
  performance: "Performance",
  accessibility: "Accessibility",
  "best-practices": "Best Practices",
  seo: "SEO",
};

const SKIP_AUDITS = new Set([
  // informational / manual / not actionable
  "performance-budget", "metrics", "network-requests", "mainthread-work-breakdown",
  "bootup-time", "screenshot-thumbnails", "final-screenshot", "user-timings",
  "diagnostics", "resource-summary", "uses-responsive-images", "redirects",
  "server-response-time", "uses-rel-preconnect", "main-document-wrap",
  "full-page-screenshot", "metrics-end-to-end", "cumulative-layout-shift",
  "largest-contentful-paint-element", "lcp-lazy-loaded", "layout-shifts",
  "layout-shift-elements", "long-tasks", "prioritize-lcp-image", "uses-long-cache-ttl",
  "offline-start-url", "installable-manifest", "splash-screen", "themed-omnibox",
  "maskable-icon", "content-width", "pwa-cross-browser", "pwa-each-page-has-url",
  "structured-data", "meta-description",
]);

function failText(audit) {
  const items = audit.details?.items;
  let extra = "";
  if (Array.isArray(items) && items.length > 0) {
    const first = items[0];
    const parts = [];
    for (const key of ["node", "source", "subItems", "url"]) {
      const v = first[key];
      if (!v) continue;
      if (key === "node" && v.selector) parts.push(v.selector);
      else if (key === "node" && v.explanation) parts.push(v.explanation.slice(0, 140));
      else if (key === "source" && v.url) parts.push(v.url.slice(0, 100));
      else if (key === "url") parts.push(String(v).slice(0, 100));
      else if (key === "subItems" && Array.isArray(v.items) && v.items[0]) {
        const s = v.items[0];
        const itemText = s.item || s.failingElements || "";
        parts.push(String(JSON.stringify(itemText)).slice(0, 160));
      }
    }
    if (parts.length) extra = " :: " + parts.join(" | ");
  }
  return `${audit.id} (score ${audit.score})${audit.displayValue ? " — " + audit.displayValue : ""}${extra}`;
}

for (const file of process.argv.slice(2)) {
  const report = JSON.parse(readFileSync(file, "utf8"));
  const url = report.finalDisplayedUrl || report.requestedUrl;
  const formFactor = report.configSettings?.formFactor || "?";
  console.log(`\n=== ${file} :: ${url} [${formFactor}] ===`);

  for (const [key, label] of Object.entries(CATEGORY_LABELS)) {
    const cat = report.categories[key];
    if (!cat) { console.log(`${label}: (missing)`); continue; }
    const pct = cat.score == null ? "?" : Math.round(cat.score * 100);
    console.log(`${label}: ${pct}`);
  }

  const audits = report.audits;
  for (const metricId of ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index", "interactive"]) {
    const a = audits[metricId];
    if (a) console.log(`  ${a.title}: ${a.displayValue}`);
  }

  console.log("\n-- failing/flagged audits --");
  const refs = Object.values(report.categories).flatMap((c) => c.auditRefs || []);
  for (const ref of refs) {
    const audit = audits[ref.id];
    if (!audit) continue;
    if (SKIP_AUDITS.has(audit.id)) continue;
    const mode = audit.scoreDisplayMode;
    if (mode === "notApplicable" || mode === "informative" || mode === "manual") continue;
    const bad = audit.score != null && audit.score < 0.9;
    if (bad) console.log(`  [${ref.group || "other"}] ${failText(audit)}`);
  }
}
