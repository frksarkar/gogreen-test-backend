// import { Queue } from "bullmq";

// import { redisClient } from "../config/redis.config";
// export interface OrderRewardJobData {
//   userId: string;
// }

// export const OrderRewardQueue = new Queue<OrderRewardJobData>("order-reward", {
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

import { Queue } from "bullmq";
import { bullMQConnection } from "../config/redis.config";

export interface OrderRewardJobData {
  userId: string;
}

export type OrderRewardJobName = "order-reward";

export const OrderRewardQueue = new Queue<
  OrderRewardJobData,
  void,
  OrderRewardJobName
>("order-reward", {
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
