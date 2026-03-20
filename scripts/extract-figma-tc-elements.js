/**
 * One-off: walk get_nodes_info JSON, emit elements for UI TC generation.
 */
const fs = require("fs");

const path = process.argv[2];
const outPath = process.argv[3];
if (!path) {
  console.error(
    "Usage: node extract-figma-tc-elements.js <path-to-json> [out-json]"
  );
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(path, "utf8"));
const root = Array.isArray(data) ? data[0] : data;

function hexRgb(f) {
  if (!f || f.type !== "SOLID" || f.color == null) return "";
  const c = f.color;
  const r = Math.round((c.r || 0) * 255);
  const g = Math.round((c.g || 0) * 255);
  const b = Math.round((c.b || 0) * 255);
  let s = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  if (f.opacity != null && f.opacity < 1) s += ` (opacity ${f.opacity})`;
  return s;
}

const COMMON_NAMES = new Set(
  [
    "header",
    "page-header",
    "app-header",
    "top-bar",
    "topbar",
    "navbar",
    "appbar",
    "sidebar",
    "side-bar",
    "side-menu",
    "sidemenu",
    "left-menu",
    "left-nav",
    "drawer",
    "navigation",
    "main-nav",
    "main-menu",
    "global-nav",
    "global-menu",
    "footer",
    "page-footer",
    "app-footer",
    "bottom-bar",
    "bottombar",
    "breadcrumb",
    "breadcrumbs",
    "status-bar",
    "statusbar",
  ].flatMap((p) => [p, p.replace(/-/g, "")])
);

function topLevelCommon(name) {
  const n = (name || "").toLowerCase().trim();
  for (const p of COMMON_NAMES) {
    if (n === p || n.startsWith(p + " ") || n.startsWith(p + "-")) return true;
  }
  return false;
}

function skipVisual(node) {
  if (node.visible === false) return true;
  if (node.opacity === 0) return true;
  const b = node.absoluteBoundingBox;
  if (b && (b.width === 0 || b.height === 0)) return true;
  return false;
}

const texts = [];
const instances = [];

function walk(node, ctx) {
  if (!node || skipVisual(node)) return;

  if (ctx.skipSubtree) return;

  const type = node.type;
  const name = node.name || "";

  if (type === "TEXT" && node.characters && String(node.characters).trim()) {
    const st = node.style || {};
    const fill = Array.isArray(node.fills) ? node.fills[0] : null;
    texts.push({
      name,
      characters: String(node.characters).replace(/\r/g, ""),
      fontFamily: st.fontFamily || "",
      fontWeight: st.fontWeight,
      fontSize: st.fontSize,
      textColor: hexRgb(fill),
      x: node.absoluteBoundingBox?.x ?? 0,
      y: node.absoluteBoundingBox?.y ?? 0,
      w: node.absoluteBoundingBox?.width ?? 0,
      h: node.absoluteBoundingBox?.height ?? 0,
    });
  }

  if (type === "INSTANCE") {
    const low = name.toLowerCase();
    if (
      /button|btn|primary|secondary|link|アイコン|ic\//.test(low) ||
      node.absoluteBoundingBox
    ) {
      instances.push({
        name,
        x: node.absoluteBoundingBox?.x ?? 0,
        y: node.absoluteBoundingBox?.y ?? 0,
        w: node.absoluteBoundingBox?.width ?? 0,
        h: node.absoluteBoundingBox?.height ?? 0,
      });
    }
  }

  const kids = node.children;
  if (!kids || !kids.length) return;

  for (const ch of kids) {
    let next = { ...ctx };
    if (ctx.depth === 0 && topLevelCommon(ch.name || "")) {
      next.skipSubtree = true;
    }
    next.depth = (ctx.depth || 0) + 1;
    walk(ch, next);
  }
}

walk(root, { depth: 0, skipSubtree: false });

texts.sort((a, b) => a.y - b.y || a.x - b.x);

// Dedupe: same label at nearly same Y (table rows) — keep first
const seenRowKeys = new Set();
const deduped = [];
for (const t of texts) {
  const key = `${t.characters}|${Math.round(t.x / 20)}`;
  const rowKey = `${Math.round(t.y / 2)}|${t.characters}`;
  if (t.characters.length < 2) continue;
  if (seenRowKeys.has(rowKey) && /^\d+$/.test(t.characters.trim()) === false) {
    const dupCluster = deduped.filter(
      (d) => Math.abs(d.y - t.y) < 3 && d.characters === t.characters
    );
    if (dupCluster.length >= 1) continue;
  }
  seenRowKeys.add(rowKey);
  deduped.push(t);
}

// Simpler dedupe: collapse identical (characters) when y within 40px (repeating table body)
const merged = [];
let lastY = -1e9;
const seenCharAtBand = new Map();
for (const t of texts) {
  const band = Math.round(t.y / 50);
  const ck = `${band}|${t.characters}`;
  if (seenCharAtBand.has(ck)) continue;
  seenCharAtBand.set(ck, 1);
  merged.push(t);
}

const payload = JSON.stringify(
  {
    frameName: root.name,
    frameSize: root.absoluteBoundingBox,
    filteredTopLevelCommon: (root.children || [])
      .filter((c) => topLevelCommon(c.name || ""))
      .map((c) => c.name),
    textCount: texts.length,
    mergedTextCount: merged.length,
    texts: merged,
    instanceSamples: instances.slice(0, 80),
  },
  null,
  2
);
if (outPath) fs.writeFileSync(outPath, payload, "utf8");
else process.stdout.write(payload);
