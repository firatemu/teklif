import { formatCurrency, formatDate } from "@/lib/formatters";
import type { CompanySettingsForPdf } from "./generator";

/* ─────────────────────────────────────────────────────────────────
   HELPER FUNCTIONS
   ───────────────────────────────────────────────────────────────── */
function renderLogo(c: CompanySettingsForPdf): string {
  if (c.logoDataUrl) {
    return `<img src="${c.logoDataUrl}" style="height: 58px; max-width: 180px; object-fit: contain; display: block;" alt="Logo" />`;
  }
  const initials = (c.shortName || c.name || "AZ")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return `<div style="width: 52px; height: 52px; background: linear-gradient(135deg, #1e40af, #3b82f6); border-radius: 10px; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800;">${initials}</div>`;
}

function getPhones(c: CompanySettingsForPdf): string {
  return [c.phone, c.phone2].filter(Boolean).join(" / ");
}

/* ─────────────────────────────────────────────────────────────────
   1. MODERN CORPORATE HEADER
   ───────────────────────────────────────────────────────────────── */
// SVG Vector Icons for Header
const pinIcon = `<svg style="display:inline-block; vertical-align:-1.5px; margin-right:4px; width:11px; height:11px; color:#2563eb; flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
const phoneIcon = `<svg style="display:inline-block; vertical-align:-1.5px; margin-right:4px; width:11px; height:11px; color:#2563eb; flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
const mailIcon = `<svg style="display:inline-block; vertical-align:-1.5px; margin-right:4px; width:11px; height:11px; color:#2563eb; flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;
const globeIcon = `<svg style="display:inline-block; vertical-align:-1.5px; margin-right:4px; width:11px; height:11px; color:#2563eb; flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`;
const taxIcon = `<svg style="display:inline-block; vertical-align:-1.5px; margin-right:4px; width:11px; height:11px; color:#64748b; flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;

function renderModernHeader(quote: any, company: CompanySettingsForPdf, _docTitle?: string): string {
  return `
  <!-- HEADER -->
  <div style="padding-bottom: 18px; margin-bottom: 18px; border-bottom: 2px solid #e2e8f0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <!-- Left: Logo + Company Info with Icons -->
        <td style="vertical-align: top; width: 62%;">
          ${
            company.logoDataUrl
              ? `<div style="margin-bottom: 8px;">
                  <img src="${company.logoDataUrl}" alt="${company.name}" style="max-height: 48px; max-width: 180px; object-fit: contain; display: block;" />
                 </div>`
              : ""
          }
          <div style="font-size: 15px; font-weight: 900; color: #0f172a; letter-spacing: -0.3px; margin-bottom: 4px; line-height: 1.25;">
            ${company.name}
          </div>
          ${
            company.tagline
              ? `<div style="display: inline-block; background: #eff6ff; color: #1d4ed8; font-size: 9.5px; font-weight: 700; padding: 2px 8px; border-radius: 4px; border: 1px solid #bfdbfe; margin-bottom: 7px; letter-spacing: 0.2px;">
                  ${company.tagline}
                 </div>`
              : `<div style="margin-bottom: 6px;"></div>`
          }
          <div style="font-size: 9px; color: #475569; line-height: 1.6;">
            ${
              company.address
                ? `<div style="display: flex; align-items: flex-start; margin-bottom: 3px; color: #334155;">
                     ${pinIcon}
                     <span>${company.address}</span>
                   </div>`
                : ""
            }
            <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 3px;">
              ${
                getPhones(company)
                  ? `<div style="display: flex; align-items: center; color: #1e293b; font-weight: 600;">
                       ${phoneIcon}
                       <span>${getPhones(company)}</span>
                     </div>`
                  : ""
              }
              ${
                company.email
                  ? `<div style="display: flex; align-items: center;">
                       ${mailIcon}
                       <span style="color: #2563eb; font-weight: 600;">${company.email}</span>
                     </div>`
                  : ""
              }
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 12px;">
              ${
                company.taxOffice || company.taxNumber
                  ? `<div style="display: flex; align-items: center; color: #64748b;">
                       ${taxIcon}
                       <span>V.D.: ${company.taxOffice || "—"} / ${company.taxNumber || "—"}</span>
                     </div>`
                  : ""
              }
              ${
                company.website
                  ? `<div style="display: flex; align-items: center;">
                       ${globeIcon}
                       <span style="color: #2563eb; font-weight: 700;">${company.website}</span>
                     </div>`
                  : ""
              }
            </div>
          </div>
        </td>

        <!-- Right: Proposal Meta Window (Teklif Bilgileri Penceresi) -->
        <td style="vertical-align: top; width: 38%; text-align: right;">
          <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; box-shadow: 0 2px 5px rgba(15,23,42,0.04); overflow: hidden; display: inline-block; text-align: left; width: 235px;">
            <!-- Header bar of meta card -->
            <div style="background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; padding: 7px 12px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 9px; font-weight: 800; color: #475569; letter-spacing: 0.6px; text-transform: uppercase;">TEKLİF NO</span>
              <span style="font-size: 11.5px; font-weight: 900; color: #1d4ed8; background: #eff6ff; padding: 2px 8px; border-radius: 4px; border: 1px solid #bfdbfe; letter-spacing: 0.3px;">#${quote.quoteNumber}</span>
            </div>
            <!-- Body rows -->
            <div style="padding: 9px 12px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
                <tr>
                  <td style="color: #64748b; padding: 3px 0; font-weight: 500;">Düzenleme Tarihi:</td>
                  <td style="text-align: right; color: #0f172a; font-weight: 700; padding: 3px 0;">${formatDate(quote.quoteDate)}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 3px 0; font-weight: 500;">Geçerlilik Süresi:</td>
                  <td style="text-align: right; color: #0f172a; font-weight: 700; padding: 3px 0;">15 Gün</td>
                </tr>
                ${
                  quote.preparedByName
                    ? `<tr>
                        <td style="color: #64748b; padding: 6px 0 2px 0; font-weight: 500; border-top: 1px solid #f1f5f9;">Teklif Hazırlayan:</td>
                        <td style="text-align: right; color: #1d4ed8; font-weight: 700; padding: 6px 0 2px 0; border-top: 1px solid #f1f5f9;">${quote.preparedByName}</td>
                       </tr>`
                    : ""
                }
              </table>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>`;
}

/* ─────────────────────────────────────────────────────────────────
   2. REFINED CUSTOMER CARD
   ───────────────────────────────────────────────────────────────── */
function renderCustomerSection(quote: any): string {
  const hasTax = quote.customerTaxOffice || quote.customerTaxNumber;
  const hasContact = quote.customerPhone || quote.customerEmail;

  return `
  <!-- CUSTOMER SECTION -->
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px;">
    <div style="font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #2563eb; margin-bottom: 3px;">
      SAYIN / TEKLİF SUNULAN FİRMA
    </div>
    <div style="font-size: 14.5px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">
      ${quote.customerName}
    </div>
    ${
      hasTax || hasContact
        ? `<div style="font-size: 9px; color: #64748b; line-height: 1.45;">
            ${hasTax ? `<span><strong>Vergi Dairesi / No:</strong> ${quote.customerTaxOffice || "—"} / ${quote.customerTaxNumber || "—"}</span>` : ""}
            ${hasTax && hasContact ? ` &nbsp;•&nbsp; ` : ""}
            ${quote.customerPhone ? `<span><strong>Tel:</strong> ${quote.customerPhone}</span>` : ""}
            ${quote.customerPhone && quote.customerEmail ? ` &nbsp;•&nbsp; ` : ""}
            ${quote.customerEmail ? `<span><strong>E-Posta:</strong> ${quote.customerEmail}</span>` : ""}
           </div>`
        : ""
    }
  </div>`;
}

/* ─────────────────────────────────────────────────────────────────
   3. REFINED FOOTER
   ───────────────────────────────────────────────────────────────── */
function renderFooter(company: CompanySettingsForPdf): string {
  const contactParts = [
    company.name,
    company.website,
    company.email,
    getPhones(company) ? `Tel: ${getPhones(company)}` : "",
  ].filter(Boolean);

  return `
  <!-- FOOTER (CENTERED & PINNED TO BOTTOM) -->
  <div class="footer-container" style="margin-top: auto; padding-top: 14px; border-top: 1px solid #e2e8f0; text-align: center;">
    <div style="font-size: 11px; font-weight: 800; color: #1e40af; margin-bottom: 4px; letter-spacing: 0.3px;">
      Bizi tercih ettiğiniz için teşekkür ederiz.
    </div>
    <div style="font-size: 8.5px; color: #64748b; line-height: 1.5;">
      ${contactParts.join(" &nbsp;&bull;&nbsp; ")}
    </div>
  </div>`;
}

// ═════════════════════════════════════════════════════════════════
//  A. PLAN COMPARISON TEMPLATE (EXACT REFERENCE DESIGN)
// ═════════════════════════════════════════════════════════════════
export function renderPlanComparisonTemplate(quote: any, company: CompanySettingsForPdf): string {
  let p1First = 0, p1Ren = 0;
  let p2First = 0, p2Ren = 0;
  let p3First = 0, p3Ren = 0;

  const rowsHtml = quote.planComparisonItems
    .map((item: any) => {
      p1First += item.plan1FirstYear || 0;
      p1Ren += item.plan1Renewal || 0;
      p2First += item.plan2FirstYear || 0;
      p2Ren += item.plan2Renewal || 0;
      p3First += item.plan3FirstYear || 0;
      p3Ren += item.plan3Renewal || 0;

      return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <!-- Ürün Açıklaması (Beyaz) -->
        <td style="padding: 12px 14px; font-size: 10px; font-weight: 700; color: #0f172a; background: #ffffff; line-height: 1.4;">
          ${item.displayName}
        </td>

        <!-- PLAN 1 Sütunu (Mavi Zemin) -->
        <td style="padding: 12px 10px; text-align: right; font-size: 11.5px; font-weight: 700; color: #0f172a; background: #f0f7ff; border-left: 1.5px solid #bfdbfe; white-space: nowrap;">
          ${formatCurrency(item.plan1FirstYear)}
        </td>
        <td style="padding: 12px 10px; text-align: right; font-size: 11px; font-weight: 700; color: #1e40af; background: #f0f7ff; white-space: nowrap;">
          ${formatCurrency(item.plan1Renewal)}
        </td>

        <!-- PLAN 2 Sütunu (Sıcak Kehribar/Altın Zemin - Mor Yerine) -->
        <td style="padding: 12px 10px; text-align: right; font-size: 11.5px; font-weight: 700; color: #0f172a; background: #fffdf5; border-left: 1.5px solid #fde68a; white-space: nowrap;">
          ${formatCurrency(item.plan2FirstYear)}
        </td>
        <td style="padding: 12px 10px; text-align: right; font-size: 11px; font-weight: 700; color: #b45309; background: #fffdf5; white-space: nowrap;">
          ${formatCurrency(item.plan2Renewal)}
        </td>

        <!-- PLAN 3 Sütunu (Zümrüt Yeşil Zemin) -->
        <td style="padding: 12px 10px; text-align: right; font-size: 11.5px; font-weight: 700; color: #0f172a; background: #f0fdf4; border-left: 1.5px solid #bbf7d0; white-space: nowrap;">
          ${formatCurrency(item.plan3FirstYear)}
        </td>
        <td style="padding: 12px 10px; text-align: right; font-size: 11px; font-weight: 700; color: #15803d; background: #f0fdf4; white-space: nowrap;">
          ${formatCurrency(item.plan3Renewal)}
        </td>
      </tr>`;
    })
    .join("");

  const notes = quote.notes
    ? quote.notes
        .split("\n")
        .map((n: string) => n.trim())
        .filter(Boolean)
    : [];

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>${quote.quoteNumber}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body {
    height: 100%;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    margin: 0; padding: 22px 28px; color: #0f172a; background: #ffffff;
    font-size: 10px; line-height: 1.45;
    font-feature-settings: "tnum";
    font-variant-numeric: tabular-nums;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 100vh;
    box-sizing: border-box;
  }
  .main-content {
    flex: 1 0 auto;
  }
  table { border-collapse: collapse; }
</style>
</head>
<body>

<div class="main-content">
${renderModernHeader(quote, company, "PLAN KARŞILAŞTIRMA TEKLİFİ")}
${renderCustomerSection(quote)}

<!-- COMPARISON MATRIX -->
<div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <!-- Row 1: Plan Headers -->
      <tr style="border-bottom: 1.5px solid #cbd5e1;">
        <th rowspan="2" style="background: #f8fafc; color: #0f172a; font-size: 11.5px; font-weight: 900; text-align: left; padding: 12px 14px; width: 34%;">
          Ürün / Çözüm Açıklaması
        </th>

        <!-- PLAN 1 -->
        <th colspan="2" style="background: #dbeafe; color: #1e3a8a; border-left: 1.5px solid #93c5fd; font-size: 13.5px; font-weight: 900; text-align: center; padding: 10px 8px; width: 22%; letter-spacing: 0.8px;">
          PLAN 1
        </th>

        <!-- PLAN 2 (Sıcak Kehribar/Altın - Mor Yerine) -->
        <th colspan="2" style="background: #fef3c7; color: #92400e; border-left: 1.5px solid #fcd34d; font-size: 13.5px; font-weight: 900; text-align: center; padding: 10px 8px; width: 22%; letter-spacing: 0.8px;">
          PLAN 2
        </th>

        <!-- PLAN 3 -->
        <th colspan="2" style="background: #dcfce7; color: #14532d; border-left: 1.5px solid #86efac; font-size: 13.5px; font-weight: 900; text-align: center; padding: 10px 8px; width: 22%; letter-spacing: 0.8px;">
          PLAN 3
        </th>
      </tr>

      <!-- Row 2: Sub-headers (Centered) -->
      <tr style="border-bottom: 2px solid #94a3b8; font-size: 11px; font-weight: 800;">
        <th style="background: #eff6ff; color: #1e40af; border-left: 1.5px solid #93c5fd; padding: 8px 10px; text-align: center; width: 11%;">İlk Yıl</th>
        <th style="background: #eff6ff; color: #1e40af; padding: 8px 10px; text-align: center; width: 11%;">Yenileme</th>
        
        <th style="background: #fffbeb; color: #b45309; border-left: 1.5px solid #fcd34d; padding: 8px 10px; text-align: center; width: 11%;">İlk Yıl</th>
        <th style="background: #fffbeb; color: #b45309; padding: 8px 10px; text-align: center; width: 11%;">Yenileme</th>
        
        <th style="background: #f0fdf4; color: #15803d; border-left: 1.5px solid #86efac; padding: 8px 10px; text-align: center; width: 11%;">İlk Yıl</th>
        <th style="background: #f0fdf4; color: #15803d; padding: 8px 10px; text-align: center; width: 11%;">Yenileme</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}

      <!-- TOTAL ROW (CLEAR & VIBRANT ACCENT HIGHLIGHTS) -->
      <tr style="border-top: 2.5px solid #94a3b8;">
        <td style="padding: 14px 14px; font-weight: 900; font-size: 12px; color: #0f172a; background: #ffffff; letter-spacing: 0.5px;">
          TOPLAM
        </td>
        
        <!-- P1 Total (Blue) -->
        <td style="padding: 14px 10px; text-align: right; font-weight: 900; font-size: 13px; color: #1e3a8a; background: #dbeafe; border-left: 1.5px solid #93c5fd; white-space: nowrap;">
          ${formatCurrency(p1First)}
        </td>
        <td style="padding: 14px 10px; text-align: right; font-weight: 800; font-size: 12px; color: #1e40af; background: #dbeafe; white-space: nowrap;">
          ${formatCurrency(p1Ren)}
        </td>

        <!-- P2 Total (Warm Amber/Gold - Mor Yerine) -->
        <td style="padding: 14px 10px; text-align: right; font-weight: 900; font-size: 13px; color: #78350f; background: #fef3c7; border-left: 1.5px solid #fcd34d; white-space: nowrap;">
          ${formatCurrency(p2First)}
        </td>
        <td style="padding: 14px 10px; text-align: right; font-weight: 800; font-size: 12px; color: #92400e; background: #fef3c7; white-space: nowrap;">
          ${formatCurrency(p2Ren)}
        </td>

        <!-- P3 Total (Green) -->
        <td style="padding: 14px 10px; text-align: right; font-weight: 900; font-size: 13px; color: #14532d; background: #dcfce7; border-left: 1.5px solid #86efac; white-space: nowrap;">
          ${formatCurrency(p3First)}
        </td>
        <td style="padding: 14px 10px; text-align: right; font-weight: 800; font-size: 12px; color: #166534; background: #dcfce7; white-space: nowrap;">
          ${formatCurrency(p3Ren)}
        </td>
      </tr>
    </tbody>
  </table>
</div>

<!-- NOTES -->
<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 6px; padding: 12px 18px; margin-bottom: 20px;">
  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
    <svg style="width: 13px; height: 13px; color: #2563eb; display: inline-block; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
    <span style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #1e3a8a;">
      TEKLİF NOTLARI VE TİCARİ KOŞULLAR
    </span>
  </div>
  <ul style="margin: 0; padding-left: 18px; font-size: 9.5px; color: #334155; line-height: 1.65;">
    <li style="margin-bottom: 3px;">Fiyatlarımıza KDV dahil değildir.</li>
    <li style="margin-bottom: 3px;">Teklifimiz hazırlandığı tarihten itibaren 15 gün süreyle geçerlidir.</li>
    <li style="margin-bottom: 3px;">Fiyat listesi liste fiyatı baz alınarak hazırlanmıştır.</li>
    ${notes.map((n: string) => `<li style="margin-bottom: 3px;">${n}</li>`).join("")}
  </ul>
</div>
</div>

${renderFooter(company)}

</body>
</html>`;
}

// ═════════════════════════════════════════════════════════════════
//  B. CLASSIC QUOTE TEMPLATE
// ═════════════════════════════════════════════════════════════════
export function renderClassicTemplate(quote: any, company: CompanySettingsForPdf): string {
  const itemsHtml = quote.classicItems
    .map((item: any, idx: number) => {
      const bg = idx % 2 === 1 ? "background: #fbfbfb;" : "background: #ffffff;";
      return `
      <tr style="${bg} border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 8px; text-align: center; color: #94a3b8; font-size: 9.5px;">
          ${idx + 1}
        </td>
        <td style="padding: 10px 10px; font-weight: 600; color: #0f172a; font-size: 10.5px;">
          ${item.displayName}
        </td>
        <td style="padding: 10px 8px; text-align: center; color: #334155; font-size: 10px;">
          ${item.quantity} Adet
        </td>
        <td style="padding: 10px 8px; text-align: right; color: #334155; font-size: 10px;">
          ${formatCurrency(item.unitPrice)}
        </td>
        <td style="padding: 10px 8px; text-align: right; color: #64748b; font-size: 10px;">
          ${
            item.lineDiscountValue
              ? item.lineDiscountType === "PERCENT"
                ? `%${item.lineDiscountValue}`
                : formatCurrency(item.lineDiscountValue)
              : "—"
          }
        </td>
        <td style="padding: 10px 10px; text-align: right; font-weight: 700; color: #0f172a; font-size: 10.5px;">
          ${formatCurrency(item.lineTotal)}
        </td>
      </tr>`;
    })
    .join("");

  const hasDisc = quote.generalDiscountValue && quote.generalDiscountValue > 0;
  const notes = quote.notes
    ? quote.notes
        .split("\n")
        .map((n: string) => n.trim())
        .filter(Boolean)
    : [];

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>${quote.quoteNumber}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body {
    height: 100%;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    margin: 0; padding: 22px 28px; color: #0f172a; background: #ffffff;
    font-size: 10px; line-height: 1.45;
    font-feature-settings: "tnum";
    font-variant-numeric: tabular-nums;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 100vh;
    box-sizing: border-box;
  }
  .main-content {
    flex: 1 0 auto;
  }
  table { border-collapse: collapse; }
</style>
</head>
<body>

<div class="main-content">
${renderModernHeader(quote, company, "TEKLİF / PROFORMA")}
${renderCustomerSection(quote)}

<!-- ITEMS TABLE -->
<div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1;">
        <th style="padding: 10px 8px; font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; width: 35px; text-align: center;">#</th>
        <th style="padding: 10px 10px; font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Açıklama</th>
        <th style="padding: 10px 8px; font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; width: 75px; text-align: center;">Miktar</th>
        <th style="padding: 10px 8px; font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; width: 105px; text-align: right;">Birim Fiyat</th>
        <th style="padding: 10px 8px; font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; width: 85px; text-align: right;">İskonto</th>
        <th style="padding: 10px 10px; font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; width: 120px; text-align: right;">Tutar</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>
</div>

<!-- TOTALS AND NOTES SECTION -->
<div style="margin-bottom: 20px;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <!-- Left: Notes -->
      <td style="width: 52%; vertical-align: top; padding-right: 20px;">
        <div style="background: #fafafa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px;">
          <div style="font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; margin-bottom: 6px;">
            TEKLİF NOTLARI VE KOŞULLAR
          </div>
          <ul style="margin: 0; padding-left: 16px; font-size: 9px; color: #475569; line-height: 1.6;">
            <li>Teklifimiz hazırlandığı tarihten itibaren 15 gün süreyle geçerlidir.</li>
            <li>Fiyatlarımıza KDV dahil değildir.</li>
            <li>Ödeme vadeleri teklifte aksi belirtilmedikçe sipariş anında peşindir.</li>
            ${notes.map((n: string) => `<li>${n}</li>`).join("")}
          </ul>
        </div>
      </td>

      <!-- Right: Calculation Summary -->
      <td style="width: 48%; vertical-align: top;">
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff;">
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <tr>
              <td style="padding: 7px 12px; text-align: right; color: #64748b; border-bottom: 1px solid #f1f5f9;">Ara Toplam:</td>
              <td style="padding: 7px 12px; text-align: right; color: #0f172a; font-weight: 600; width: 120px; border-bottom: 1px solid #f1f5f9;">${formatCurrency(quote.subtotal)}</td>
            </tr>
            ${
              hasDisc
                ? `<tr>
                    <td style="padding: 7px 12px; text-align: right; color: #64748b; border-bottom: 1px solid #f1f5f9;">
                      Genel İskonto (${quote.generalDiscountType === "PERCENT" ? `%${quote.generalDiscountValue}` : "Tutar"}):
                    </td>
                    <td style="padding: 7px 12px; text-align: right; color: #dc2626; font-weight: 600; width: 120px; border-bottom: 1px solid #f1f5f9;">
                      -${formatCurrency(quote.subtotal - quote.netAfterDiscount)}
                    </td>
                   </tr>`
                : ""
            }
            <tr>
              <td style="padding: 7px 12px; text-align: right; color: #64748b; border-bottom: 1px solid #f1f5f9;">Net (KDV Hariç):</td>
              <td style="padding: 7px 12px; text-align: right; color: #0f172a; font-weight: 600; width: 120px; border-bottom: 1px solid #f1f5f9;">${formatCurrency(quote.netAfterDiscount)}</td>
            </tr>
            <tr>
              <td style="padding: 7px 12px; text-align: right; color: #64748b; border-bottom: 1px solid #e2e8f0;">KDV Tutarı (%${quote.vatRate}):</td>
              <td style="padding: 7px 12px; text-align: right; color: #0f172a; font-weight: 600; width: 120px; border-bottom: 1px solid #e2e8f0;">${formatCurrency(quote.vatAmount)}</td>
            </tr>
            <tr style="background: #eff6ff;">
              <td style="padding: 10px 12px; text-align: right; font-weight: 800; font-size: 11px; color: #1e40af;">ÖDENECEK TOPLAM:</td>
              <td style="padding: 10px 12px; text-align: right; font-weight: 800; font-size: 12px; color: #1d4ed8; width: 120px;">${formatCurrency(quote.totalAmount)}</td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
  </table>
</div>

${renderFooter(company)}

</body>
</html>`;
}
