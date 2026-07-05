/*
  Warnings:

  - Added the required column `storeId` to the `cart_wishlists` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cart_wishlists" ADD COLUMN     "storeId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "cart_wishlists" ADD CONSTRAINT "cart_wishlists_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
