/**
 * Tahsilat Makbuzu dokümanı — paylaşılan işaretleme ve stil.
 * Hem PDF üretimi (src/lib/pdf/receipt-template.ts) hem de canlı önizleme
 * (src/app/receipts/new/ReceiptPreview.tsx) aynı çıktıyı kullanır.
 */

export interface ReceiptCompanyView {
  name: string;
  shortName: string;
  address: string;
  city: string;
  phone: string;
  phone2: string;
  email: string;
  taxOffice: string;
  taxNumber: string;
  logoDataUrl: string | null;
}

export function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Belge üzerinde gösterilen ödeme türü onay kutuları. */
const PAYMENT_CHOICES: { value: string; label: string }[] = [
  { value: "CASH", label: "Nakit" },
  { value: "BANK_TRANSFER", label: "Banka Havalesi" },
  { value: "CREDIT_CARD", label: "Kredi Kartı" },
  { value: "CHECK", label: "Çek" },
];

const ICON_LOCATION =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>';
const ICON_PHONE =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2 11 11 0 0 0 3.5.6 1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1A18.9 18.9 0 0 1 2.7 4.5a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .6 3.5 1 1 0 0 1-.2 1z"/></svg>';
const ICON_MAIL =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 5h20v14H2zm2 2v.5l8 5 8-5V7l-8 5z"/></svg>';
const ICON_DOC =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2h16v20H4zm3 4v2h10V6zm0 4v2h10v-2zm0 4v2h6v-2z"/></svg>';
const ICON_COINS =
  '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><ellipse cx="24" cy="10" rx="14" ry="6" stroke="#4bc4df" stroke-width="3"/><path d="M10 10v8c0 3 6 6 14 6s14-3 14-6v-8M10 18v8c0 3 6 6 14 6s14-3 14-6v-8M10 26v8c0 3 6 6 14 6s14-3 14-6v-8" stroke="#4bc4df" stroke-width="3"/></svg>';

/** Firma logosu (yoksa marka monogramı). */
function renderLogo(company: ReceiptCompanyView): string {
  if (company.logoDataUrl) {
    return `<img class="logo-img" src="${company.logoDataUrl}" alt="" />`;
  }
  const initials = (company.shortName || company.name || "AZ")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return `<div class="logo-fallback">${initials}</div>`;
}

/** Tahsilatı yapanın imzası (calligraphic monogram). */
function renderSignatureGraphic(): string {
  return `
        <svg class="signature-svg" viewBox="0 0 380 480" aria-hidden="true">
          <g fill="none" stroke="#102d48" stroke-linecap="round" stroke-linejoin="round">
            <path d="M58 392 C 26 316, 44 206, 112 118 C 172 40, 268 4, 318 10 C 334 12, 337 23, 325 31"
              stroke-width="3" opacity="0.92" />
            <path d="M322 66 C 309 128, 286 204, 259 268" stroke-width="5.4" opacity="0.95" />
            <path d="M259 268 C 238 322, 214 360, 196 381" stroke-width="2.8" opacity="0.9" />
            <path d="M186 382 C 232 288, 276 180, 318 70" stroke-width="2.6" opacity="0.85" />
            <path d="M92 212 C 160 231, 250 239, 302 244 C 310 292, 268 382, 150 456 C 136 464, 128 471, 139 479"
              stroke-width="3.4" opacity="0.9" />
            <path d="M126 452 C 136 460, 140 468, 136 476" stroke-width="2.2" opacity="0.7" />
          </g>
        </svg>`;
}

/** Etiketli, noktalı yazı satırı. */
function writeRow(
  label: string,
  value: string,
  options: { tall?: boolean; strong?: boolean } = {}
): string {
  return `
        <div class="form-row${options.tall ? " tall" : ""}">
          <div class="field-label">${
            options.strong ? `<strong>${escapeHtml(label)}</strong>` : escapeHtml(label)
          }</div>
          <span class="colon">:</span>
          <div class="write">${escapeHtml(value)}</div>
        </div>`;
}

/** Numaralı bölüm başlığı (koyu gradyan bant + numara kutusu). */
function sectionHeading(num: number, title: string): string {
  return `
      <div class="section-heading">
        <span class="num">${num}</span>
        <h2>${escapeHtml(title)}</h2>
      </div>`;
}

/** Makbuz gövdesi işaretlemesi (paylaşılan). */
export function renderReceiptMarkup(
  receipt: any,
  company: ReceiptCompanyView
): string {
  const method = (receipt.paymentMethod as string) || "";
  const receiptDate = receipt.receiptDate ? new Date(receipt.receiptDate) : new Date();
  const dateText = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(receiptDate);
  const timeText = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(receiptDate);

  const taxText =
    receipt.customerTaxOffice || receipt.customerTaxNumber
      ? `${receipt.customerTaxOffice ? receipt.customerTaxOffice + " / " : ""}${
          receipt.customerTaxNumber || "-"
        }`
      : "-";

  const paymentChoices = PAYMENT_CHOICES.map(
    (choice) => `
            <span class="payment-choice${
              choice.value === method ? " active" : ""
            }"><span class="box"></span>${escapeHtml(choice.label)}</span>`
  ).join("");

  const descriptionParts: string[] = [];
  if (receipt.quoteNumber) descriptionParts.push(`Teklif No: ${receipt.quoteNumber}`);
  if (receipt.description?.trim()) descriptionParts.push(receipt.description.trim());
  if (descriptionParts.length === 0) {
    descriptionParts.push(
      "Yukarıda belirtilen tutar ile tahsil edilmiş olup işbu makbuz düzenlenmiştir."
    );
  }
  const descriptionText = descriptionParts.join(" - ");

  return `
  <main class="sheet">
    <header class="header">
      <section class="company">
        ${renderLogo(company)}
        <div class="company-info">
          <h2 class="company-name">${escapeHtml(company.name)}</h2>
          <div class="meta-line">${ICON_LOCATION}<span>${escapeHtml(
            company.address
              ? `${company.city ? company.city + ", " : ""}${company.address}`
              : "-"
          )}</span></div>
          <div class="meta-line">${ICON_PHONE}<span>${escapeHtml(
            [company.phone, company.phone2].filter(Boolean).join(" / ") || "-"
          )}</span></div>
          <div class="meta-line">${ICON_MAIL}<span>${escapeHtml(company.email || "-")}</span></div>
          <div class="meta-line">${ICON_DOC}<span>${escapeHtml(
            company.taxOffice || company.taxNumber
              ? `${company.taxOffice || "-"} / ${company.taxNumber || "-"}`
              : "-"
          )}</span></div>
        </div>
      </section>

      <div class="title">
        <h1>TAHSİLAT MAKBUZU</h1>
        <div class="title-rule"></div>
        <div class="subtitle">Ödeme / Tahsilat Belgesi</div>
      </div>

      <section class="receipt-meta">
        <div class="meta-row"><strong>Makbuz No:</strong><span class="value">${escapeHtml(
          receipt.receiptNumber || "TS-…"
        )}</span></div>
        <div class="meta-row"><strong>Tarih:</strong><span class="value">${dateText}</span></div>
        <div class="meta-row"><strong>Saat:</strong><span class="value">${timeText}</span></div>
      </section>
    </header>

    <section class="section">
      ${sectionHeading(1, "Tahsil Edilen Kişi / Firma")}
      <div class="section-body">
        ${writeRow("Ad Soyad / Firma Ünvanı", receipt.customerName || "-")}
        ${writeRow("T.C. / Vergi No", taxText)}
        ${writeRow("Telefon", receipt.customerPhone || "-")}
        ${writeRow("Adres", receipt.customerAddress || "-", { tall: true })}
      </div>
    </section>

    <section class="section">
      ${sectionHeading(2, "Tahsilat Bilgileri")}
      <div class="section-body">
        ${writeRow("Tahsilat Tutarı", formatAmount(receipt.amount))}
        ${writeRow("Yazı ile", receipt.amountInWords || "-")}
        <div class="form-row">
          <div class="field-label"><strong>Ödeme Türü</strong></div>
          <span class="colon">:</span>
          <div class="payment-options">${paymentChoices}</div>
        </div>
        ${writeRow("Banka / Hesap Bilgisi", receipt.bankInfo || "-")}
        ${writeRow("Açıklama", descriptionText, { tall: true })}
      </div>
    </section>

    <section class="amount-banner">
      <div class="amount-label">${ICON_COINS}<strong>Tahsil Edilen Tutar</strong></div>
      <div class="amount-value">
        <span class="currency">₺</span>
        <span class="amount">${formatAmount(receipt.amount).replace(/\s*₺\s*$/, "")}</span>
      </div>
    </section>

    <footer class="signatures">
      <div class="signature">
        <strong>Tahsil Eden</strong>
        <div class="sign-holder">
          ${renderSignatureGraphic()}
          <div class="sign-name">${escapeHtml(receipt.preparedByName || "-")}</div>
        </div>
        <div class="sign-line"></div>
      </div>
      <div class="signature">
        <strong>Teslim Eden / Ödeyen</strong>
        <div class="sign-holder">
          <div class="sign-name">${escapeHtml(receipt.customerName || "-")}</div>
        </div>
        <div class="sign-line"></div>
      </div>
      <div class="signature">
        <strong>Onay</strong>
        <div class="sign-holder"></div>
        <div class="sign-line"></div>
      </div>
      <div class="signature">
        <div class="stamp">Kaşe / İmza</div>
      </div>
    </footer>

    <div class="bottom">
      <p>&#9636; &nbsp;Bu makbuz ilgili tahsilat işlemi için düzenlenmiştir.</p>
      <div class="bottom-rule"></div>
      <div class="notes">
        <strong>Ek Notlar:</strong>
        <span class="notes-value">${escapeHtml(receipt.extraNotes || "")}</span>
      </div>
    </div>
  </main>`;
}

/** "1.234,56 ₺" biçiminde tutar. */
function formatAmount(amount: number | null | undefined): string {
  const value = amount ?? 0;
  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isFinite(value) ? value : 0);
  return `${formatted} ₺`;
}

/** Makbuz dokümanı için ortak stil (A5 yatay ölçüler). */
export function receiptStyles(): string {
  return `
  :root {
    --navy: #102d48;
    --blue: #157f9a;
    --pale: #edf2f6;
    --line: #b7c7d2;
    --ink: #172d43;
    --muted: #53677a;
    --doc-font: "Noto Sans", "Segoe UI", system-ui, sans-serif;
  }

  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

  @page { size: A5 landscape; margin: 0; }

  html, body { margin: 0; padding: 0; }

  body {
    width: 210mm;
    height: 148mm;
    overflow: hidden;
    color: var(--ink);
    background: #ffffff;
    font-family: var(--doc-font);
    font-size: 8pt;
    line-height: 1.3;
    font-variant-numeric: tabular-nums;
  }

  .sheet {
    width: 210mm;
    height: 148mm;
    padding: 4mm 5mm 3mm;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 1.6mm;
  }

  /* ---------- HEADER ---------- */
  .header {
    min-height: 24mm;
    display: grid;
    grid-template-columns: 1.02fr 1.12fr 0.78fr;
    align-items: center;
    gap: 3mm;
  }

  .company {
    display: grid;
    grid-template-columns: 16mm 1fr;
    gap: 2mm;
    align-items: center;
    min-width: 0;
  }

  .logo-img,
  .logo-fallback {
    width: 15mm;
    height: 16mm;
    object-fit: contain;
    display: block;
  }

  .logo-fallback {
    background: linear-gradient(135deg, #102d48, #157f9a);
    border-radius: 2mm;
    color: #ffffff;
    font-size: 15px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    line-height: 1;
  }

  .company-info { min-width: 0; }

  .company-name {
    margin: 0 0 1.5mm;
    font-size: 14px;
    line-height: 1.05;
    max-height: 8mm;
    overflow: hidden;
    font-weight: 800;
    letter-spacing: 0.015em;
    text-transform: uppercase;
    color: var(--navy);
  }

  .meta-line {
    display: flex;
    align-items: center;
    gap: 1mm;
    margin: 0.6mm 0;
    color: #31485e;
    font-size: 7px;
    line-height: 1.15;
  }

  .meta-line svg {
    width: 2.5mm;
    height: 2.5mm;
    flex: 0 0 2.5mm;
    fill: var(--navy);
  }

  .meta-line span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .title {
    text-align: center;
    border-left: 1px solid #94aabc;
    border-right: 1px solid #94aabc;
    padding: 0 3mm;
  }

  .title h1 {
    margin: 0;
    font-size: 19px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: 0.02em;
    color: var(--navy);
    white-space: nowrap;
  }

  .title-rule {
    width: 58mm;
    max-width: 90%;
    height: 0.7mm;
    margin: 2mm auto 1.5mm;
    border-radius: 3mm;
    background: var(--blue);
  }

  .subtitle {
    color: #344b62;
    font-size: 13px;
  }

  .receipt-meta {
    padding: 1mm 2mm;
    border-radius: 2mm;
    background: var(--pale);
  }

  .receipt-meta .meta-row {
    min-height: 6mm;
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 2mm;
    padding: 1.3mm 0;
    border-bottom: 1px solid #c5d1da;
    font-size: 8px;
    color: var(--ink);
  }

  .receipt-meta .meta-row:last-child { border: 0; }

  .meta-row strong { white-space: nowrap; color: var(--navy); }

  .meta-row .value {
    text-align: right;
    font-weight: 600;
    font-size: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ---------- SECTIONS ---------- */
  .section { min-width: 0; }

  .section-heading {
    height: 6mm;
    overflow: hidden;
    display: flex;
    align-items: center;
    border-radius: 1.5mm;
    background: linear-gradient(110deg, var(--navy) 0 44%, #d5dfe6 44.15% 100%);
    color: #ffffff;
  }

  .section-heading .num {
    width: 8mm;
    height: 100%;
    display: grid;
    place-items: center;
    border-right: 1px solid #81a5b9;
    background: linear-gradient(135deg, #0e7898, var(--navy));
    font-size: 12px;
    font-weight: 700;
  }

  .section-heading h2 {
    margin: 0 0 0 4mm;
    font-size: 10px;
    line-height: 1;
    font-weight: 700;
  }

  .section-body {
    margin-top: 0.7mm;
    padding: 0.8mm 1.7mm;
    border: 1px solid var(--line);
    border-radius: 1.5mm;
  }

  .form-row {
    min-height: 4.7mm;
    display: grid;
    grid-template-columns: 43mm 3mm minmax(0, 1fr);
    align-items: center;
    gap: 1.5mm;
  }

  .form-row.tall { min-height: 5.5mm; align-items: start; }

  .field-label {
    min-height: 4mm;
    padding: 0.5mm 2mm;
    display: flex;
    align-items: center;
    border-radius: 1mm;
    background: var(--pale);
    font-size: 8px;
    font-weight: 700;
    color: var(--navy);
  }

  .colon { color: var(--navy); font-weight: 700; font-size: 8px; }

  .write {
    min-width: 0;
    min-height: 3.6mm;
    border-bottom: 1px dotted #506a80;
    padding: 0 1mm;
    color: var(--ink);
    font-size: 8px;
    line-height: 1.35;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .form-row.tall .write { white-space: normal; line-height: 1.3; }

  .payment-options {
    display: flex;
    align-items: center;
    gap: 3mm;
    min-width: 0;
    min-height: 4mm;
  }

  .payment-choice {
    display: flex;
    align-items: center;
    gap: 1mm;
    white-space: nowrap;
    font-size: 8px;
    color: var(--muted);
  }

  .payment-choice.active {
    color: var(--navy);
    font-weight: 700;
  }

  .payment-choice .box {
    width: 3mm;
    height: 3mm;
    border: 1px solid #6d8798;
    border-radius: 0.6mm;
    display: inline-block;
    position: relative;
    background: #ffffff;
  }

  .payment-choice.active .box {
    background: var(--blue);
    border-color: var(--blue);
  }

  .payment-choice.active .box::after {
    content: "";
    position: absolute;
    left: 0.9mm;
    top: 0.4mm;
    width: 0.9mm;
    height: 1.6mm;
    border: solid #ffffff;
    border-width: 0 0.5mm 0.5mm 0;
    transform: rotate(45deg);
  }

  /* ---------- TUTAR BANNER ---------- */
  .amount-banner {
    min-height: 13mm;
    display: grid;
    grid-template-columns: 38% 62%;
    overflow: hidden;
    border-radius: 2mm;
    background: #e9f5f8;
  }

  .amount-label {
    display: flex;
    align-items: center;
    gap: 3mm;
    padding: 1mm 4mm;
    background: linear-gradient(110deg, #0f3855 0 92%, transparent 92.3%);
    color: #ffffff;
  }

  .amount-label svg {
    width: 9mm;
    height: 9mm;
    flex: 0 0 9mm;
  }

  .amount-label strong {
    font-size: 15px;
    white-space: nowrap;
    font-weight: 800;
  }

  .amount-value {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3mm;
    padding: 1mm 8mm 1mm 0;
    color: var(--navy);
  }

  .amount-value .currency {
    font-size: 20px;
    font-weight: 700;
  }

  .amount-value .amount {
    font-size: 23px;
    font-weight: 700;
    border-bottom: 1px dotted #93acba;
    padding: 0 2mm 0.5mm;
    line-height: 1.1;
  }

  /* ---------- İMZA ---------- */
  .signatures {
    min-height: 19mm;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    align-items: stretch;
    padding: 1mm;
    border: 1px solid var(--line);
    border-radius: 1.5mm;
  }

  .signature {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 0.5mm 2mm;
    border-right: 1px solid #c5d1da;
    overflow: hidden;
  }

  .signature:last-child { border: 0; }

  .signature strong {
    font-size: 8px;
    color: var(--navy);
    text-align: center;
  }

  .signature .sign-holder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
  }

  .signature-svg {
    width: 8mm;
    height: 5.5mm;
    display: block;
  }

  .signature .sign-name {
    font-size: 6.5px;
    color: #31485e;
    text-align: center;
    line-height: 1.15;
    margin-top: 0.5mm;
  }

  .signature .sign-line {
    width: 100%;
    height: 5mm;
    border-bottom: 1px solid #8298a9;
  }

  .stamp {
    min-height: 15mm;
    width: 100%;
    display: grid;
    place-items: center;
    border: 1px dotted #94aabc;
    border-radius: 1mm;
    color: var(--muted);
    font-size: 9px;
  }

  /* ---------- ALT BİLGİ ---------- */
  .bottom {
    display: grid;
    grid-template-columns: auto 1fr auto 1.25fr;
    gap: 2mm;
    align-items: center;
    color: #334b62;
    font-size: 7px;
  }

  .bottom p { margin: 0; }

  .bottom-rule { height: 1px; background: #b7c7d2; }

  .notes {
    display: flex;
    gap: 2mm;
    align-items: center;
    white-space: nowrap;
    color: #334b62;
  }

  .notes-value {
    width: 42mm;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    border-bottom: 1px dotted #506a80;
    padding: 0 1mm;
  }`;
}

/** Tam HTML dokümanı (PDF ve önizleme). */
export function receiptDocumentHtml(options: {
  markup: string;
  fontCss?: string;
  fontOverride?: string;
  title?: string;
}): string {
  const styles = receiptStyles();
  const fontBlock = options.fontCss ? `${options.fontCss}\n${styles}` : styles;
  const fontOverride = options.fontOverride
    ? `body { font-family: ${options.fontOverride}; }`
    : "";

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(options.title || "Tahsilat Makbuzu")}</title>
<style>
  ${fontBlock}
  ${fontOverride}
</style>
</head>
<body>
${options.markup}
</body>
</html>`;
}
