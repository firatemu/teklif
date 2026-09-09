-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "name" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "plan1FirstYear" REAL,
    "plan1Renewal" REAL,
    "plan2FirstYear" REAL,
    "plan2Renewal" REAL,
    "plan3FirstYear" REAL,
    "plan3Renewal" REAL,
    "fixedPrice" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteNumber" TEXT NOT NULL,
    "quoteType" TEXT NOT NULL,
    "quoteDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerName" TEXT NOT NULL,
    "customerTaxOffice" TEXT,
    "customerTaxNumber" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "generalDiscountType" TEXT,
    "generalDiscountValue" REAL,
    "vatRate" REAL NOT NULL DEFAULT 20,
    "subtotal" REAL NOT NULL,
    "netAfterDiscount" REAL NOT NULL,
    "vatAmount" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "notes" TEXT,
    "preparedByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QuoteClassicItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteId" INTEGER NOT NULL,
    "productId" INTEGER,
    "displayName" TEXT NOT NULL,
    "selectedPlan" TEXT,
    "priceBasis" TEXT,
    "unitPrice" REAL NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "lineDiscountType" TEXT,
    "lineDiscountValue" REAL,
    "lineTotal" REAL NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuoteClassicItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteClassicItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuotePlanComparisonItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "displayName" TEXT NOT NULL,
    "plan1FirstYear" REAL NOT NULL,
    "plan1Renewal" REAL NOT NULL,
    "plan2FirstYear" REAL NOT NULL,
    "plan2Renewal" REAL NOT NULL,
    "plan3FirstYear" REAL NOT NULL,
    "plan3Renewal" REAL NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuotePlanComparisonItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuotePlanComparisonItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");
