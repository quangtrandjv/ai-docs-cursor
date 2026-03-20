/**
 * One-off parser: reads get_node_info JSON path from argv, outputs summary + elements JSON to stdout.
 */
const fs = require("fs");

const COMMON_PATTERNS = [
  { re: /^(header|page-header|app-header|top-bar|topbar|navbar|appbar)|\/header\/|\/header$/i, label: "Header" },
  { re: /sidebar|side-bar|side-menu|sidemenu|left-menu|left-nav|^drawer$|side\s*menu/i, label: "Sidebar" },
  { re: /navigation|main-nav|main-menu|global-nav|global-menu/i, label: "Navigation" },
  { re: /footer|page-footer|app-footer|bottom-bar|bottombar/i, label: "Footer" },
  { re: /breadcrumb/i, label: "Breadcrumb" },
  { re: /status-bar|statusbar/i, label: "Status bar" },
];

function commonRegion(name) {
  const n = name || "";
  for (const { re, label } of COMMON_PATTERNS) {
    if (re.test(n)) return label;
  }
  if (/side\s*menu/i.test(n)) return "Sidebar";
  return null;
}

function box(n) {
  return n.absoluteBoundingBox || n.absoluteRenderBounds;
}

function isHidden(n) {
  if (n.visible === false) return true;
  if (typeof n.opacity === "number" && n.opacity === 0) return true;
  const b = box(n);
  if (b && (b.width === 0 || b.height === 0)) return true;
  return false;
}

function rgbToHex(c) {
  if (!c) return null;
  const r = Math.round((c.r || 0) * 255);
  const g = Math.round((c.g || 0) * 255);
  const b = Math.round((c.b || 0) * 255);
  return (
    "#" +
    [r, g, b]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  );
}

function textColor(node) {
  const fills = node.fills;
  if (!fills || !fills.length) return null;
  const f = fills.find((x) => x.visible !== false && x.type === "SOLID");
  return f && f.color ? rgbToHex(f.color) : null;
}

function fontStr(style) {
  if (!style) return null;
  const fam = style.fontFamily || "";
  const w = style.fontWeight;
  const sz = style.fontSize;
  return { family: fam, weight: w, size: sz };
}

let commonFiltered = [];

function countNodes(n) {
  let c = 1;
  if (n.children) n.children.forEach((ch) => (c += countNodes(ch)));
  return c;
}

function classifyName(name) {
  const s = (name || "").toLowerCase();
  if (s.includes("tooltip")) return "Tooltip";
  if (s.includes("button") || s.includes("btn") || s.includes("cta")) return "Button";
  if (s.includes("input") || s.includes("textfield") || s.includes("text-field") || s.includes("search")) return "Input";
  if (s.includes("dropdown") || s.includes("select") || s.includes("combobox") || s.includes("pulldown")) return "Dropdown";
  if (s.includes("checkbox")) return "Checkbox";
  if (s.includes("radio")) return "Radio";
  if (s.includes("toggle") || s.includes("switch")) return "Toggle";
  if (s.includes("tab")) return "Tab";
  if (s.includes("table") || s.includes("data-table")) return "Table";
  if (s.includes("modal") || s.includes("dialog") || s.includes("popup")) return "Modal";
  if (s.includes("icon") || /^ic[-_]/i.test(name || "")) return "Icon";
  if (s.includes("pagination")) return "Pagination";
  if (s.includes("card")) return "Card";
  return null;
}

function walk(
  n,
  frameBox,
  skipRootCommon,
  out,
  depth,
  path
) {
  if (!n || isHidden(n)) return;

  if (skipRootCommon && depth === 1) {
    const reg = commonRegion(n.name);
    if (reg) {
      commonFiltered.push({ region: reg, name: n.name, nodes: countNodes(n) });
      return;
    }
  }

  const b = box(n);
  if (frameBox && b) {
    const fx = frameBox.x,
      fy = frameBox.y,
      fw = frameBox.width,
      fh = frameBox.height;
    const cx = b.x,
      cy = b.y,
      cw = b.width,
      ch = b.height;
    if (cx > fx + fw + 1 || cx + cw < fx - 1 || cy > fy + fh + 1 || cy + ch < fy - 1) {
      return;
    }
  }

  if (n.type === "TEXT" && n.characters != null) {
    const st = fontStr(n.style);
    const uiFromName = classifyName(path[path.length - 1] || "");
    let uiType = uiFromName;
    if (!uiType && st) {
      const fsz = st.size || 12;
      const fw = st.weight || 400;
      if (fsz >= 20 || fw >= 700) uiType = "Title";
      else if (fsz >= 14) uiType = "Label";
      else uiType = "Hint/Caption";
    }
    if (!uiType) uiType = "Label";
    out.push({
      kind: "text",
      name: n.name,
      uiType,
      text: String(n.characters).replace(/\n/g, " ").trim(),
      path: path.join(" > "),
      y: b ? b.y : 0,
      x: b ? b.x : 0,
      w: b ? b.width : 0,
      h: b ? b.height : 0,
      font: st,
      color: textColor(n),
    });
  }

  if (n.type === "INSTANCE" || n.type === "FRAME") {
    const cn = classifyName(n.name);
    if (cn && cn !== "Tooltip") {
      const bb = box(n);
      out.push({
        kind: "component",
        name: n.name,
        uiType: cn,
        text: "",
        path: path.join(" > "),
        y: bb ? bb.y : 0,
        x: bb ? bb.x : 0,
        w: bb ? bb.width : 0,
        h: bb ? bb.height : 0,
        cornerRadius: n.cornerRadius,
        fills: n.fills,
      });
    }
    if (classifyName(n.name) === "Tooltip" || (n.name || "").toLowerCase().includes("tooltip")) {
      const bb = box(n);
      out.push({
        kind: "tooltip-frame",
        name: n.name,
        uiType: "Tooltip",
        path: path.join(" > "),
        y: bb ? bb.y : 0,
        x: bb ? bb.x : 0,
        w: bb ? bb.width : 0,
        h: bb ? bb.height : 0,
      });
    }
  }

  if (n.children) {
    for (const ch of n.children) {
      walk(ch, frameBox, skipRootCommon, out, depth + 1, path.concat(ch.name || ""));
    }
  }
}

function collectTooltipTexts(root) {
  const tips = [];
  function r(n) {
    if (!n || isHidden(n)) return;
    const nm = (n.name || "").toLowerCase();
    if (nm.includes("tooltip") && n.type === "FRAME") {
      let full = "";
      function t(x) {
        if (!x) return;
        if (x.type === "TEXT" && x.characters) full += x.characters;
        if (x.children) x.children.forEach(t);
      }
      t(n);
      const bb = box(n);
      tips.push({
        name: n.name,
        text: full.replace(/\s+/g, " ").trim(),
        y: bb ? bb.y : 0,
        x: bb ? bb.x : 0,
      });
    }
    if (n.children) n.children.forEach(r);
  }
  r(root);
  tips.sort((a, b) => a.y - b.y || a.x - b.x);
  return tips;
}

const filePath = process.argv[2];
const root = JSON.parse(fs.readFileSync(filePath, "utf8"));
const frameBox = box(root);
const els = [];
walk(root, frameBox, true, els, 0, [root.name]);

els.sort((a, b) => a.y - b.y || a.x - b.x);

const tooltips = collectTooltipTexts(root);

const summary = { Title: 0, Label: 0, Button: 0, Input: 0, Dropdown: 0, Table: 0, List: 0, Tooltip: 0, Icon: 0, Other: 0 };
for (const e of els) {
  const u = e.uiType;
  if (u === "Title") summary.Title++;
  else if (u === "Label" || u === "Hint/Caption") summary.Label++;
  else if (u === "Button") summary.Button++;
  else if (u === "Input") summary.Input++;
  else if (u === "Dropdown") summary.Dropdown++;
  else if (u === "Table") summary.Table++;
  else if (u === "List") summary.List++;
  else if (u === "Tooltip") summary.Tooltip++;
  else if (u === "Icon") summary.Icon++;
  else summary.Other++;
}

const out = {
  frameName: root.name,
  commonFiltered,
  summary,
  elements: els,
  tooltips,
};
const json = JSON.stringify(out, null, 0);
const outPath = process.argv[3];
if (outPath) {
  require("fs").writeFileSync(outPath, json, "utf8");
} else {
  console.log(json);
}
