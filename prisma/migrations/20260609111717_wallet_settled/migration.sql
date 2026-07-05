-- AlterTable
ALTER TABLE "vendor_orders" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "walletSettled" BOOLEAN NOT NULL DEFAULT false;
