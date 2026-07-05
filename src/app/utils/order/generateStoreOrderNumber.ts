import crypto from "crypto";
// ORD-20260308-A1B2C3D4E5F6-8F3A2B1C
export const generateStoreOrderId = (
  orderNumber: string,
  storeId: string,
): string => {
  const shortStoreId = crypto
    .createHash("sha256")
    .update(storeId)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
  return `${orderNumber.slice(0, 8)}-${shortStoreId}`;
};
