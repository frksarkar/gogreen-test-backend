// app/config/validateEnv.ts

type EnvSchema = {
  [key: string]: {
    required: boolean;
    type?: "string" | "number" | "boolean";
    default?: string;
  };
};

const envSchema: EnvSchema = {
  // Core
  NODE_ENV: { required: true },
  PORT: { required: true, type: "number" },
  DATABASE_URL: { required: true },
  FRONTEND_URL: { required: true },

  // Session & Auth
  EXPRESS_SESSION_SECRET: { required: true },
  JWT_ACCESS_SECRET: { required: true },
  JWT_REFRESH_SECRET: { required: true },
  JWT_ACCESS_EXPIRES_IN: { required: true },
  JWT_REFRESH_EXPIRES_IN: { required: true },

  // Company
  COMPANY_NAME: { required: true },
  COMPANY_ADDRESS: { required: true },
  COMPANY_PHONE: { required: true },
  COMPANY_EMAIL: { required: true },

  // Bcrypt
  BCRYPT_SALT_ROUND: { required: true, type: "number" },

  // Super Admin
  SUPER_ADMIN_EMAIL: { required: true },
  SUPER_ADMIN_PASSWORD: { required: true },
  SUPER_ADMIN_ROLE: { required: true },

  // Google OAuth
  GOOGLE_CLIENT_ID: { required: true },
  GOOGLE_CLIENT_SECRET: { required: true },
  GOOGLE_CALLBACK_URL: { required: true },

  // SMTP
  SMTP_HOST: { required: true },
  SMTP_PORT: { required: true, type: "number" },
  SMTP_USER: { required: true },
  SMTP_FROM: { required: true },
  SMTP_PASS: { required: true },

  // Redis
  REDIS_HOST: { required: true },
  REDIS_PORT: { required: true, type: "number" },
  REDIS_PASSWORD: { required: false },
  REDIS_USERNAME: { required: false },

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: { required: true },
  CLOUDINARY_API_KEY: { required: true },
  CLOUDINARY_API_SECRET: { required: true },

  // SSLCommerz
  SSL_STORE_ID: { required: true },
  SSL_STORE_PASS: { required: true },
  SSL_PAYMENT_API: { required: true },
  SSL_VALIDATION_API: { required: true },
  SSL_SUCCESS_BACKEND_URL: { required: true },
  SSL_FAIL_BACKEND_URL: { required: true },
  SSL_CANCEL_BACKEND_URL: { required: true },
  SSL_SUCCESS_FRONTEND_URL: { required: true },
  SSL_FAIL_FRONTEND_URL: { required: true },
  SSL_CANCEL_FRONTEND_URL: { required: true },

  // bKash
  BKASH_BASE_URL: { required: true },
  BKASH_USERNAME: { required: true },
  BKASH_PASSWORD: { required: true },
  BKASH_API_KEY: { required: true },
  BKASH_API_SECRET: { required: true },
  BKASH_CALLBACK_URL: { required: true },

  // AI
  GEMINI_API_KEY: { required: true },
};

export const validateEnv = (): void => {
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const [key, rules] of Object.entries(envSchema)) {
    const value = process.env[key];

    // Check missing required vars
    if (rules.required && (value === undefined || value === "")) {
      missing.push(key);
      continue;
    }

    // Check type validity
    if (value && rules.type === "number" && isNaN(Number(value))) {
      invalid.push(`${key} (expected number, got "${value}")`);
    }
  }

  // Report all issues at once
  if (missing.length > 0 || invalid.length > 0) {
    console.error("\n❌ Environment variable validation failed:\n");

    if (missing.length > 0) {
      console.error("  Missing required variables:");
      missing.forEach((key) => console.error(`    - ${key}`));
    }

    if (invalid.length > 0) {
      console.error("\n  Invalid variable types:");
      invalid.forEach((msg) => console.error(`    - ${msg}`));
    }

    console.error(
      "\n  👉 Check your .env file and ensure all variables are set.\n",
    );
    process.exit(1); // Hard stop — don't run with broken config
  }

  console.log("✅ Environment variables validated successfully.");
};
