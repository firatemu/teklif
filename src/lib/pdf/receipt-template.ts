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
    return `<div style="width: 78px; height: 78px; border: 1px solid #e2e8f0; border-radius: 10px; background: linear-gradient(180deg, #ffffff, #f8fafc); display: flex; align-items: center; justify-content: center; padding: 7px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);">
      <img src="${company.logoDataUrl}" style="max-width: 100%; max-height: 62px; object-fit: contain; display: block;" alt="Logo" />
    </div>`;
  }
  const initials = (company.shortName || company.name || "AZ")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return `<div style="width: 78px; height: 78px; background: linear-gradient(135deg, #1e4b93, #2d60b0); border-radius: 10px; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">${initials}</div>`;
}

/**
 * Tahsilatı yapanın imzası (calligraphic monogram).
 * SVG olarak gömülür; kaşe alanının üstünde imza ve parafçı adı yer alır.
 */
function renderSignatureGraphic(): string {
  return `
        <svg width="52" height="62" viewBox="0 0 380 480" style="display: block; margin-top: 3px;">
          <g fill="none" stroke="#0f172a" stroke-linecap="round" stroke-linejoin="round">
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

/**
 * Tahsilatı yapan taraf için imza alanı: imza görseli + parafçı adı.
 */
function renderParafSignature(parapName: string): string {
  return `
    <div style="margin-top: 7px;">
      <span style="font-size: 7px; font-weight: 800; letter-spacing: 0.7px; color: #64748b; text-transform: uppercase;">İmza</span>
      <div style="display: table; margin-top: 2px;">
        <div style="display: table-cell; vertical-align: bottom; padding-right: 8px;">
          ${renderSignatureGraphic()}
        </div>
        <div style="display: table-cell; vertical-align: bottom;">
          <div style="font-size: 8px; font-weight: 700; color: #334155; padding-bottom: 2px;">${escapeHtml(parapName || "-")}</div>
          <div style="font-size: 6.5px; font-weight: 700; letter-spacing: 0.6px; color: #94a3b8; text-transform: uppercase;">Tahsil Eden</div>
        </div>
      </div>
    </div>`;
}

/**
 * İmza bloğu. Yalnızca taraf adı yer alır; vergi numarası/adres gibi detaylar
 * belge başlığında toplanmıştır. Tahsilatı yapan tarafta ayrıca paraf imzası bulunur.
 */
function renderSignatureBlock(options: {
  title: string;
  partyName: string;
  withParap?: boolean;
  parapName?: string;
}): string {
  const { title, partyName, withParap = false, parapName = "" } = options;

  const parapField = withParap ? renderParafSignature(parapName) : "";

  return `
  <td style="width: 50%; vertical-align: bottom; padding: 0 5px 0 0;">
    <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
      <div style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1; padding: 5px 10px; display: table; width: 100%;">
        <span style="display: table-cell; font-size: 7.5px; font-weight: 800; letter-spacing: 0.8px; color: #334155; text-transform: uppercase;">${title}</span>
        <span style="display: table-cell; text-align: right; font-size: 7px; font-weight: 700; letter-spacing: 0.6px; color: #94a3b8; text-transform: uppercase;">${
          withParap ? "Kaşe ve Paraf" : "Kaşe / İmza"
        }</span>
      </div>
      <div style="padding: 9px 10px 5px 10px; display: table; width: 100%;">
        <div style="display: table-cell; vertical-align: bottom;">
          <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; line-height: 1.35; text-transform: uppercase;">${escapeHtml(partyName)}</div>
          ${parapField}
          <div style="height: ${withParap ? "8px" : "30px"};"></div>
          <div style="border-top: 1px dashed #94a3b8; padding-top: 4px; text-align: center;">
            <span style="font-size: 7.5px; color: #94a3b8; letter-spacing: 0.5px;">Kaşe / İmza</span>
          </div>
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
<div style="border-bottom: 2px solid #1e4b93; padding-bottom: 8px; margin-bottom: 9px;">
  <table>
    <tr>
      <!-- Logo + Company -->
      <td style="vertical-align: top; width: 47%;">
        <div style="display: table; width: 100%;">
          <div style="display: table-cell; vertical-align: top; width: 78px;">
            ${renderLogo(company)}
          </div>
          <div style="display: table-cell; vertical-align: top; padding-left: 11px;">
            <div style="font-size: 10px; font-weight: 900; color: #0f172a; line-height: 1.2; letter-spacing: 0.1px; text-transform: uppercase;">${escapeHtml(company.name)}</div>
            ${
              company.tagline
                ? `<div style="display: inline-block; margin-top: 4px; background: #eef2f9; border: 1px solid #dbe3f0; border-radius: 3px; padding: 2px 7px; font-size: 6.5px; font-weight: 800; letter-spacing: 0.9px; color: #1e4b93; text-transform: uppercase;">${escapeHtml(company.tagline)}</div>`
                : ""
            }
            <table style="margin-top: 5px;">
              <tr>
                <td style="vertical-align: top; padding: 0 10px 0 0; width: 50%;">
                  <div style="font-size: 6px; font-weight: 800; letter-spacing: 0.7px; color: #94a3b8; text-transform: uppercase;">Adres</div>
                  <div style="font-size: 7.5px; font-weight: 600; color: #334155; line-height: 1.35; margin-top: 1px;">${escapeHtml(company.address ? `${company.city ? company.city + ", " : ""}${company.address}` : "-")}</div>
                </td>
                <td style="vertical-align: top; padding: 0; width: 50%;">
                  <div style="font-size: 6px; font-weight: 800; letter-spacing: 0.7px; color: #94a3b8; text-transform: uppercase;">Vergi Dairesi / No</div>
                  <div style="font-size: 7.5px; font-weight: 600; color: #334155; line-height: 1.35; margin-top: 1px;">${escapeHtml(
                    company.taxOffice || company.taxNumber
                      ? `${company.taxOffice || "-"} / ${company.taxNumber || "-"}`
                      : "-"
                  )}</div>
                </td>
              </tr>
              <tr>
                <td style="vertical-align: top; padding: 4px 10px 0 0;">
                  <div style="font-size: 6px; font-weight: 800; letter-spacing: 0.7px; color: #94a3b8; text-transform: uppercase;">Telefon / E-posta</div>
                  <div style="font-size: 7.5px; font-weight: 600; color: #334155; line-height: 1.35; margin-top: 1px;">${escapeHtml(
                    [company.phone, company.email].filter(Boolean).join(" • ") || "-"
                  )}</div>
                </td>
                <td style="vertical-align: top; padding: 4px 0 0;">
                  <div style="font-size: 6px; font-weight: 800; letter-spacing: 0.7px; color: #94a3b8; text-transform: uppercase;">Web Sitesi</div>
                  <div style="font-size: 7.5px; font-weight: 600; color: #334155; line-height: 1.35; margin-top: 1px;">${escapeHtml(company.website || "-")}</div>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </td>

      <!-- Document identity -->
      <td style="vertical-align: top; text-align: right; width: 53%;">
        <div style="display: inline-block; text-align: left; border: 1px solid #dbe3f0; border-radius: 8px; overflow: hidden; min-width: 198px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);">
          <div style="background: linear-gradient(90deg, #1e4b93, #2d60b0); padding: 5px 10px; display: table; width: 100%;">
            <span style="display: table-cell; font-size: 8px; font-weight: 900; letter-spacing: 1.2px; color: #ffffff; text-transform: uppercase;">Tahsilat Makbuzu</span>
            <span style="display: table-cell; text-align: right; font-size: 6.5px; font-weight: 700; letter-spacing: 0.7px; color: #c7d7f2; text-transform: uppercase;">Belge</span>
          </div>
          <table>
            <tr>
              <td style="padding: 5px 10px; border-bottom: 1px solid #f1f5f9; width: 52%;">
                <span style="font-size: 6.5px; font-weight: 700; letter-spacing: 0.6px; color: #94a3b8; text-transform: uppercase;">Belge No</span>
                <div style="font-size: 10px; font-weight: 900; color: #1e4b93; letter-spacing: 0.4px; margin-top: 1px;">${escapeHtml(receipt.receiptNumber)}</div>
              </td>
              <td style="padding: 5px 10px; border-bottom: 1px solid #f1f5f9; border-left: 1px solid #f1f5f9; width: 48%;">
                <span style="font-size: 6.5px; font-weight: 700; letter-spacing: 0.6px; color: #94a3b8; text-transform: uppercase;">Makbuz Tarihi</span>
                <div style="font-size: 10px; font-weight: 800; color: #0f172a; margin-top: 1px;">${formatDate(receipt.receiptDate)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 10px;">
                <span style="font-size: 6.5px; font-weight: 700; letter-spacing: 0.6px; color: #94a3b8; text-transform: uppercase;">Düzenleyen</span>
                <div style="font-size: 8.5px; font-weight: 700; color: #0f172a; margin-top: 1px;">${escapeHtml(receipt.preparedByName || "-")}</div>
              </td>
              <td style="padding: 5px 10px; border-left: 1px solid #f1f5f9;">
                <span style="font-size: 6.5px; font-weight: 700; letter-spacing: 0.6px; color: #94a3b8; text-transform: uppercase;">Ödeme Şekli</span>
                <div style="font-size: 8.5px; font-weight: 700; color: #0f172a; margin-top: 1px;">${escapeHtml(methodLabel)}</div>
              </td>
            </tr>
          </table>
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
      withParap: true,
      parapName: receipt.preparedByName || "",
    })}
    ${renderSignatureBlock({
      title: "Ödemeyi Yapan",
      partyName: receipt.customerName,
    })}
  </tr>
</table>

</body>
</html>`;
}
