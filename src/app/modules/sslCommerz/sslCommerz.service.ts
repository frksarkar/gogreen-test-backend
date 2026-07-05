import axios from "axios";
import config from "../../config";
import { ISSLCommerz } from "./sslCommerz.interface";
import ApiError from "../../errors/ApiError";

const paymentInit = async (payload: ISSLCommerz) => {
  try {
    const data = {
      store_id: config.ssl.store_id,
      store_passwd: config.ssl.store_pass,
      total_amount: payload.amount,
      currency: "BDT",
      tran_id: payload.transactionId,
      success_url: `${config.ssl.success_backend_url}?transactionId=${payload.transactionId}&orderId=${payload.orderId}`,
      fail_url: `${config.ssl.fail_backend_url}?transactionId=${payload.transactionId}&orderId=${payload.orderId}`,
      cancel_url: `${config.ssl.cancel_backend_url}?transactionId=${payload.transactionId}&orderId=${payload.orderId}`,
      // ipn_url: "",
      shipping_method: "CDO",
      product_name: "Sony XM6",
      product_category: "Electronics",
      product_profile: "General",
      cus_name: payload.name,
      cus_email: payload?.email,
      cus_phone: payload.phone,
      cus_add1: payload.address,
      cus_add2: payload.address,
      cus_city: payload.city,
      cus_state: payload.state,
      cus_postcode: payload.postCode,
      cus_country: "Bangladesh",
      cus_fax: "018837483748",
      ship_name: "N/A",
      ship_add1: "N/A",
      ship_add2: "N/A",
      ship_city: "Dhaka",
      ship_state: "N/A",
      ship_postcode: 1000,
      ship_country: "Bangladesh",
    };
    const response = await axios({
      method: "POST",
      url: config.ssl.payment_api,
      data: data,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  } catch (error) {
    throw new ApiError(404, "SSL Commerz Payment Init Error");
  }
};

export const SSLService = {
  paymentInit,
};
