
/**
 * Tasarim denetimi: referans HTML ile uretilen makbuz geometrisini karsilastirir.
 */
import { readFileSync } from "fs";
import { renderReceiptTemplate } from "../src/lib/pdf/receipt-template";

const REFERENCE =
  process.env.REFERENCE_HTML || "/tmp/tahsilat-makbuzu.html";

const SELECTORS = [
  ".sheet",
  ".header",
  ".company",
  ".company-name",
  ".title",
  ".title-rule",
  ".subtitle",
  ".receipt-meta",
  ".section",
  ".section-heading",
  ".section-heading .num",
  ".section-heading h2",
  ".section-body",
  ".form-row",
  ".field-label, .form-row label",
  ".write",
  ".payment-options",
  ".amount-banner",
  ".amount-label",
  ".amount-value",
  ".signatures",
  ".signature",
  ".sign-line",
  ".stamp",
  ".bottom",
  ".notes",
];

async function measure(page: any, selectors: string[]) {
  return page.evaluate((selectors: string[]) => {
    const mm = (px: number) => Math.round((px / 96) * 25.4 * 100) / 100;
    const result: Record<string, any> = {};
    selectors.forEach((selector) => {
      const el = document.querySelector(selector);
      if (!el) {
        result[selector] = null;
        return;
      }
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      result[selector] = {
        x: mm(r.x),
        y: mm(r.y),
        w: mm(r.width),
        h: mm(r.height),
        fs: cs.fontSize,
        fw: cs.fontWeight,
      };
    });
    return result;
  }, selectors);
}

async function main() {
  const data = JSON.parse(readFileSync("/tmp/receipt-test-data.json", "utf-8"));
  const company = {
    name: data.company.name,
    shortName: data.company.shortName,
    tagline: data.company.tagline,
    address: data.company.address,
    taxOffice: data.company.taxOffice,
    taxNumber: data.company.taxNumber,
    phone: data.company.phone,
    phone2: data.company.phone2,
    email: data.company.email,
    website: data.company.website,
    city: data.company.city,
    logoDataUrl: data.company.logoBase64
      ? `data:${data.company.logoMimeType};base64,${data.company.logoBase64}`
      : null,
  };

  const receipt = {
    ...data.receipt,
    receiptDate: new Date(data.receipt.receiptDate),
    customerAddress: "Mahfesigmaz Mah. Damar Arikoglu Bulv. No 33/A, Adana",
    bankInfo: "Azem Bankasi Subesi - TR33 0006 1005 1978 6457 8413 26",
    extraNotes: "Pesin tahsil edildi.",
    preparedByName: "Azem Yilmaz",
  };

  const html = renderReceiptTemplate(receipt, company as any);

  const puppeteer = (await import("puppeteer")).default;
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  try {
    const refPage = await browser.newPage();
    await refPage.setViewport({ width: 794, height: 560 });
    await refPage.goto(`file://${REFERENCE}`, { waitUntil: "networkidle0" });
    await refPage.emulateMediaType("print");
    const ref = await measure(refPage, SELECTORS);

    const ourPage = await browser.newPage();
    await ourPage.setViewport({ width: 794, height: 560 });
    await ourPage.setContent(html, { waitUntil: "networkidle0" });
    await ourPage.evaluate(() => document.fonts.ready);
    const our = await measure(ourPage, SELECTORS);

    const rows: string[] = [];
    rows.push(
      "selector".padEnd(26) +
        "ref(x,y,w,h)".padEnd(26) +
        "ours(x,y,w,h)".padEnd(26) +
        "delta(w,h)"
    );
    for (const selector of SELECTORS) {
      const a = ref[selector];
      const b = our[selector];
      if (!a || !b) {
        rows.push(`${selector.padEnd(26)} ${a ? "ok" : "MISSING"} / ${b ? "ok" : "MISSING"}`);
        continue;
      }
      const dw = Math.round((b.w - a.w) * 100) / 100;
      const dh = Math.round((b.h - a.h) * 100) / 100;
      const flag = Math.abs(dw) > 1.5 || Math.abs(dh) > 1.5 ? "  <-- FARK" : "";
      rows.push(
        selector.padEnd(26) +
          `${a.x},${a.y},${a.w},${a.h}`.padEnd(26) +
          `${b.x},${b.y},${b.w},${b.h}`.padEnd(26) +
          `${dw},${dh}${flag}`
      );
    }
    console.log(rows.join("\n"));

    const audit = await ourPage.evaluate(() => {
      const mm = (px: number) => Math.round((px / 96) * 25.4 * 100) / 100;
      const sheet = document.querySelector(".sheet") as HTMLElement;
      const sheetRect = sheet.getBoundingClientRect();
      const children = Array.from(sheet.children).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName + "." + (el.className || ""),
          top: mm(r.top - sheetRect.top),
          bottom: mm(r.bottom - sheetRect.top),
        };
      });
      let overlap = 0;
      for (let i = 1; i < children.length; i++) {
        if (children[i].top < children[i - 1].bottom - 0.05) overlap++;
      }
      return {
        sheetH: mm(sheetRect.height),
        scrollH: mm(document.documentElement.scrollHeight),
        children,
        overlap,
        logoLoaded: (() => {
          const img = document.querySelector(".logo-img") as HTMLImageElement | null;
          return img ? img.complete && img.naturalWidth > 0 : false;
        })(),
      };
    });
    console.log("\nAUDIT: " + JSON.stringify(audit, null, 1));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
