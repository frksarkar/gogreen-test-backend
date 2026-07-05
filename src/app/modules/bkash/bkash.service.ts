import axios from "axios";
import { redisClient } from "../../config/redis.config";
import config from "../../config";
import ApiError from "../../errors/ApiError";
import { CreatePaymentPayload } from "./bkash.interface";
import httpStatus from "http-status";
import { prisma } from "../../shared/prisma";
import { sendMail } from "../../utils/transporter";
const TOKEN_KEY = "bkash:id_token";
const getToken = async (): Promise<string> => {
  const cached = await redisClient.get(TOKEN_KEY);
  if (cached) return cached;
  return grantToken();
};

const grantToken = async (): Promise<string> => {
  const { data } = await axios.post(
    `${config.bkash.base_url}/tokenized/checkout/token/grant`,
    {
      app_key: config.bkash.api_key,
      app_secret: config.bkash.api_secret,
    },
    {
      headers: {
        username: config.bkash.username,
        password: config.bkash.password,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );
  if (!data?.id_token) {
    throw new ApiError(httpStatus.BAD_GATEWAY, "Failed to obtain bkash token");
  }
  redisClient.set(TOKEN_KEY, data.id_token, "EX", 3600);
  return data.id_token;
};

const getAuthHeaders = async () => {
  const token = await getToken();
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
    "X-App-Key": config.bkash.api_key,
  };
};

const createPayment = async (payload: CreatePaymentPayload) => {
  if (payload.amount < 1) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid amount");
  }
  const { data } = await axios.post(
    `${config.bkash.base_url}/tokenized/checkout/create`,
    {
      mode: "0011",
      currency: "BDT",
      intent: "sale",
      amount: payload.amount.toFixed(2),
      callbackURL: payload.callbackURL,
      payerReference: payload.payerReference || "1",
      merchantInvoiceNumber: payload.orderID,
    },
    {
      headers: await getAuthHeaders(),
    },
  );
  if (!data?.bkashURL || !data?.paymentID) {
    throw new ApiError(httpStatus.BAD_GATEWAY, "Failed to create payment");
  }
  return data;
};

const bkashCallBack = async (query: Record<string, string>) => {
  const { paymentID, status } = query;
  if (status === "cancel" || status === "failure") {
    await prisma.payment.update({
      where: {
        transaction_id: paymentID,
      },
      data: {
        status: "FAILED",
      },
    });
    return { success: false, reason: status };
  }
  const executeData = await executePayment(paymentID);
  if (executeData?.statusCode !== "0000") {
    await prisma.payment.update({
      where: {
        transaction_id: paymentID,
      },
      data: {
        status: "FAILED",
      },
    });
    throw new ApiError(httpStatus.BAD_GATEWAY, "Failed to execute payment");
  }
  const trxID = executeData?.trxID;
  const vendorOrderId = executeData?.merchantInvoiceNumber;
  const { mailPayload } = await prisma.$transaction(async (tnx) => {
    await tnx.payment.update({
      where: {
        transaction_id: paymentID,
      },
      data: {
        status: "COMPLETED",
        transaction_id: trxID,
      },
    });
    const orderItems = await tnx.orderItem.findMany({
      where: { vendor_order_id: vendorOrderId },
      select: { product_name: true, quantity: true, price: true },
    });

    const products = orderItems.map((item) => ({
      name: item.product_name,
      quantity: item.quantity,
      price: item.price,
    }));

    const order = await tnx.order.findUnique({
      where: { id: vendorOrderId },
      select: {
        order_number: true,
        customer_name: true,
        customer_email: true,
        shipping_address: true,
        sub_total: true,
        total_amount: true,
        shipping_cost: true,
        tax: true,
        discount: true,
      },
    });

    const userAddress = order?.shipping_address
      ? await tnx.address.findUnique({ where: { id: order.shipping_address } })
      : null;

    return {
      mailPayload: order?.customer_email
        ? {
            to: order.customer_email,
            orderId: order.order_number,
            customerName: order.customer_name,
            orderItems: products,
            shippingCost: order.shipping_cost,
            subTotal: order.sub_total,
            totalAmount: order.total_amount,
            tax: order.tax,
            streetAddress: userAddress?.street_address,
            district: userAddress?.district,
            division: userAddress?.division,
          }
        : null,
    };
  });
  if (mailPayload) {
    await sendMail({
      to: mailPayload.to,
      subject: "Order confirmed",
      templateName: "orderConfirm",
      templateData: { ...mailPayload },
    });
  }
  return { success: true, reason: status };
};
const executePayment = async (paymentID: string) => {
  const { data } = await axios.post(
    `${config.bkash.base_url}/tokenized/checkout/execute`,
    { paymentID },
    { headers: await getAuthHeaders() },
  );
  return data;
};
const queryPayment = async (paymentID: string) => {
  const { data } = await axios.post(
    `${config.bkash.base_url}/tokenized/checkout/payment/status`,
    { paymentID },
    { headers: await getAuthHeaders() },
  );
  return data;
};

const searchPayment = async (trxID: string) => {
  try {
    const { data } = await axios.post(
      `${config.bkash.base_url}/tokenized/checkout/general/searchTran`,
      {
        trxID,
      },
      {
        headers: await getAuthHeaders(),
      },
    );
    return data;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_GATEWAY, "Failed to search payment");
  }
};
const refundPayment = async (
  paymentID: string,
  trxID: string,
  refundAmount: string,
  sku: string,
  reason: string,
) => {
  try {
    const { data } = await axios.post(
      `${config.bkash.base_url}/v2/tokenized-checkout/refund/payment/transaction`,
      {
        paymentID,
        trxID,
        refundAmount,
        sku,
        reason,
      },
      {
        headers: await getAuthHeaders(),
      },
    );
    return data;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_GATEWAY, "Failed to refund payment");
  }
};
const refundStatus = async (paymentID: string, trxID: string) => {
  const { data } = await axios.post(
    `${config.bkash.base_url}/v2/tokenized-checkout/refund/payment/status`,
    {
      paymentID,
      trxID,
    },
    {
      headers: await getAuthHeaders(),
    },
  );
  return data;
};
export const BkashService = {
  createPayment,
  executePayment,
  queryPayment,
  searchPayment,
  refundPayment,
  refundStatus,
  bkashCallBack,
};
