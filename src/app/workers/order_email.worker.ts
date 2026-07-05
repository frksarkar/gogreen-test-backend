import { Job, Worker } from "bullmq";
import { OrderEmailJobData } from "../queues/order_email.queue";
import { createInvoice } from "../utils/order/createInvoice";
import { sendMail } from "../utils/transporter";
import { bullMQConnection } from "../config/redis.config";
import { prisma } from "../shared/prisma";

let _worker: Worker<OrderEmailJobData> | null = null;

export function initOrderEmailWorker() {
  if (_worker) return _worker;

  _worker = new Worker<OrderEmailJobData>(
    "order-email",
    async (data: Job<OrderEmailJobData>) => {
      console.log(`[Job ${data.id}] Processing order email job`);
      const { mailPayload, pdfPayload, orderId } = data.data;
      let secure_url;
      if (pdfPayload) {
        console.log(`[Job ${data.id}] Sending order pdf`);
        secure_url = await createInvoice(pdfPayload);
      }
      if (mailPayload) {
        await sendMail({
          to: mailPayload.to,
          subject: "Order confirmed",
          templateName: "orderConfirm",
          templateData: { ...mailPayload, invoice_url: secure_url },
        });
      }
      await prisma.order.update({
        where: {
          id: orderId,
        },
        data: {
          invoice_url: secure_url,
        },
      });
      console.log(`[Job ${data.id}] Order email job completed`);
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
