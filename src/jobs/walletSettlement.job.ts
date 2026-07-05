import { OrderStatus } from "@prisma/client";
import cron from "node-cron";
import { prisma } from "../app/shared/prisma";

export const startWalletSettlementJob = () => {
  console.log("💰 Wallet Settlement Job Initialized");

  cron.schedule("0 2 * * *", async () => {
    console.log("🔄 Wallet settlement started...", new Date());

    try {
      const eligibleOrders = await prisma.vendorOrder.findMany({
        where: {
          status: OrderStatus.DELIVERED,
          deliveredAt: {
            lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          walletSettled: false,
        },
        select: {
          id: true,
          vendorId: true,
          storeId: true,
          sub_total: true,
        },
      });

      if (!eligibleOrders.length) {
        console.log("✅ No eligible orders found");
        return;
      }

      console.log(`📦 Orders found: ${eligibleOrders.length}`);

      const vendorMap: Record<
        string,
        {
          amount: number;
          storeId?: string;
        }
      > = {};

      for (const order of eligibleOrders) {
        if (!order.vendorId) {
          throw new Error("vendorId is missing");
        }
        if (!order.storeId) {
          throw new Error("storeId is missing");
        }

        if (!vendorMap[order.vendorId]) {
          vendorMap[order.vendorId] = {
            amount: 0,
            storeId: order.storeId,
          };
        }

        vendorMap[order.vendorId].amount += Number(order.sub_total);
      }

      for (const vendorId of Object.keys(vendorMap)) {
        const { amount, storeId } = vendorMap[vendorId];

        try {
          await prisma.$transaction(async (tx) => {
            // =====================================================
            // 1. GET WALLET
            // =====================================================
            const wallet = await tx.vendorWallet.findUnique({
              where: { vendorId },
            });

            if (!wallet) {
              throw new Error("Wallet not found");
            }

            // =====================================================
            // 2. UPDATE WALLET BALANCE
            // =====================================================
            await tx.vendorWallet.update({
              where: { vendorId },
              data: {
                currentBalance: {
                  increment: amount,
                },
                pendingBalance: {
                  decrement: amount,
                },
              },
            });

            // =====================================================
            // 3. CREATE TRANSACTION RECORD (🔥 IMPORTANT)
            // =====================================================
            await tx.vendorTransaction.create({
              data: {
                vendorId,
                storeId: storeId || null,
                walletId: wallet.id,

                amount,

                type: "ORDER_SETTLEMENT",
                purpose: "PENDING_TO_AVAILABLE",

                status: "COMPLETED",

                referenceId: null,
                description: `Auto settlement for delivered orders older than 7 days`,
              },
            });

            // =====================================================
            // 4. MARK ORDERS AS SETTLED
            // =====================================================
            await tx.vendorOrder.updateMany({
              where: {
                vendorId,
                status: OrderStatus.DELIVERED,
                walletSettled: false,
              },
              data: {
                walletSettled: true,
              },
            });
          });

          console.log(`💰 Vendor ${vendorId} settled: ${amount}`);
        } catch (err) {
          console.error(`❌ Vendor ${vendorId} failed`, err);
        }
      }

      console.log("✅ Wallet settlement completed");
    } catch (error) {
      console.error("❌ Wallet job failed:", error);
    }
  });
};
