import { z } from "zod";

const createVendorHolidaySchema = z.object({
  
      storeId: z.string(),
      startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Start date must be a valid date",
      }),
      endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "End date must be a valid date",
      }),
      message: z.string().optional(),
      isActive: z.boolean().optional().default(false),
    })
    .refine(
      (data) => {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        return startDate < endDate;
      },
      {
        message: "Start date must be before end date",
        path: ["startDate"],
      },
    );

const updateVendorHolidaySchema = z.object({
  
      startDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Start date must be a valid date",
        })
        .optional(),
      endDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "End date must be a valid date",
        })
        .optional(),
      message: z.string().optional(),
      isActive: z.boolean().optional(),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          const startDate = new Date(data.startDate);
          const endDate = new Date(data.endDate);
          return startDate < endDate;
        }
        return true;
      },
      {
        message: "Start date must be before end date",
        path: ["startDate"],
      },
    );

export const HolidayValidation = {
  createVendorHolidaySchema,
  updateVendorHolidaySchema,
};
