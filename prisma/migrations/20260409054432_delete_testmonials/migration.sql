/*
  Warnings:

  - You are about to drop the column `is_active` on the `referral_rewards` table. All the data in the column will be lost.
  - Added the required column `order_id` to the `testimonials` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('Vertical', 'Horizontal');

-- AlterTable
ALTER TABLE "referral_rewards" DROP COLUMN "is_active";

-- AlterTable
ALTER TABLE "testimonials" ADD COLUMN     "order_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "client_banners" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "alt" TEXT,
    "positionId" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_banner_positions" (
    "id" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "type" "BannerType" NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_banner_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "best_deals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "link" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "best_deals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_banners_positionId_idx" ON "client_banners"("positionId");

-- AddForeignKey
ALTER TABLE "client_banners" ADD CONSTRAINT "client_banners_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "client_banner_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
