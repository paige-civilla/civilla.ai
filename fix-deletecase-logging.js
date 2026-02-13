/**
 * Civilla Delete Case Fix + Diagnose Script
 *
 * What it does:
 * 1) Scans your project for "section_id" references and prints them.
 * 2) Applies a safe patch replacing trial_binder_items.section_id -> trial_binder_items.section_key
 *    and common alias tbi.section_id -> tbi.section_key (only when trial_binder_items exists in the same file).
 * 3) Adds better server-side logging for delete-case failures (so you see the real reason).
 * 4) Prints any remaining "section_id" occurrences after patching.
 *
 * Run:
 *   node fix-deletecase-logging.js
 *
 * Undo:
 *   It creates backups for every file it modifies: <filename>.backup_<timestamp>
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function stamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function walk(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (["node_modules", ".git", "dist", "build", ".next", ".cache"].includes(e.name)) continue;
      out.push(...walk(path.join(dir, e.name)));
    } else {
      out.push(path.join(dir, e.name));
    }
  }
  return out;
}

function isTextFile(file) {
  const ext = path.extname(file).toLowerCase();
  return [
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".sql",
    ".json",
    ".md",
    ".env", ".example",
  ].includes(ext);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function write(file, content) {
  fs.writeFileSync(file, content, "utf8");
}

function backup(file, content) {
  const b = `${file}.backup_${stamp()}`;
  write(b, content);
  return b;
}

function findAllSectionId(files) {
  const hits = [];
  for (const f of files) {
    if (!isTextFile(f)) continue;
    let txt;
    try { txt = read(f); } catch { continue; }
    if (txt.includes("section_id")) {
      const lines = txt.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("section_id")) {
          hits.push({ file: f, line: i + 1, text: lines[i].trim().slice(0, 300) });
        }
      }
    }
  }
  return hits;
}

function patchTrialBinderSectionId(file, txt) {
  let updated = txt;
  const changes = [];

  if (/trial_binder_items\.section_id\b/.test(updated)) {
    const count = (updated.match(/trial_binder_items\.section_id\b/g) || []).length;
    updated = updated.replace(/trial_binder_items\.section_id\b/g, "trial_binder_items.section_key");
    changes.push(`trial_binder_items.section_id → section_key (x${count})`);
  }

  if (/\btrial_binder_items\b/.test(updated) && /\btbi\.section_id\b/.test(updated)) {
    const count = (updated.match(/\btbi\.section_id\b/g) || []).length;
    updated = updated.replace(/\btbi\.section_id\b/g, "tbi.section_key");
    changes.push(`tbi.section_id → tbi.section_key (x${count})`);
  }

  if (updated.includes("`") && updated.includes("trial_binder_items") && updated.includes(`"section_id"`)) {
    const templateRe = /`([\s\S]*?)`/g;
    let m;
    let rebuilt = "";
    let last = 0;
    let replacedCount = 0;

    while ((m = templateRe.exec(updated)) !== null) {
      const start = m.index;
      const end = templateRe.lastIndex;
      const body = m[1];

      rebuilt += updated.slice(last, start);

      let newBody = body;
      if (/\btrial_binder_items\b/.test(body) && /"section_id"\b/.test(body)) {
        const c = (newBody.match(/"section_id"\b/g) || []).length;
        newBody = newBody.replace(/"section_id"\b/g, `"section_key"`);
        replacedCount += c;
      }

      rebuilt += "`" + newBody + "`";
      last = end;
    }
    rebuilt += updated.slice(last);

    if (replacedCount > 0) {
      updated = rebuilt;
      changes.push(
        `"section_id" → "section_key" inside SQL template literals mentioning trial_binder_items (x${replacedCount})`
      );
    }
  }

  return { updated, changes };
}

function patchBetterDeleteLogging(file, txt) {
  let updated = txt;
  const changes = [];

  if (updated.includes("Failed to delete case")) {
    const re = /catch\s*\(\s*([a-zA-Z_$][\w$]*)\s*\)\s*\{\s*([\s\S]*?)error\s*:\s*["']Failed to delete case["']([\s\S]*?)\}/m;

    if (re.test(updated)) {
      updated = updated.replace(re, (match, errVar) => {
        if (match.includes("console.error") || match.includes("console.log")) return match;
        return match.replace(
          "{",
          `{\n      console.error("[DeleteCase] Failed:", ${errVar});\n      if (${errVar} && ${errVar}.message) console.error("[DeleteCase] message:", ${errVar}.message);\n      if (${errVar} && ${errVar}.stack) console.error("[DeleteCase] stack:", ${errVar}.stack);\n`
        );
      });
      changes.push("Added server-side console.error logging for delete-case failures (so you see the real DB error).");
    }
  }

  return { updated, changes };
}

(function main() {
  console.log("\n=== Civilla Delete Case: Fix + Diagnose ===\n");

  const allFiles = walk(ROOT);

  console.log("Step 1) Finding current 'section_id' references...\n");
  const beforeHits = findAllSectionId(allFiles);
  if (beforeHits.length === 0) {
    console.log("✅ No 'section_id' found anywhere. (Then your issue is something else.)");
  } else {
    console.log(`Found ${beforeHits.length} line(s) containing 'section_id'. Showing up to 30:\n`);
    beforeHits.slice(0, 30).forEach((h) => {
      console.log(`- ${path.relative(ROOT, h.file)}:${h.line}  ${h.text}`);
    });
    if (beforeHits.length > 30) console.log(`\n...and ${beforeHits.length - 30} more.\n`);
  }

  console.log("\nStep 2) Applying safe patches...\n");

  const modified = [];
  for (const f of allFiles) {
    if (!isTextFile(f)) continue;

    let txt;
    try { txt = read(f); } catch { continue; }

    let anyChanges = [];

    const p1 = patchTrialBinderSectionId(f, txt);
    let mid = p1.updated;
    anyChanges = anyChanges.concat(p1.changes);

    if (path.basename(f) === "routes.ts" || path.basename(f) === "routes.js") {
      const p2 = patchBetterDeleteLogging(f, mid);
      mid = p2.updated;
      anyChanges = anyChanges.concat(p2.changes);
    }

    if (mid !== txt) {
      const b = backup(f, txt);
      write(f, mid);
      modified.push({ file: f, backup: b, changes: anyChanges });
    }
  }

  if (modified.length === 0) {
    console.log("ℹ️ No files were modified by the patch rules.\n");
  } else {
    console.log(`✅ Modified ${modified.length} file(s):\n`);
    for (const m of modified) {
      console.log(`- ${path.relative(ROOT, m.file)}`);
      console.log(`  backup: ${path.relative(ROOT, m.backup)}`);
      for (const c of m.changes) console.log(`  change: ${c}`);
      console.log("");
    }
  }

  console.log("Step 3) Re-scan for remaining 'section_id' references...\n");
  const afterHits = findAllSectionId(allFiles);

  if (afterHits.length === 0) {
    console.log("✅ Great: No 'section_id' remains in the project.\n");
  } else {
    console.log(`⚠️ Still found ${afterHits.length} line(s) containing 'section_id'. Showing up to 30:\n`);
    afterHits.slice(0, 30).forEach((h) => {
      console.log(`- ${path.relative(ROOT, h.file)}:${h.line}  ${h.text}`);
    });
    console.log("\nThis means your running code may still be referencing section_id somewhere else.");
  }

  console.log(`
Next steps:
1) Restart your server/app (important).
2) Try deleting the case again.
3) If it still fails, copy/paste the SERVER CONSOLE error log (not just the red UI toast).
   With the logging patch above, it should now print the real cause.
`);
})();
