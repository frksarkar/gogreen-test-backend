import dotenv from "dotenv";
import path from "path";
import { validateEnv } from "./validateEnv";

dotenv.config({ path: path.join(process.cwd(), ".env") });
validateEnv();
export default {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  frontend_url: process.env.FRONTEND_URL as string,
  express_session_secret: process.env.EXPRESS_SESSION_SECRET as string,
  jwt: {
    access_secret: process.env.JWT_ACCESS_SECRET as string,
    refresh_secret: process.env.JWT_REFRESH_SECRET as string,
    access_expires: process.env.JWT_ACCESS_EXPIRES_IN as string,
    refresh_expires: process.env.JWT_REFRESH_EXPIRES_IN as string,
  },
  company: {
    name: process.env.COMPANY_NAME as string,
    address: process.env.COMPANY_ADDRESS as string,
    phone: process.env.COMPANY_PHONE as string,
    email: process.env.COMPANY_EMAIL as string,
  },
  bcrypt_salt_round: Number(process.env.BCRYPT_SALT_ROUND) as number,
  super_admin: {
    email: process.env.SUPER_ADMIN_EMAIL as string,
    password: process.env.SUPER_ADMIN_PASSWORD as string,
    role: process.env.SUPER_ADMIN_ROLE as string,
  },
  google: {
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
    callback_url: process.env.GOOGLE_CALLBACK_URL as string,
  },
  smtp: {
    host: process.env.SMTP_HOST as string,
    port: Number(process.env.SMTP_PORT) as number,
    user: process.env.SMTP_USER as string,
    from: process.env.SMTP_FROM as string,
    pass: process.env.SMTP_PASS as string,
  },
  redis: {
    host: process.env.REDIS_HOST as string,
    port: Number(process.env.REDIS_PORT) as number,
    password: process.env.REDIS_PASSWORD as string,
    username: process.env.REDIS_USERNAME as string,
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string,
  },
  ssl: {
    store_id: process.env.SSL_STORE_ID as string,
    store_pass: process.env.SSL_STORE_PASS as string,
    payment_api: process.env.SSL_PAYMENT_API as string,
    validation_api: process.env.SSL_VALIDATION_API as string,
    success_backend_url: process.env.SSL_SUCCESS_BACKEND_URL as string,
    fail_backend_url: process.env.SSL_FAIL_BACKEND_URL as string,
    cancel_backend_url: process.env.SSL_CANCEL_BACKEND_URL as string,
    success_frontend_url: process.env.SSL_SUCCESS_FRONTEND_URL as string,
    fail_frontend_url: process.env.SSL_FAIL_FRONTEND_URL as string,
    cancel_frontend_url: process.env.SSL_CANCEL_FRONTEND_URL as string,
  },
  bkash: {
    base_url: process.env.BKASH_BASE_URL as string,
    username: process.env.BKASH_USERNAME as string,
    password: process.env.BKASH_PASSWORD as string,
    api_key: process.env.BKASH_API_KEY as string,
    api_secret: process.env.BKASH_API_SECRET as string,
    callback_url: process.env.BKASH_CALLBACK_URL as string,
  },
  sms: {
    api_token: process.env.SMS_API_TOKEN as string,
    sid: process.env.SMS_SID as string,
    api_url: process.env.SMS_API_URL as string,
  },
  ai: {
    gemini_api_key: process.env.GEMINI_API_KEY as string,
    gemini_model: "gemini-2.5-flash",
    // mode: (process.env.NODE_ENV === "production" ? "PROD" : "TEST") as "PROD" | "TEST",
    mode: "PROD" as "PROD" | "TEST",
    // mode: "TEST" as "TEST" | "PROD",
    max_history: 10,
    retry_count: 2,
    timeout: 30000, // 30 seconds
    search_rate_limit: 10, // max requests per minute per user/IP
    search_result_limit: 20, // max products returned
    embedding_cache_ttl: 86400, // 24 hours in seconds
    search_timeout: 10000, // 10 seconds for AI filter extraction
    min_similarity_score: 0.5, // minimum similarity for image matching
    search_mode: (process.env.NODE_ENV === "production" ? "PROD" : "TEST") as
      | "PROD"
      | "TEST",
  },
};
