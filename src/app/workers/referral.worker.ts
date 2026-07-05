import { Job, Worker } from "bullmq";
import { ReferralJobData } from "../queues/referral.queue";
import { prisma } from "../shared/prisma";
import { createReferralChain } from "../shared/createReferralChain";
import { bullMQConnection } from "../config/redis.config";

let _worker: Worker<ReferralJobData> | null = null;

export function initReferralWorker() {
  if (_worker) return _worker;

  _worker = new Worker<ReferralJobData>(
    "referral-chain",
    async (job: Job<ReferralJobData>) => {
      const { user_id, refCode } = job.data;
      console.log(
        `[Job ${job.id}] Processing referral chain for user: ${user_id}`,
      );
      await prisma.$transaction(async (tnx) => {
        await createReferralChain(tnx, user_id, refCode);
      });
      console.log(
        `[Job ${job.id}] Referral chain completed for user: ${user_id}`,
      );
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
