import { formatCurrency, formatDate } from "@/lib/formatters";
import { PDF_FONT_FAMILY, pdfFontFaceCss } from "./fonts";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_SENTENCE } from "@/lib/payment-methods";
import type { CompanySettingsForPdf } from "./generator";

/**
 * Tahsilat Makbuzu — A5 yatay (210 x 148 mm) HTML şablonu.
 * Örnek tasarım referansı: Tahsilat_Makbuzu_TS-0098.pdf
 */

function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderLogo(company: CompanySettingsForPdf): string {
  if (company.logoDataUrl) {
    return `<img src="${company.logoDataUrl}" style="height: 46px; max-width: 52px; object-fit: contain; display: block;" alt="Logo" />`;
  }
  const initials = (company.shortName || company.name || "AZ")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return `<div style="width: 42px; height: 42px; background: linear-gradient(135deg, #1e4b93, #2d60b0); border-radius: 8px; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800; letter-spacing: 0.5px;">${initials}</div>`;
}

/**
 * Tahsilatı yapan taraf için paraf (initial) imzası.
 * Kaşe alanının üstünde el yazısı görünümlü imza çizgisi ve parafçı adı yer alır.
 */
function renderParafSignature(parapName: string): string {
  return `
    <div style="display: table; width: 100%; margin-top: 6px;">
      <div style="display: table-cell; width: 64%; vertical-align: bottom;">
        <span style="font-size: 7px; font-weight: 800; letter-spacing: 0.7px; color: #64748b; text-transform: uppercase;">Paraf</span>
        <svg width="116" height="28" viewBox="0 0 116 28" style="display: block; margin-top: 1px;">
          <path d="M5 22 C 13 5, 24 3, 26 13 C 28 23, 18 26, 16 18 C 14 10, 27 5, 39 13 C 47 19, 41 25, 45 19 C 51 8, 61 6, 63 14 C 65 22, 56 25, 56 16 C 56 8, 70 6, 80 14 C 86 20, 82 23, 86 18 C 92 8, 103 10, 111 14"
            fill="none" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" />
          <path d="M28 25 C 42 21, 58 22, 74 20" fill="none" stroke="#0f172a" stroke-width="0.9" stroke-linecap="round" opacity="0.45" />
        </svg>
        <div style="font-size: 7.5px; font-weight: 700; color: #334155; margin-top: -3px;">${escapeHtml(parapName || "-")}</div>
      </div>
      <div style="display: table-cell; width: 36%; vertical-align: bottom; padding-left: 10px;">
        <span style="font-size: 7px; font-weight: 800; letter-spacing: 0.7px; color: #64748b; text-transform: uppercase;">Tarih</span>
        <div style="border-bottom: 1px dashed #94a3b8; height: 16px;"></div>
      </div>
    </div>`;
}

/**
 * İmza bloğu. Tahsilatı yapan tarafta ek olarak paraf imzası alanı bulunur.
 */
function renderSignatureBlock(options: {
  title: string;
  partyName: string;
  partyDetail: string;
  withParap?: boolean;
  parapName?: string;
}): string {
  const { title, partyName, partyDetail, withParap = false, parapName = "" } = options;

  const parapField = withParap ? renderParafSignature(parapName) : "";

  return `
  <td style="width: 50%; vertical-align: top; padding: 0 5px 0 0;">
    <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
      <div style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1; padding: 5px 10px; display: table; width: 100%;">
        <span style="display: table-cell; font-size: 7.5px; font-weight: 800; letter-spacing: 0.8px; color: #334155; text-transform: uppercase;">${title}</span>
        <span style="display: table-cell; text-align: right; font-size: 7px; font-weight: 700; letter-spacing: 0.6px; color: #94a3b8; text-transform: uppercase;">${
          withParap ? "Kaşe ve Paraf" : "Kaşe / İmza"
        }</span>
      </div>
      <div style="padding: 8px 10px 4px 10px;">
        <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; line-height: 1.35; text-transform: uppercase;">${escapeHtml(partyName)}</div>
        ${partyDetail ? `<div style="font-size: 8px; color: #64748b; margin-top: 2px; line-height: 1.4;">${escapeHtml(partyDetail)}</div>` : ""}
        ${parapField}
        <div style="height: ${withParap ? "12px" : "26px"};"></div>
        <div style="border-top: 1px dashed #94a3b8; padding-top: 4px; text-align: center;">
          <span style="font-size: 7.5px; color: #94a3b8; letter-spacing: 0.5px;">Kaşe / İmza</span>
        </div>
      </div>
    </div>
  </td>`;
}

export function renderReceiptTemplate(
  receipt: any,
  company: CompanySettingsForPdf
): string {
  const method = receipt.paymentMethod as string;
  const methodLabel = PAYMENT_METHOD_LABELS[method] ?? method;
  const methodSentence =
    PAYMENT_METHOD_SENTENCE[method] ?? methodLabel.toLowerCase();

  const customerDetailParts = [
    receipt.customerTaxOffice || receipt.customerTaxNumber
      ? `V.D.: ${receipt.customerTaxOffice || "-"} / ${receipt.customerTaxNumber || "-"}`
      : "",
    receipt.customerPhone ? `Tel: ${receipt.customerPhone}` : "",
    receipt.customerEmail ? `E-posta: ${receipt.customerEmail}` : "",
  ].filter(Boolean);

  const companyDetailParts = [
    company.address,
    company.taxOffice || company.taxNumber
      ? `V.D.: ${company.taxOffice || "-"} / ${company.taxNumber || "-"}`
      : "",
    company.website,
  ].filter(Boolean);

  const descriptionText = receipt.description
    ? escapeHtml(receipt.description)
    : `Yukarıda belirtilen tutar ${methodSentence} ile tahsil edilmiş olup işbu makbuz düzenlenmiştir.`;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(receipt.receiptNumber)}</title>
<style>
  ${pdfFontFaceCss()}
  @page { size: A5 landscape; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { height: 100%; }
  body {
    font-family: ${PDF_FONT_FAMILY};
    margin: 0;
    padding: 9mm 10mm 8mm 10mm;
    color: #0f172a;
    background: #ffffff;
    font-size: 9px;
    line-height: 1.4;
    font-variant-numeric: tabular-nums;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 100vh;
  }
  table { border-collapse: collapse; width: 100%; }
  .cell-label {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    padding: 5px 8px;
    font-size: 7.5px;
    font-weight: 800;
    letter-spacing: 0.7px;
    color: #475569;
    text-transform: uppercase;
    width: 16%;
    white-space: nowrap;
  }
  .cell-value {
    border: 1px solid #cbd5e1;
    padding: 5px 8px;
    font-size: 9.5px;
    font-weight: 700;
    color: #0f172a;
    vertical-align: middle;
  }
</style>
</head>
<body>

<!-- HEADER -->
<div style="border-bottom: 2px solid #1e4b93; padding-bottom: 7px; margin-bottom: 9px;">
  <table>
    <tr>
      <!-- Logo + Company -->
      <td style="vertical-align: top; width: 42%;">
        <div style="display: table; width: 100%;">
          <div style="display: table-cell; vertical-align: top; width: 48px;">
            ${renderLogo(company)}
          </div>
          <div style="display: table-cell; vertical-align: top; padding-left: 9px;">
            <div style="font-size: 9.5px; font-weight: 900; color: #0f172a; line-height: 1.25; text-transform: uppercase;">${escapeHtml(company.name)}</div>
            ${
              company.tagline
                ? `<div style="font-size: 7.5px; font-weight: 700; color: #1e4b93; letter-spacing: 0.6px; margin-top: 2px; text-transform: uppercase;">${escapeHtml(company.tagline)}</div>`
                : ""
            }
            <div style="font-size: 7.5px; color: #64748b; margin-top: 3px; line-height: 1.5;">
              ${[
                company.address ? `${company.city ? company.city + ", " : ""}${company.address}` : "",
                company.taxOffice || company.taxNumber
                  ? `V.D.: ${company.taxOffice || "-"} / ${company.taxNumber || "-"}`
                  : "",
                [company.phone, company.email].filter(Boolean).join(" • "),
                company.website,
              ]
                .filter(Boolean)
                .map((line) => `<div>${escapeHtml(line)}</div>`)
                .join("")}
            </div>
          </div>
        </div>
      </td>

      <!-- Document identity -->
      <td style="vertical-align: top; text-align: right; width: 58%;">
        <div style="display: inline-block; text-align: left; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; min-width: 205px;">
          <div style="background: #1e4b93; padding: 5px 10px;">
            <span style="font-size: 8.5px; font-weight: 900; letter-spacing: 1.1px; color: #ffffff; text-transform: uppercase;">Tahsilat Makbuzu</span>
          </div>
          <table>
            <tr>
              <td style="padding: 5px 10px; border-bottom: 1px solid #f1f5f9; width: 52%;">
                <span style="font-size: 7.5px; font-weight: 700; letter-spacing: 0.6px; color: #64748b; text-transform: uppercase;">Belge No</span>
                <div style="font-size: 10px; font-weight: 900; color: #1e4b93; letter-spacing: 0.3px; margin-top: 1px;">${escapeHtml(receipt.receiptNumber)}</div>
              </td>
              <td style="padding: 5px 10px; border-bottom: 1px solid #f1f5f9; border-left: 1px solid #f1f5f9; width: 48%;">
                <span style="font-size: 7.5px; font-weight: 700; letter-spacing: 0.6px; color: #64748b; text-transform: uppercase;">Makbuz Tarihi</span>
                <div style="font-size: 10px; font-weight: 800; color: #0f172a; margin-top: 1px;">${formatDate(receipt.receiptDate)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 10px;">
                <span style="font-size: 7.5px; font-weight: 700; letter-spacing: 0.6px; color: #64748b; text-transform: uppercase;">Düzenleyen</span>
                <div style="font-size: 9px; font-weight: 700; color: #0f172a; margin-top: 1px;">${escapeHtml(receipt.preparedByName || "-")}</div>
              </td>
              <td style="padding: 5px 10px; border-left: 1px solid #f1f5f9;">
                <span style="font-size: 7.5px; font-weight: 700; letter-spacing: 0.6px; color: #64748b; text-transform: uppercase;">Ödeme Şekli</span>
                <div style="font-size: 9px; font-weight: 700; color: #0f172a; margin-top: 1px;">${escapeHtml(methodLabel)}</div>
              </td>
            </tr>
          </table>
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 4px 10px; font-size: 7.5px; color: #475569;">
            <span style="font-weight: 700; letter-spacing: 0.5px;">BELGE TÜRÜ:</span> Tahsilat Makbuzu
            &nbsp;•&nbsp; <span style="font-weight: 700; letter-spacing: 0.5px;">PARA BİRİMİ:</span> TRY (₺)
          </div>
        </div>
      </td>
    </tr>
  </table>
</div>

<!-- INFO GRID -->
<table style="margin-bottom: 9px;">
  <tr>
    <td class="cell-label">Tahsilatı Yapan Firma</td>
    <td class="cell-value" style="width: 34%; text-transform: uppercase;">${escapeHtml(company.name)}</td>
    <td class="cell-label">Tahsilat Alınan Firma</td>
    <td class="cell-value" style="text-transform: uppercase;">${escapeHtml(receipt.customerName)}</td>
  </tr>
  <tr>
    <td class="cell-label">Ödeme Şekli</td>
    <td class="cell-value" style="width: 34%;">${escapeHtml(methodLabel)}</td>
    <td class="cell-label">Tahsilat Tarihi</td>
    <td class="cell-value;">${formatDate(receipt.receiptDate)}</td>
  </tr>
  <tr>
    <td class="cell-label">Tutar</td>
    <td class="cell-value" style="width: 34%; font-size: 11.5px; font-weight: 900; color: #1e4b93;">${formatCurrency(receipt.amount)}</td>
    <td class="cell-label">Yazıyla</td>
    <td class="cell-value;">${escapeHtml(receipt.amountInWords)}</td>
  </tr>
</table>

<!-- DESCRIPTION -->
<div style="border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 5px; padding: 7px 11px; margin-bottom: 9px;">
  <div style="font-size: 8.5px; color: #334155; line-height: 1.45;">${descriptionText}</div>
  ${
    receipt.quoteNumber
      ? `<div style="font-size: 8px; color: #64748b; margin-top: 4px;">İlgili Teklif: <span style="font-weight: 700; color: #1e4b93;">${escapeHtml(receipt.quoteNumber)}</span>${receipt.quoteTotalAmount ? ` &nbsp;•&nbsp; Teklif Tutarı: ${formatCurrency(receipt.quoteTotalAmount)}` : ""}${receipt.quoteRemainingAmount ? ` &nbsp;•&nbsp; Kalan: ${formatCurrency(receipt.quoteRemainingAmount)}` : ""}</div>`
      : ""
  }
</div>

<!-- SIGNATURES -->
<table>
  <tr>
    ${renderSignatureBlock({
      title: "Tahsilatı Yapan",
      partyName: company.name,
      partyDetail: companyDetailParts.join(" • "),
      withParap: true,
      parapName: receipt.preparedByName || "",
    })}
    ${renderSignatureBlock({
      title: "Ödemeyi Yapan",
      partyName: receipt.customerName,
      partyDetail: customerDetailParts.join(" • "),
    })}
  </tr>
</table>

</body>
</html>`;
}
