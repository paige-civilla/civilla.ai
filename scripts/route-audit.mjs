import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CLIENT_DIR = path.join(ROOT, "client", "src");

const exts = new Set([".ts", ".tsx", ".js", ".jsx"]);
const IGNORE_DIRS = new Set(["node_modules", "dist", "build", ".git", ".next", ".vite", "coverage"]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (exts.has(path.extname(e.name))) out.push(p);
  }
  return out;
}

function read(file) {
  try { return fs.readFileSync(file, "utf8"); } catch { return ""; }
}

// Extract routes from common React Router patterns
function extractRoutesFromText(txt) {
  const routes = new Set();

  // <Route path="/x" ... />
  const routeTag = /<Route\b[^>]*\bpath\s*=\s*(\{?\s*["'`][^"'`]+["'`]\s*\}?)/g;
  let m;
  while ((m = routeTag.exec(txt))) {
    const raw = m[1].replace(/[{}]/g, "").trim();
    const p = raw.slice(1, -1); // remove quotes
    if (p) routes.add(p);
  }

  // createBrowserRouter([{ path: "/x", ... }])
  const objPath = /\bpath\s*:\s*["'`][^"'`]+["'`]/g;
  while ((m = objPath.exec(txt))) {
    const kv = m[0];
    const p = kv.split(":")[1].trim();
    const val = p.slice(1, -1);
    if (val) routes.add(val);
  }

  return routes;
}

// Extract internal links from <Link to="...">, href="/...", navigate("/...")
function extractLinksFromText(txt) {
  const links = new Set();

  // to="/x" or to={'/x'}
  const toAttr = /\bto\s*=\s*(\{?\s*["'`][^"'`]+["'`]\s*\}?)/g;
  let m;
  while ((m = toAttr.exec(txt))) {
    const raw = m[1].replace(/[{}]/g, "").trim();
    const p = raw.slice(1, -1);
    if (p.startsWith("/")) links.add(p);
  }

  // href="/x"
  const hrefAttr = /\bhref\s*=\s*(\{?\s*["'`][^"'`]+["'`]\s*\}?)/g;
  while ((m = hrefAttr.exec(txt))) {
    const raw = m[1].replace(/[{}]/g, "").trim();
    const p = raw.slice(1, -1);
    if (p.startsWith("/")) links.add(p);
  }

  // navigate("/x")
  const navCall = /\bnavigate\s*\(\s*["'`][^"'`]+["'`]\s*\)/g;
  while ((m = navCall.exec(txt))) {
    const inside = m[0].match(/["'`][^"'`]+["'`]/)?.[0];
    if (!inside) continue;
    const p = inside.slice(1, -1);
    if (p.startsWith("/")) links.add(p);
  }

  return links;
}

function normalize(p) {
  if (!p) return p;
  // treat "" as "/"
  if (p === "") return "/";
  // strip hash/anchor portion for route matching
  const hashIndex = p.indexOf("#");
  if (hashIndex > 0) p = p.substring(0, hashIndex);
  // strip trailing slashes except root
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p;
}

const files = walk(CLIENT_DIR);
const allRoutes = new Set();
const allLinks = new Set();

for (const f of files) {
  const txt = read(f);
  for (const r of extractRoutesFromText(txt)) allRoutes.add(normalize(r));
  for (const l of extractLinksFromText(txt)) allLinks.add(normalize(l));
}

const routes = [...allRoutes].filter(Boolean).sort();
const links = [...allLinks].filter(Boolean).sort();

const missing = links.filter((l) => !allRoutes.has(l) && !l.startsWith("/api"));
const orphan = routes.filter((r) => !allLinks.has(r));

console.log("=== ROUTE AUDIT ===");
console.log("Routes found:", routes.length);
console.log("Links found:", links.length);
console.log("");

if (missing.length) {
  console.log("❌ Links that do NOT match any declared route (possible 404s):");
  for (const m of missing) console.log("  -", m);
  console.log("");
} else {
  console.log("✅ All internal links appear to map to declared routes.");
  console.log("");
}

if (orphan.length) {
  console.log("⚠️ Declared routes that are never linked (may be OK if navigated programmatically):");
  for (const o of orphan) console.log("  -", o);
  console.log("");
} else {
  console.log("✅ Every declared route is referenced by at least one link.");
  console.log("");
}

// Output a copy-paste list for manual testing
console.log("Manual test list (visit each):");
for (const r of routes) console.log("  -", r);

process.exit(missing.length ? 1 : 0);
