import { uploadBufferToCloudinary } from "../../config/cloudinary.config";
import { generateOrderConfirmation } from "./invoice";

export const createInvoice = async (pdfPayload: any) => {
  const pdfBuffer = await generateOrderConfirmation(pdfPayload);
  const [cloudinaryResult] = await Promise.all([
    // pdfPayload.recipient.email &&
    //   sendMail({
    //     to: pdfPayload.recipient.email,
    //     subject: `Your Order Confirmation #${pdfPayload.order.orderNumber}`,
    //     templateName: "orderConfirmation",
    //     templateData: { orderNumber: pdfPayload.order.orderNumber },
    //     attachments: [
    //       {
    //         filename: `order-confirmation-${pdfPayload.order.orderNumber}.pdf`,
    //         content: pdfBuffer,
    //         contentType: "application/pdf",
    //       },
    //     ],
    //   }),

    uploadBufferToCloudinary(
      pdfBuffer,
      `order-confirmation-${pdfPayload.order.orderNumber}`,
    ),
  ]);
  if (!cloudinaryResult) {
    return;
  }
  const { secure_url } = cloudinaryResult;
  return secure_url;
};
