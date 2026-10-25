import { PDF_FONT_FAMILY, pdfFontFaceCss } from "./fonts";
import {
  receiptDocumentHtml,
  renderReceiptMarkup,
  type ReceiptCompanyView,
} from "@/lib/receipt/document";
import type { CompanySettingsForPdf } from "./generator";

/**
 * Tahsilat Makbuzu — A5 yatay (210 x 148 mm) PDF şablonu.
 * Tasarım referansı: kullanıcı tarafından paylaşılan "tahsilat-makbuzu.html".
 * İşaretleme ve stil ortak modülle paylaşılır (canlı önizleme ile birebir aynı).
 */

export function renderReceiptTemplate(
  receipt: any,
  company: CompanySettingsForPdf
): string {
  const view: ReceiptCompanyView = {
    name: company.name,
    shortName: company.shortName,
    address: company.address,
    city: company.city,
    phone: company.phone,
    phone2: company.phone2,
    email: company.email,
    taxOffice: company.taxOffice,
    taxNumber: company.taxNumber,
    logoDataUrl: company.logoDataUrl,
  };

  return receiptDocumentHtml({
    markup: renderReceiptMarkup(receipt, view),
    fontCss: pdfFontFaceCss(),
    fontOverride: PDF_FONT_FAMILY,
    title: receipt.receiptNumber,
  });
}
