import { Queue } from "bullmq";
import { bullMQConnection } from "../config/redis.config";
import { OrderInvoicePayload } from "../utils/order/invoice";

interface OrderMailPayload {
  to: string;
  orderId: string;
  customerName: string;
  orderItems: any[];
  shippingCost: number;
  subTotal: number;
  totalAmount: number;
  tax: number | null;
  streetAddress: string | undefined;
  district: string | undefined;
  division: string | undefined;
}
export interface OrderEmailJobData {
  mailPayload: OrderMailPayload | null;
  pdfPayload: OrderInvoicePayload | null;
  orderId: string;
}

export type OrderEmailJobName = "order-email";

export const orderEmailQueue = new Queue<
  OrderEmailJobData,
  void,
  OrderEmailJobName
>("order-email", {
  connection: bullMQConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: {
      count: 100,
    },
    removeOnFail: {
      count: 500,
    },
  },
});
