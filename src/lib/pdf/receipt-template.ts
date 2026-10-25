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

function renderSignatureBlock(
  title: string,
  partyName: string,
  partyDetail: string
): string {
  return `
  <td style="width: 50%; vertical-align: top; padding: 0 5px 0 0;">
    <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
      <div style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1; padding: 5px 10px;">
        <span style="font-size: 7.5px; font-weight: 800; letter-spacing: 0.8px; color: #334155; text-transform: uppercase;">${title}</span>
      </div>
      <div style="padding: 8px 10px 4px 10px;">
        <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; line-height: 1.35; text-transform: uppercase;">${escapeHtml(partyName)}</div>
        ${partyDetail ? `<div style="font-size: 8px; color: #64748b; margin-top: 2px; line-height: 1.4;">${escapeHtml(partyDetail)}</div>` : ""}
        <div style="height: 26px;"></div>
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
<div style="border-bottom: 2px solid #1e4b93; padding-bottom: 6px; margin-bottom: 9px;">
  <table>
    <tr>
      <td style="vertical-align: top;">
        <div style="font-size: 13.5px; font-weight: 900; letter-spacing: 1.2px; color: #1e4b93; text-transform: uppercase;">Tahsilat Makbuzu</div>
        <div style="font-size: 11px; font-weight: 800; color: #0f172a; margin-top: 2px; letter-spacing: 0.3px;">${escapeHtml(receipt.receiptNumber)}</div>
        <div style="font-size: 8.5px; color: #475569; margin-top: 3px;">Tarih: <span style="font-weight: 700; color: #0f172a;">${formatDate(receipt.receiptDate)}</span></div>
      </td>
      <td style="vertical-align: top; text-align: right; width: 30%;">
        <div style="display: inline-block; text-align: left; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
          <div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 4px 9px;">
            <span style="font-size: 7.5px; font-weight: 800; letter-spacing: 0.7px; color: #475569; text-transform: uppercase;">Seri No</span>
          </div>
          <div style="padding: 5px 9px;">
            <div style="font-size: 9.5px; font-weight: 800; color: #1e4b93;">${escapeHtml(receipt.receiptNumber)}</div>
            <div style="font-size: 8px; color: #64748b; margin-top: 2px;">${escapeHtml(company.shortName || company.name)}</div>
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
    ${renderSignatureBlock(
      "Tahsilatı Yapan",
      company.name,
      companyDetailParts.join(" • ")
    )}
    ${renderSignatureBlock(
      "Ödemeyi Yapan",
      receipt.customerName,
      customerDetailParts.join(" • ")
    )}
  </tr>
</table>

</body>
</html>`;
}
