import { PrismaClient, ProductType } from "@prisma/client";
import * as xlsx from "xlsx";
import * as path from "path";

const prisma = new PrismaClient();

function cleanTitle(raw: string): string {
  if (!raw) return "";
  let str = raw.trim();
  // Remove leading dash/em-dash/en-dash
  str = str.replace(/^[─—–-]\s*/, "");
  // Remove trailing footnotes like (1)(2)(4) or (16)(17)
  str = str.replace(/(\s*\(\d+\))+\s*$/, "");
  return str.trim();
}

async function main() {
  console.log("Starting database seed from Excel...");
  const filePath = path.join(process.cwd(), "logo-edge-t-series-basic-fiyat-listesi.xlsx");
  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  // Clear existing products
  await prisma.product.deleteMany({});

  let currentCategory = "";
  let currentSubCategory: string | null = null;
  let isFixedSection = false;
  let sortOrder = 0;

  const productsToInsert: any[] = [];

  const topLevelList = [
    "Ana paket",
    "Kullanıcı artırımları",
    "Opsiyonlar",
    "Perakende",
    "Yabancı dil paketi",
    "E-Çözümler",
    "Ek ürün ve hizmetler",
    "Logo Finansal Teknolojiler"
  ];

  for (let i = 3; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || !row[0]) {
      continue;
    }

    const colA = String(row[0]).trim();
    const colB = row[1];
    const colC = row[2];
    const colD = row[3];
    const colE = row[4];
    const colF = row[5];
    const colG = row[6];

    const hasNumericColB = typeof colB === "number" || (!isNaN(Number(colB)) && String(colB).trim() !== "" && String(colB).trim() !== "Fiyat");
    const isHeaderRow = !hasNumericColB;

    if (isHeaderRow) {
      const cleaned = cleanTitle(colA);

      if (cleaned === "Logo Finansal Teknolojiler") {
        isFixedSection = true;
        currentCategory = "Logo Finansal Teknolojiler";
        currentSubCategory = null;
        console.log("[Section Change] -> Fixed-price section started: " + currentCategory);
        continue;
      }

      const startsWithDash = /^[─—–-]/.test(colA.trim());

      if (isFixedSection) {
        currentSubCategory = cleaned;
        console.log("  [SubCategory (Fixed)] -> " + currentSubCategory);
      } else if (startsWithDash) {
        if (topLevelList.includes(cleaned)) {
          currentCategory = cleaned;
          currentSubCategory = null;
          console.log("[Top Category] -> " + currentCategory);
        } else {
          currentSubCategory = cleaned;
          console.log("  [SubCategory] -> " + currentSubCategory + " (under " + currentCategory + ")");
        }
      } else {
        currentCategory = cleaned;
        currentSubCategory = null;
        console.log("[Top Category] -> " + currentCategory);
      }
      continue;
    }

    const startsWithDash = /^[─—–-]/.test(colA.trim());
    if (startsWithDash && isFixedSection && (colA.includes("Online Hesap Özeti") || colA.includes("Logo e-Tahsilat"))) {
      currentSubCategory = cleanTitle(colA);
      console.log("  [SubCategory (Fixed 0-val row)] -> " + currentSubCategory);
      continue;
    }

    sortOrder++;
    const name = colA;

    if (!isFixedSection) {
      productsToInsert.push({
        category: currentCategory,
        subCategory: currentSubCategory,
        name: name,
        productType: ProductType.PLAN_BASED,
        plan1FirstYear: Number(colB) || 0,
        plan1Renewal: Number(colC) || 0,
        plan2FirstYear: Number(colD) || 0,
        plan2Renewal: Number(colE) || 0,
        plan3FirstYear: Number(colF) || 0,
        plan3Renewal: Number(colG) || 0,
        fixedPrice: null,
        isActive: true,
        sortOrder: sortOrder,
      });
    } else {
      productsToInsert.push({
        category: currentCategory,
        subCategory: currentSubCategory,
        name: name,
        productType: ProductType.FIXED,
        plan1FirstYear: null,
        plan1Renewal: null,
        plan2FirstYear: null,
        plan2Renewal: null,
        plan3FirstYear: null,
        plan3Renewal: null,
        fixedPrice: Number(colB) || 0,
        isActive: true,
        sortOrder: sortOrder,
      });
    }
  }

  console.log("Total products parsed: " + productsToInsert.length);

  for (const item of productsToInsert) {
    await prisma.product.create({
      data: item,
    });
  }

  console.log("Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });