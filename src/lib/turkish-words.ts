const ONES = [
  "",
  "Bir",
  "İki",
  "Üç",
  "Dört",
  "Beş",
  "Altı",
  "Yedi",
  "Sekiz",
  "Dokuz",
];

const TENS = [
  "",
  "On",
  "Yirmi",
  "Otuz",
  "Kırk",
  "Elli",
  "Altmış",
  "Yetmiş",
  "Seksen",
  "Doksan",
];

const HUNDREDS = [
  "",
  "Yüz",
  "İkiYüz",
  "ÜçYüz",
  "DörtYüz",
  "BeşYüz",
  "AltıYüz",
  "YediYüz",
  "SekizYüz",
  "DokuzYüz",
];

const SCALES = ["", "Bin", "Milyon", "Milyar", "Trilyon", "Katrilyon"];

/** 0-999 arası sayıyı yazıyla çevirir (yüzler/ondan/birler bitişik yazılır). */
function threeDigitToWords(value: number): string {
  if (value === 0) return "";
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const tens = Math.floor(rest / 10);
  const ones = rest % 10;
  return HUNDREDS[hundreds] + TENS[tens] + ONES[ones];
}

/** Tam sayıyı yazıyla çevirir. Örn: 105960 -> "YüzBeşBin DokuzYüzAltmış" */
export function integerToTurkishWords(value: number): string {
  if (!isFinite(value)) return "";
  const target = Math.floor(Math.abs(value));
  if (target === 0) return "Sıfır";

  const groups: number[] = [];
  let remaining = target;
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    if (group === 0) continue;
    const scale = SCALES[i] ?? "";
    let word = threeDigitToWords(group);
    if (scale) {
      // 1000 -> "Bin" (Türkçede "Bir Bin" denmez)
      word = group === 1 && scale === "Bin" ? "Bin" : word + scale;
    }
    parts.push(word);
  }

  return parts.join(" ");
}

/**
 * Tutarı yazıyla çevirir.
 * Örn: 105960 -> "YüzBeşBin DokuzYüzAltmış Türk Lirası"
 *      105960.45 -> "YüzBeşBin DokuzYüzAltmış Türk Lirası KırkBeş Kuruş"
 */
export function amountToTurkishWords(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "";
  const sign = amount < 0 ? "Eksi " : "";
  const rounded = Math.round(Math.abs(amount) * 100);
  const lira = Math.floor(rounded / 100);
  const kurus = rounded % 100;

  const liraWords = integerToTurkishWords(lira);
  if (kurus === 0) return `${sign}${liraWords} Türk Lirası`;
  return `${sign}${liraWords} Türk Lirası ${threeDigitToWords(kurus)} Kuruş`;
}
