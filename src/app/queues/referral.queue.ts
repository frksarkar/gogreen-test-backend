import { Queue } from "bullmq";
import { bullMQConnection } from "../config/redis.config";
import { ReferralJobName } from "../modules/auth/auth.validation";

export interface ReferralJobData {
  user_id: string;
  refCode: string;
}

// Created by Nahid

export const referralQueue = new Queue<
  ReferralJobData,
  void,
  ReferralJobName
>("referral-chain", {
  connection: bullMQConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});


// export const referralQueue = new Queue<ReferralJobData>("referral-chain", {
//   connection: redisClient,
//   defaultJobOptions: {
//     attempts: 3,
//     backoff: {
//       type: "exponential",
//       delay: 3000,
//     },
//     removeOnComplete: { count: 100 },
//     removeOnFail: { count: 500 },
//   },
// });
