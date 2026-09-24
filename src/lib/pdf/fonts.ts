import { readFileSync } from "fs";
import path from "path";

// Must stay in sync with outputFileTracingIncludes in next.config.ts.
const FONT_DIR = path.join(process.cwd(), "src/lib/pdf/fonts");

export const PDF_FONT_FAMILY = `"Noto Sans PDF", "DejaVu Sans", sans-serif`;

let cachedCss: string | null = null;

function fontFace(file: string, unicodeRange: string): string {
  const base64 = readFileSync(path.join(FONT_DIR, file)).toString("base64");
  return `@font-face {
    font-family: "Noto Sans PDF";
    font-style: normal;
    font-weight: 100 900;
    font-display: block;
    src: url(data:font/woff2;base64,${base64}) format("woff2");
    unicode-range: ${unicodeRange};
  }`;
}

/** Embedded Noto Sans faces; the latin-ext subset carries ₺ (U+20BA) and Turkish letters. */
export function pdfFontFaceCss(): string {
  if (cachedCss) return cachedCss;
  cachedCss = [
    fontFace(
      "noto-sans-latin-ext-wght-normal.woff2",
      "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    ),
    fontFace(
      "noto-sans-latin-wght-normal.woff2",
      "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    ),
  ].join("\n");
  return cachedCss;
}
