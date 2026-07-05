export interface BkashConfig {
  base_url: string;
  username: string;
  password: string;
  app_key: string;
  app_secret: string;
}

export interface CreatePaymentPayload {
  amount: number;
  callbackURL: string;
  orderID: string;
  payerReference: string;
}