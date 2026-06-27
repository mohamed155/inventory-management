-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "productionDate" DATETIME,
    "expirationDate" DATETIME,
    "quantity" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductBatch" ("createdAt", "expirationDate", "id", "productId", "productionDate", "quantity") SELECT "createdAt", "expirationDate", "id", "productId", "productionDate", "quantity" FROM "ProductBatch";
DROP TABLE "ProductBatch";
ALTER TABLE "new_ProductBatch" RENAME TO "ProductBatch";
CREATE INDEX "ProductBatch_productId_idx" ON "ProductBatch"("productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
