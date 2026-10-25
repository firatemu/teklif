/**
 * Test amaçlı: tahsilat makbuzu şablonunu PDF/PNG olarak üretir.
 * Kullanım: node --experimental-strip-types scripts/render-receipt-test.ts
 */
import { readFileSync, writeFileSync } from "fs";
import { renderReceiptTemplate } from "../src/lib/pdf/receipt-template";

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
    customerAddress: "Mahfesığmaz Mah. Damar Arıkoğlu Bulv. No 33/A, Adana",
    bankInfo: "Azem Bankası Şubesi - TR33 0006 1005 1978 6457 8413 26",
    extraNotes: "Peşin tahsil edildi.",
    preparedByName: "Azem Yılmaz",
  };

  const html = renderReceiptTemplate(receipt, company as any);
  writeFileSync("/tmp/receipt-preview.html", html);

  const puppeteer = (await import("puppeteer")).default;
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 560, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: "/tmp/receipt-preview.png", fullPage: false });

    const pdf = await page.pdf({
      format: "A5",
      landscape: true,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    writeFileSync("/tmp/receipt-preview.pdf", pdf);

    const metrics = await page.evaluate(() => ({
      bodyH: document.body.scrollHeight,
      bodyW: document.body.scrollWidth,
      sheetH: (document.querySelector(".sheet") as HTMLElement)?.getBoundingClientRect().height,
      sheetW: (document.querySelector(".sheet") as HTMLElement)?.getBoundingClientRect().width,
      overflow: document.body.scrollHeight > document.body.clientHeight,
    }));
    console.log(JSON.stringify(metrics, null, 1));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
