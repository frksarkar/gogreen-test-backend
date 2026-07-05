/*
  Warnings:

  - You are about to drop the column `max_level` on the `referral_rewards` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "referral_rewards" DROP COLUMN "max_level";

-- CreateTable
CREATE TABLE "referral_config" (
    "id" TEXT NOT NULL,
    "max_level" INTEGER NOT NULL,

    CONSTRAINT "referral_config_pkey" PRIMARY KEY ("id")
);
