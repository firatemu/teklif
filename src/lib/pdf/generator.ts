import puppeteer from "puppeteer";
import { renderClassicTemplate, renderPlanComparisonTemplate } from "./templates";
import { prisma } from "@/lib/db";

export interface CompanySettingsForPdf {
  name: string;
  shortName: string;
  tagline: string;
  address: string;
  taxOffice: string;
  taxNumber: string;
  phone: string;
  phone2: string;
  email: string;
  website: string;
  city: string;
  logoDataUrl: string | null;
}

async function getCompanySettingsForPdf(): Promise<CompanySettingsForPdf> {
  const settings = await prisma.companySettings.findUnique({ where: { id: 1 } });

  if (!settings) {
    return {
      name: "Firma Adı",
      shortName: "Firma",
      tagline: "",
      address: "",
      taxOffice: "",
      taxNumber: "",
      phone: "",
      phone2: "",
      email: "",
      website: "",
      city: "",
      logoDataUrl: null,
    };
  }

  return {
    name: settings.name,
    shortName: settings.shortName,
    tagline: settings.tagline,
    address: settings.address,
    taxOffice: settings.taxOffice,
    taxNumber: settings.taxNumber,
    phone: settings.phone,
    phone2: settings.phone2,
    email: settings.email,
    website: settings.website,
    city: settings.city,
    logoDataUrl: settings.logoBase64
      ? `data:${settings.logoMimeType};base64,${settings.logoBase64}`
      : null,
  };
}

export async function generateQuotePdf(quote: any): Promise<Buffer> {
  const company = await getCompanySettingsForPdf();
  const isClassic = quote.quoteType === "CLASSIC";
  const html = isClassic
    ? renderClassicTemplate(quote, company)
    : renderPlanComparisonTemplate(quote, company);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "12mm",
        right: "12mm",
        bottom: "12mm",
        left: "12mm",
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
