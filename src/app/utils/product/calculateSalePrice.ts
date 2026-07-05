import { DiscountType } from '@prisma/client';
export const calculateSalePrice = (
      mainPrice: number,
      type: DiscountType,
      value: number,
    ) => {
      if (type === "PERCENT") {
        return mainPrice - (mainPrice * value) / 100;
      }
      return mainPrice - value;
    };