/*
  Warnings:

  - You are about to drop the column `payment_method` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `tax` on the `vendor_orders` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'COD';

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_roleId_fkey";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "payment_method",
ALTER COLUMN "payment_intent_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "roleId";

-- AlterTable
ALTER TABLE "vendor_orders" DROP COLUMN "tax";

-- DropEnum
DROP TYPE "PaymentMethod";
