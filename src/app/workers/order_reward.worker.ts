import { Job, Worker } from "bullmq";
import { OrderRewardJobData } from "../queues/order_reward.queue";
import { prisma } from "../shared/prisma";
import { ReferralRewards, ReferredUsers, User } from "@prisma/client";
import { bullMQConnection } from "../config/redis.config";

let _worker: Worker<OrderRewardJobData> | null = null;

export function initOrderRewardWorker() {
  if (_worker) return _worker;

  _worker = new Worker<OrderRewardJobData>(
    "order-reward",
    async (data: Job<OrderRewardJobData>) => {
      const { userId } = data.data;
      console.log(`[Job ${data.id}] Processing order reward job`);
      await prisma.$transaction(async (tnx) => {
        const maxLevel = await tnx.referralConfig.findMany({});
        const level = maxLevel.length !== 0 ? maxLevel[0].max_level : 5;

        const rewards = await tnx.referralRewards.findMany({
          where: { level: { lte: level } },
        });
        const rewardMap = new Map<number, ReferralRewards>(
          rewards.map((r: any) => [r.level, r]),
        );

        const directReferral = await tnx.referredUsers.findFirst({
          where: {
            referred_user: userId,
            rewards: { level: 1 },
          },
          orderBy: { createdAt: "desc" },
        });

        if (!directReferral) return;

        let currentReferrer: User | null = await tnx.user.findUnique({
          where: { id: directReferral.referral_user },
        });

        let curLevel = 1;
        while (currentReferrer && curLevel <= level) {
          const reward = rewardMap.get(curLevel);
          if (!reward) break;

          const existingEarner = await tnx.referralEarning.findFirst({
            where: { user_id: currentReferrer.id as string },
          });

          if (existingEarner) {
            await tnx.referralEarning.update({
              where: { id: existingEarner.id as string },
              data: { amount: existingEarner.amount + reward.reward_value },
            });
          } else {
            await tnx.referralEarning.create({
              data: {
                user_id: currentReferrer.id as string,
                amount: reward.reward_value as number,
              },
            });
          }

          const parentReferral: ReferredUsers | null =
            await tnx.referredUsers.findFirst({
              where: {
                referred_user: currentReferrer.id as string,
                rewards: { level: 1 },
              },
              orderBy: { createdAt: "desc" },
              include: { referral: true },
            });

          currentReferrer = parentReferral
            ? await tnx.user.findUnique({
                where: { id: parentReferral.referral_user },
              })
            : null;

          curLevel++;
        }
      });

      console.log(`[Job ${data.id}] Order reward job completed`);
    },
    {
      connection: bullMQConnection,
      concurrency: 5,
    },
  );

  _worker.on("completed", (job) => {
    console.log(`[Job ${job.id}] Completed`);
  });
  _worker.on("failed", (job, error) => {
    console.log(`[Job ${job?.id}] Failed`, error);
  });

  return _worker;
}
