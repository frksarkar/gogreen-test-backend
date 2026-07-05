/*
  Warnings:

  - A unique constraint covering the columns `[position]` on the table `client_banner_positions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `storeId` to the `cart_wishlists` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BannerAdsType" AS ENUM ('Approved', 'Pending', 'Declined');


-- AlterTable
ALTER TABLE "client_banners" ADD COLUMN     "status" "BannerAdsType" NOT NULL DEFAULT 'Pending';

-- CreateIndex
CREATE UNIQUE INDEX "client_banner_positions_position_key" ON "client_banner_positions"("position");

