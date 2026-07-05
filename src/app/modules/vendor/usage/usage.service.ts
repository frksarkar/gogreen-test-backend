import { prisma } from "../../../shared/prisma";
import {
  VendorActivityService,
  VendorActivityActions,
} from "../activity/activity.service";

const getVendorUsageCounter = async (vendorId: string) => {
  const usageCounter = await prisma.vendorUsageCounter.findUnique({
    where: { vendorId },
    include: {
      vendor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!usageCounter) {
    // Create default usage counter if it doesn't exist
    return await prisma.vendorUsageCounter.create({
      data: {
        vendorId,
        orderProcessed: 0,
        activeProductCount: 0,
      },
      include: {
        vendor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  return usageCounter;
};

const getVendorUsageLimit = async (vendorId: string) => {
  const usageLimit = await prisma.vendorUsageLimit.findUnique({
    where: { vendorId },
    include: {
      vendor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!usageLimit) {
    // Create default usage limit if it doesn't exist
    return await prisma.vendorUsageLimit.create({
      data: {
        vendorId,
        maxProductCount: 100,
        dailyOrderLimit: 50,
        maxCategoryLimit: 10,
        maxBrandLimit: 5,
        maxStaffLimit: 3,
      },
      include: {
        vendor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  return usageLimit;
};

const updateVendorUsageLimit = async (
  vendorId: string,
  payload: {
    maxProductCount?: number;
    dailyOrderLimit?: number;
    maxCategoryLimit?: number;
    maxBrandLimit?: number;
    maxStaffLimit?: number;
  },
) => {
  const updatedLimit = await prisma.vendorUsageLimit.upsert({
    where: { vendorId },
    update: {
      ...payload,
      updatedAt: new Date(),
    },
    create: {
      vendorId,
      maxProductCount: payload.maxProductCount ?? 100,
      dailyOrderLimit: payload.dailyOrderLimit ?? 50,
      maxCategoryLimit: payload.maxCategoryLimit ?? 10,
      maxBrandLimit: payload.maxBrandLimit ?? 5,
      maxStaffLimit: payload.maxStaffLimit ?? 3,
    },
    include: {
      vendor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  // Log activity
  await VendorActivityService.logVendorActivity(
    vendorId,
    undefined,
    VendorActivityActions.USAGE_LIMIT_UPDATED,
    `Usage limits updated: ${JSON.stringify(payload)}`,
  );

  return updatedLimit;
};

const incrementVendorUsageCounter = async (
  vendorId: string,
  payload: {
    orderProcessed?: number;
    activeProductCount?: number;
  },
) => {
  const updatedCounter = await prisma.vendorUsageCounter.upsert({
    where: { vendorId },
    update: {
      orderProcessed: {
        increment: payload.orderProcessed ?? 0,
      },
      activeProductCount: {
        increment: payload.activeProductCount ?? 0,
      },
      updatedAt: new Date(),
    },
    create: {
      vendorId,
      orderProcessed: payload.orderProcessed ?? 0,
      activeProductCount: payload.activeProductCount ?? 0,
    },
    include: {
      vendor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  // Log activity
  await VendorActivityService.logVendorActivity(
    vendorId,
    undefined,
    VendorActivityActions.USAGE_COUNTER_UPDATED,
    `Usage counters updated: ${JSON.stringify(payload)}`,
  );

  return updatedCounter;
};

const getAllVendorUsageCounters = async () => {
  return await prisma.vendorUsageCounter.findMany({
    include: {
      vendor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
};

const getAllVendorUsageLimits = async () => {
  return await prisma.vendorUsageLimit.findMany({
    include: {
      vendor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
};

export const UsageService = {
  getVendorUsageCounter,
  getVendorUsageLimit,
  updateVendorUsageLimit,
  incrementVendorUsageCounter,
  getAllVendorUsageCounters,
  getAllVendorUsageLimits,
};
