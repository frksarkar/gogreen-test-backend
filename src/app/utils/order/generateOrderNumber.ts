import crypto from "crypto";
// ORD-20260308-A1B2C3D4E5F6
export const generateOrderNumber = (): string => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const randomPart = crypto.randomBytes(5).toString("hex").toUpperCase();
  return `ORD-${dateStr}-${randomPart}`;
};
