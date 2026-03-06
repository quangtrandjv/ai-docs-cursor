#!/usr/bin/env node
/**
 * Parse Figma get_node_info JSON and extract UI spec fields (text, font, color, radius, spacing).
 * Usage: node scripts/parse-figma-node.js <path-to-json-file>
 */
const fs = require("fs");
const path = process.argv[2];
if (!path || !fs.existsSync(path)) {
  console.error("Usage: node parse-figma-node.js <path-to-json-file>");
  process.exit(1);
}
const raw = fs.readFileSync(path, "utf8");
const node = JSON.parse(raw);

function toHex(c) {
  if (!c || !c.color) return null;
  const { r = 0, g = 0, b = 0 } = c.color;
  const a = c.opacity != null ? c.opacity : 1;
  const R = Math.round(r * 255), G = Math.round(g * 255), B = Math.round(b * 255);
  return a < 1 ? `rgba(${R},${G},${B},${a})` : "#" + [R, G, B].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function collect(el, depth, out) {
  if (!el) return;
  const rec = { name: el.name, type: el.type, depth };
  if (el.characters) rec.text = el.characters;
  if (el.style) {
    rec.fontSize = el.style.fontSize;
    rec.fontWeight = el.style.fontWeight;
    rec.fontName = el.style.fontName ? (el.style.fontName.family || "") + " " + (el.style.fontName.style || "") : null;
  }
  const fill = el.fills && el.fills[0];
  if (fill && fill.type === "SOLID" && fill.color) rec.fill = toHex(fill);
  if (el.cornerRadius != null) rec.radius = el.cornerRadius;
  if (el.absoluteBoundingBox) rec.bounds = Math.round(el.absoluteBoundingBox.width) + "x" + Math.round(el.absoluteBoundingBox.height);
  if (el.paddingLeft != null) rec.padding = [el.paddingLeft, el.paddingRight, el.paddingTop, el.paddingBottom].join(" ");
  if (rec.text || rec.fontSize || rec.fill || rec.radius != null) out.push(rec);
  (el.children || []).forEach((c) => collect(c, depth + 1, out));
}

const out = [];
collect(node, 0, out);
console.log(JSON.stringify(out, null, 2));
