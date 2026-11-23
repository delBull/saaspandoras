/**
 * PDF del acuerdo, generado en el servidor **sin dependencias**.
 *
 * ¿Por qué no `window.print()`? Porque el resultado depende del diálogo del
 * navegador (papel, escala, zoom del documento) y en el Deal Room —que vive en
 * `position: fixed` con `overflow: hidden`— imprimía recortado.
 *
 * Aquí el documento se compone con medidas reales: carta (612×792 pt), márgenes
 * de 2 cm, saltos de página y numeración propios. Se escribe el PDF a mano
 * (fuentes estándar Helvetica / Helvetica-Bold, WinAnsi) para no agregar
 * dependencias al build.
 */

const PAGE_WIDTH = 612; // 8.5 in
const PAGE_HEIGHT = 792; // 11 in
const MARGIN = 56.7; // 2 cm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BODY_SIZE = 10;
const LEADING = 14;

/** Anchos Helvetica (unidades/1000 em) para ASCII imprimible. */
const HELVETICA: Record<string, number> = {
  " ": 278, "!": 278, '"': 355, "#": 556, $: 556, "%": 889, "&": 667, "'": 191,
  "(": 333, ")": 333, "*": 389, "+": 584, ",": 278, "-": 333, ".": 278, "/": 278,
  "0": 556, "1": 556, "2": 556, "3": 556, "4": 556, "5": 556, "6": 556, "7": 556, "8": 556, "9": 556,
  ":": 278, ";": 278, "<": 584, "=": 584, ">": 584, "?": 556, "@": 1015,
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 500,
  K: 667, L: 556, M: 833, N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611,
  U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
  "[": 278, "\\": 278, "]": 278, "^": 469, _: 556, "`": 333,
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222,
  k: 500, l: 222, m: 833, n: 556, o: 556, p: 556, q: 556, r: 333, s: 500, t: 278,
  u: 556, v: 500, w: 722, x: 500, y: 500, z: 500,
  "{": 334, "|": 260, "}": 334, "~": 584,
};

/** Anchos Helvetica-Bold (sólo los que difieren). */
const HELVETICA_BOLD: Record<string, number> = {
  ...HELVETICA,
  A: 722, B: 722, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 556,
  K: 722, L: 611, M: 833, N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611,
  U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
  a: 556, b: 611, c: 556, d: 611, e: 556, f: 333, g: 611, h: 611, i: 278, j: 278,
  k: 556, l: 278, m: 889, n: 611, o: 611, p: 611, q: 611, r: 389, s: 556, t: 333,
  u: 611, v: 556, w: 778, x: 556, y: 556, z: 500, "&": 722, "@": 975, "%": 889,
  "(": 333, ")": 333, ",": 278, ".": 278, "-": 333, ":": 333, ";": 333, "/": 278,
  "'": 238, '"': 474, _: 556, "*": 389, "+": 584, "=": 584, "[": 333, "]": 333,
  "\\": 278, "|": 280, "~": 584,
};

/** Acentos: se miden con el ancho de su letra base (conservador). */
const BASE_LETTER: Record<string, string> = {
  á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u", ñ: "n",
  Á: "A", É: "E", Í: "I", Ó: "O", Ú: "U", Ü: "U", Ñ: "N",
  "¿": "?", "¡": "!", "º": "o", "ª": "a",
};

/** Unicode → byte WinAnsi. */
const WIN_ANSI: Record<string, number> = {
  á: 0xe1, é: 0xe9, í: 0xed, ó: 0xf3, ú: 0xfa, ü: 0xfc, ñ: 0xf1,
  Á: 0xc1, É: 0xc9, Í: 0xcd, Ó: 0xd3, Ú: 0xda, Ü: 0xdc, Ñ: 0xd1,
  "¿": 0xbf, "¡": 0xa1, "º": 0xba, "ª": 0xaa,
  "–": 0x96, "—": 0x97, "“": 0x93, "”": 0x94, "‘": 0x91, "’": 0x92,
  "…": 0x85, "•": 0x95, "€": 0x80,
};

function encodeWinAnsi(text: string): string {
  let out = "";
  for (const char of Array.from(text)) {
    const mapped = WIN_ANSI[char];
    if (mapped !== undefined) out += String.fromCharCode(mapped);
    else if (char.charCodeAt(0) < 256) out += char;
    else out += "?";
  }
  return out;
}

function escapePdf(text: string): string {
  return encodeWinAnsi(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[\r\n\t]/g, " ");
}

function measure(text: string, size: number, bold: boolean): number {
  const table = bold ? HELVETICA_BOLD : HELVETICA;
  let units = 0;
  for (const char of Array.from(text)) {
    const base = BASE_LETTER[char] ?? char;
    units += table[base] ?? table[char] ?? 556;
  }
  // 3 % de holgura: mejor que sobre a que recorte.
  return (units / 1000) * size * 1.03;
}

function wrap(text: string, size: number, bold: boolean, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measure(candidate, size, bold) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = "";

    if (measure(word, size, bold) > maxWidth) {
      let chunk = "";
      for (const char of Array.from(word)) {
        if (measure(chunk + char, size, bold) > maxWidth) {
          lines.push(chunk);
          chunk = char;
        } else {
          chunk += char;
        }
      }
      current = chunk;
    } else {
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

interface TextOp {
  x: number;
  y: number;
  size: number;
  bold: boolean;
  color: [number, number, number];
  text: string;
}

interface LineOp {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  color: [number, number, number];
}

class Page {
  texts: TextOp[] = [];
  lines: LineOp[] = [];

  text(op: TextOp) {
    this.texts.push(op);
  }

  line(op: LineOp) {
    this.lines.push(op);
  }

  content(): string {
    const parts: string[] = [];
    for (const line of this.lines) {
      const [r, g, b] = line.color;
      parts.push(
        `${r} ${g} ${b} RG ${line.width} w ${line.x1.toFixed(2)} ${line.y1.toFixed(2)} m ${line.x2.toFixed(2)} ${line.y2.toFixed(2)} l S`,
      );
    }
    for (const op of this.texts) {
      const [r, g, b] = op.color;
      const font = op.bold ? "F2" : "F1";
      parts.push(
        [
          "BT",
          `/${font} ${op.size} Tf`,
          `${r} ${g} ${b} rg`,
          `1 0 0 1 ${op.x.toFixed(2)} ${op.y.toFixed(2)} Tm`,
          `(${escapePdf(op.text)}) Tj`,
          "ET",
        ].join(" "),
      );
    }
    return parts.join("\n");
  }
}

const INK: [number, number, number] = [0.09, 0.09, 0.11];
const MUTED: [number, number, number] = [0.42, 0.44, 0.5];
const RULE: [number, number, number] = [0.8, 0.81, 0.84];

function stripMarkdown(value: string): string {
  return value
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function isHeading(text: string): boolean {
  if (/^\d{1,2}\.\s/.test(text) || /^\d{1,2}\.\d{1,2}\s/.test(text)) return true;
  const letters = text.replace(/[^A-Za-zÁÉÍÓÚÑ]/g, "");
  return letters.length > 3 && letters === letters.toUpperCase() && text.length < 140;
}

export interface BuildNdaPdfInput {
  title: string;
  subtitle: string;
  version: string;
  dealId: string;
  counterparty: string;
  fullText: string;
}

function serialize(pages: Page[]): Uint8Array {
  // 1 catalog · 2 pages · 3/4 fuentes · después pares (page, content)
  const kids = pages.map((_, index) => `${5 + index * 2} 0 R`).join(" ");
  const objects: string[] = [];

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

  pages.forEach((page) => {
    const content = page.content();
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${objects.length + 2} 0 R >>`,
    );
    objects.push(`<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`);
  });

  let pdf = "%PDF-1.4\n%\u00E2\u00E3\u00CF\u00D3\n";
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return new Uint8Array(Buffer.from(pdf, "latin1"));
}

export async function buildNdaPdf(input: BuildNdaPdfInput): Promise<Uint8Array> {
  const pages: Page[] = [];
  let page = new Page();
  pages.push(page);
  let y = PAGE_HEIGHT - MARGIN;

  const newPage = () => {
    page = new Page();
    pages.push(page);
    y = PAGE_HEIGHT - MARGIN;
  };

  const ensure = (needed: number) => {
    if (y - needed < MARGIN) newPage();
  };

  // ── Encabezado ────────────────────────────────────────────────────────────
  page.text({ x: MARGIN, y, size: 8, bold: true, color: MUTED, text: "PANDORA'S · AZTECAZ" });
  y -= 20;

  for (const line of wrap(input.title, 15, true, CONTENT_WIDTH)) {
    page.text({ x: MARGIN, y, size: 15, bold: true, color: INK, text: line });
    y -= 19;
  }
  for (const line of wrap(input.subtitle, 9.5, false, CONTENT_WIDTH)) {
    page.text({ x: MARGIN, y, size: 9.5, bold: false, color: MUTED, text: line });
    y -= 12;
  }

  y -= 4;
  page.text({
    x: MARGIN,
    y,
    size: 8.5,
    bold: false,
    color: MUTED,
    text: `Deal: ${input.dealId}   ·   Versión: ${input.version}   ·   Contraparte: ${input.counterparty}`,
  });
  y -= 10;
  page.line({ x1: MARGIN, y1: y, x2: PAGE_WIDTH - MARGIN, y2: y, width: 0.7, color: RULE });
  y -= 16;

  // ── Cuerpo ────────────────────────────────────────────────────────────────
  for (const rawLine of input.fullText.split(/\r?\n/)) {
    const raw = rawLine.trim();
    const text = stripMarkdown(rawLine).replace(/\s+$/g, "");
    if (!text) {
      y -= 6;
      continue;
    }

    // Título declarado en markdown (`## Sección` o `**Título**`).
    const markdownHeading = /^#{1,6}\s/.test(raw) || /^\*\*[^*].*\*\*$/.test(raw);
    const bold = markdownHeading || isHeading(text);
    const size = bold ? 10.5 : BODY_SIZE;
    if (bold) y -= 12;

    const lines = wrap(text, size, bold, CONTENT_WIDTH);
    for (let index = 0; index < lines.length; index += 1) {
      const remaining = lines.length - index;
      const spaceLeft = Math.max(0, Math.floor((y - MARGIN) / LEADING));

      // Control de viudas/huérfanas: no dejar una sola línea al final de una
      // página ni las dos últimas líneas separadas entre páginas.
      if (remaining === 2 && spaceLeft < 2) newPage();
      if (remaining > 2 && spaceLeft < 2 && index === 0) newPage();

      // Un título no debe quedar solo al pie de página.
      ensure(bold ? LEADING * 2 : LEADING);
      page.text({ x: MARGIN, y, size, bold, color: INK, text: lines[index]! });
      y -= LEADING;
    }
    y -= bold ? 4 : 2;
  }

  // ── Pie de página ─────────────────────────────────────────────────────────
  const total = pages.length;
  pages.forEach((current, index) => {
    current.line({ x1: MARGIN, y1: MARGIN - 12, x2: PAGE_WIDTH - MARGIN, y2: MARGIN - 12, width: 0.5, color: RULE });
    current.text({
      x: MARGIN,
      y: MARGIN - 24,
      size: 7.5,
      bold: false,
      color: MUTED,
      text: `Documento generado desde el Deal Room de Nexus · ${input.dealId} · ${input.version}`,
    });
    const label = `Página ${index + 1} de ${total}`;
    current.text({
      x: PAGE_WIDTH - MARGIN - measure(label, 7.5, false),
      y: MARGIN - 24,
      size: 7.5,
      bold: false,
      color: MUTED,
      text: label,
    });
  });

  return serialize(pages);
}
