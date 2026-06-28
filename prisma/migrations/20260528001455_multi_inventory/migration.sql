/*
  Warnings:

  - Added the required column `inventoryId` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inventoryId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inventoryId` to the `Provider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inventoryId` to the `Purchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inventoryId` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE IF NOT EXISTS "Inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Seed default inventory (must happen before inventoryId FK columns are populated)
INSERT OR IGNORE INTO "Inventory" ("id", "name", "createdAt", "updatedAt")
VALUES ('default', 'المخزن الرئيسي', datetime('now'), datetime('now'));

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
DROP TABLE IF EXISTS "new_Customer";
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "inventoryId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Customer_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("address", "createdAt", "firstname", "id", "inventoryId", "lastname", "phone", "updatedAt") SELECT "address", "createdAt", "firstname", "id", 'default', "lastname", "phone", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE INDEX "Customer_inventoryId_idx" ON "Customer"("inventoryId");
CREATE UNIQUE INDEX "Customer_inventoryId_phone_key" ON "Customer"("inventoryId", "phone");
DROP TABLE IF EXISTS "new_Product";
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "inventoryId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("createdAt", "description", "id", "inventoryId", "name", "updatedAt") SELECT "createdAt", "description", "id", 'default', "name", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE INDEX "Product_inventoryId_idx" ON "Product"("inventoryId");
DROP TABLE IF EXISTS "new_Provider";
CREATE TABLE "new_Provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "inventoryId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Provider_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Provider" ("address", "createdAt", "id", "inventoryId", "name", "phone", "updatedAt") SELECT "address", "createdAt", "id", 'default', "name", "phone", "updatedAt" FROM "Provider";
DROP TABLE "Provider";
ALTER TABLE "new_Provider" RENAME TO "Provider";
CREATE INDEX "Provider_inventoryId_idx" ON "Provider"("inventoryId");
CREATE UNIQUE INDEX "Provider_inventoryId_phone_key" ON "Provider"("inventoryId", "phone");
DROP TABLE IF EXISTS "new_Purchase";
CREATE TABLE "new_Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL DEFAULT 'default',
    "paidAmount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "payDueDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Purchase_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Purchase_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Purchase" ("createdAt", "date", "id", "inventoryId", "paidAmount", "payDueDate", "providerId", "updatedAt", "userId") SELECT "createdAt", "date", "id", 'default', "paidAmount", "payDueDate", "providerId", "updatedAt", "userId" FROM "Purchase";
DROP TABLE "Purchase";
ALTER TABLE "new_Purchase" RENAME TO "Purchase";
CREATE INDEX "Purchase_userId_idx" ON "Purchase"("userId");
CREATE INDEX "Purchase_providerId_idx" ON "Purchase"("providerId");
CREATE INDEX "Purchase_inventoryId_idx" ON "Purchase"("inventoryId");
DROP TABLE IF EXISTS "new_Sale";
CREATE TABLE "new_Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL DEFAULT 'default',
    "paidAmount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "payDueDate" DATETIME NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("createdAt", "customerId", "date", "discount", "id", "inventoryId", "paidAmount", "payDueDate", "updatedAt", "userId") SELECT "createdAt", "customerId", "date", "discount", "id", 'default', "paidAmount", "payDueDate", "updatedAt", "userId" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE INDEX "Sale_userId_idx" ON "Sale"("userId");
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");
CREATE INDEX "Sale_inventoryId_idx" ON "Sale"("inventoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
