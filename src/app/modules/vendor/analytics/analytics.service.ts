import ApiError from "../../../errors/ApiError";
import { prisma } from "../../../shared/prisma";

type Period = "7d" | "1m" | "3m" | "6m" | "12m" | "all_time";

const getDateRange = (period: Period) => {
  const now = new Date();
  const from = new Date();

  switch (period) {
    case "7d":
      from.setDate(now.getDate() - 7);
      break;
    case "1m":
      from.setMonth(now.getMonth() - 1);
      break;
    case "3m":
      from.setMonth(now.getMonth() - 3);
      break;
    case "6m":
      from.setMonth(now.getMonth() - 6);
      break;
    case "12m":
      from.setMonth(now.getMonth() - 12);
      break;
    case "all_time":
      from.setFullYear(now.getFullYear() - 10);
      break;
  }

  return { from, to: now };
};

const resolveVendor = async (userId: string) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");
  return vendor;
};

const getVendorDashboardOverview = async (userId: string) => {
  const vendor = await resolveVendor(userId);

  const [
    stores,
    totalOrders,
    completedOrders,
    pendingOrders,
    cancelledOrders,
    totalProducts,
    activeProducts,
    wallet,
    totalFollowers,
    reviewAgg,
    staffCount,
    usage,
  ] = await Promise.all([
    prisma.store.findMany({
      where: { vendorId: vendor.id, isDeleted: false },
      select: {
        id: true,
        shopName: true,
        status: true,
        shopLogo: true,
        shopBanner: true,
        address: true,
        shopDescription: true,
        slug: true,
      },
    }),
    prisma.vendorOrder.count({ where: { vendorId: vendor.id } }),
    prisma.vendorOrder.count({
      where: { vendorId: vendor.id, status: "DELIVERED" },
    }),
    prisma.vendorOrder.count({
      where: { vendorId: vendor.id, status: "PENDING" },
    }),
    prisma.vendorOrder.count({
      where: { vendorId: vendor.id, status: "CANCELLED" },
    }),
    prisma.product.count({ where: { vendorId: vendor.id, isDeleted: false } }),
    prisma.product.count({
      where: { vendorId: vendor.id, isDeleted: false, status: "IN_STOCK" },
    }),
    prisma.vendorWallet.findUnique({ where: { vendorId: vendor.id } }),
    prisma.vendorFollower.count({ where: { store: { vendorId: vendor.id } } }),
    prisma.vendorReview.aggregate({
      where: { store: { vendorId: vendor.id }, isDeleted: false },
      _avg: { rating: true },
      _count: { id: true },
    }),
    prisma.vendorStaff.count({
      where: { vendorId: vendor.id, isDeleted: false },
    }),
    prisma.vendorUsageCounter.findUnique({ where: { vendorId: vendor.id } }),
  ]);

  return {
    vendor: {
      id: vendor.id,
      rank: vendor.rank,
      experience: vendor.experience,
      status: vendor.status,
    },
    stores: stores.length,
    storeList: stores,
    orders: {
      total: totalOrders,
      completed: completedOrders,
      pending: pendingOrders,
      cancelled: cancelledOrders,
      successRate:
        totalOrders > 0
          ? ((completedOrders / totalOrders) * 100).toFixed(1)
          : "0",
    },
    products: {
      total: totalProducts,
      active: activeProducts,
      inactive: totalProducts - activeProducts,
    },
    finance: {
      currentBalance: wallet?.currentBalance ?? 0,
      pendingBalance: wallet?.pendingBalance ?? 0,
      totalEarned: wallet?.totalEarned ?? 0,
      totalWithdrawn: wallet?.totalWithdrawn ?? 0,
    },
    customers: {
      totalFollowers,
      avgRating: reviewAgg._avg.rating
        ? parseFloat(reviewAgg._avg.rating.toFixed(2))
        : 0,
      totalReviews: reviewAgg._count.id,
    },
    staff: { total: staffCount },
    usage,
  };
};

const getVendorOrderStats = async (
  userId: string,
  period: Period = "1m",
  storeId?: string,
) => {
  const vendor = await resolveVendor(userId);
  const { from } = getDateRange(period);

  const where: any = {
    vendorId: vendor.id,
    ...(storeId ? { storeId } : {}),
  };

  const [allOrders, byStatus, recentOrders] = await Promise.all([
    // Orders for trend (filtered by period)
    prisma.vendorOrder.findMany({
      where: { ...where, createdAt: { gte: from } },
      select: {
        id: true,
        status: true,
        total_amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),

    // Status summary (ALL TIME or keep period? → optional)
    prisma.vendorOrder.groupBy({
      by: ["status"],
      where: { ...where, createdAt: { gte: from } }, // 👉 keep consistent
      _count: { id: true },
      _sum: { total_amount: true },
    }),

    // Recent orders
    prisma.vendorOrder.findMany({
      where,
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        orderItems: {
          select: {
            product_name: true,
            quantity: true,
            price: true,
          },
        },
        store: { select: { shopName: true } },
      },
    }),
  ]);

  // ✅ Trend grouping (UPDATED LOGIC)
  const trendMap: Record<string, { count: number; revenue: number }> = {};

  for (const o of allOrders) {
    const d = new Date(o.createdAt);
    let key: string;

    if (period === "7d") {
      key = d.toISOString().slice(0, 10); // daily
    } else if (period === "1m" || period === "3m") {
      key = d.toISOString().slice(0, 10); // daily
    } else if (period === "6m" || period === "12m") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // monthly
    } else {
      key = String(d.getFullYear()); // yearly
    }

    if (!trendMap[key]) {
      trendMap[key] = { count: 0, revenue: 0 };
    }

    trendMap[key].count += 1;
    trendMap[key].revenue += o.total_amount;
  }

  const trend = Object.entries(trendMap)
    .sort(([a], [b]) => {
      return new Date(a).getTime() - new Date(b).getTime();
    })
    .map(([label, v]) => ({
      label,
      orderCount: v.count,
      revenue: Number(v.revenue.toFixed(2)),
    }));

  // ✅ Status summary
  const statusSummary = byStatus.map((s) => ({
    status: s.status,
    count: s._count.id,
    totalRevenue: Number((s._sum.total_amount ?? 0).toFixed(2)),
  }));

  return {
    trend,
    statusSummary,
    recentOrders,
  };
};

// update by nahid
const getVendorRevenueStats = async (userId: string, period: Period = "6m") => {
  const vendor = await resolveVendor(userId);
  const { from } = getDateRange(period);

  const [wallet, transactions, payouts, snapshots] = await Promise.all([
    prisma.vendorWallet.findUnique({
      where: { vendorId: vendor.id },
    }),

    prisma.vendorTransaction.findMany({
      where: {
        vendorId: vendor.id,
        createdAt: { gte: from },
      },
      select: {
        amount: true,
        type: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),

    prisma.vendorPayout.findMany({
      where: {
        vendorId: vendor.id,
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    prisma.vendorSnapshot.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  // =====================================================
  // 📊 GROUP REVENUE
  // =====================================================
  const revMap: Record<string, number> = {};

  for (const t of transactions) {
    if (t.type !== "CREDIT") continue;

    const d = new Date(t.createdAt);
    let key: string;

    if (period === "7d") {
      key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    } else if (period === "1m" || period === "3m") {
      key = d.toISOString().slice(0, 10); // daily
    } else if (period === "6m" || period === "12m") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
    } else {
      key = String(d.getFullYear());
    }

    revMap[key] = (revMap[key] ?? 0) + t.amount;
  }

  // =====================================================
  // 🧠 SAFE SORTING (FIXED)
  // =====================================================
  const toTime = (key: string) => {
    if (key.length === 10) return new Date(key).getTime(); // YYYY-MM-DD
    if (key.length === 7) return new Date(`${key}-01`).getTime(); // YYYY-MM
    return new Date(`${key}-01-01`).getTime(); // YYYY
  };

  const revenueTrend = Object.entries(revMap)
    .sort(([a], [b]) => toTime(a) - toTime(b))
    .map(([label, revenue]) => ({
      label,
      revenue: Number(revenue.toFixed(2)),
    }));

  // =====================================================
  // 💰 PAYOUT STATS
  // =====================================================
  const payoutStats = {
    pending: payouts
      .filter((p) => p.status === "PENDING")
      .reduce((s, p) => s + p.amount, 0),

    completed: payouts
      .filter((p) => p.status === "COMPLETED")
      .reduce((s, p) => s + p.amount, 0),

    failed: payouts
      .filter((p) => p.status === "FAILED")
      .reduce((s, p) => s + p.amount, 0),

    recentPayouts: payouts,
  };

  // =====================================================
  // 📦 RESPONSE
  // =====================================================
  return {
    wallet,
    revenueTrend,
    payoutStats,
    balanceHistory: snapshots.reverse(),
  };
};

const getVendorProductStats = async (userId: string, storeId?: string) => {
  const vendor = await resolveVendor(userId);

  const whereBase: any = {
    vendorId: vendor.id,
    isDeleted: false,
    ...(storeId ? { storeId } : {}),
  };

  const [total, active, inactive, outOfStock, topByOrders] = await Promise.all([
    prisma.product.count({ where: whereBase }),
    prisma.product.count({ where: { ...whereBase } }),
    prisma.product.count({ where: { ...whereBase } }),
    prisma.product.count({
      where: {
        ...whereBase,
        variants: { every: { stock: 0 } },
      },
    }),
    // Top 10 products by revenue via order items
    prisma.orderItem.groupBy({
      by: ["product_id"],
      where: {
        productId: { vendorId: vendor.id, ...(storeId ? { storeId } : {}) },
      },
      _sum: { price: true, quantity: true },
      _count: { id: true },
      orderBy: { _sum: { price: "desc" } },
      take: 10,
    }),
  ]);

  // Enrich top products with names
  const topProductIds = topByOrders.map((t) => t.product_id);
  const topProducts = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true },
  });
  const topProductMap = Object.fromEntries(topProducts.map((p) => [p.id, p]));

  const topProductsEnriched = topByOrders.map((t) => ({
    product: topProductMap[t.product_id] ?? null,
    totalRevenue: parseFloat(((t._sum.price ?? 0) * 1).toFixed(2)),
    totalQuantity: t._sum.quantity ?? 0,
    orderCount: t._count.id,
  }));

  return {
    summary: { total, outOfStock },
    topProducts: topProductsEnriched,
  };
};

const getVendorCustomerStats = async (userId: string, storeId?: string) => {
  const vendor = await resolveVendor(userId);

  const storeWhere: any = { vendorId: vendor.id, isDeleted: false };
  if (storeId) storeWhere.id = storeId;

  const stores = await prisma.store.findMany({
    where: storeWhere,
    select: {
      id: true,
      shopName: true,
      viewCount: true,
    },
  });
  const storeIds = stores.map((s) => s.id);

  const [totalFollowers, recentFollowers, reviewAgg, ratingDist] =
    await Promise.all([
      prisma.vendorFollower.count({ where: { storeId: { in: storeIds } } }),
      prisma.vendorFollower.findMany({
        where: { storeId: { in: storeIds } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true, profile_photo: true } } },
      }),
      prisma.vendorReview.aggregate({
        where: { storeId: { in: storeIds }, isDeleted: false },
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.vendorReview.groupBy({
        by: ["rating"],
        where: { storeId: { in: storeIds }, isDeleted: false },
        _count: { id: true },
        orderBy: { rating: "asc" },
      }),
    ]);

  const totalViews = stores.reduce((s, st) => s + st.viewCount, 0);

  return {
    stores: stores.map((s) => ({ ...s })),
    totalViews,
    followers: {
      total: totalFollowers,
      recent: recentFollowers,
    },
    reviews: {
      total: reviewAgg._count.id,
      avgRating: reviewAgg._avg.rating
        ? parseFloat(reviewAgg._avg.rating.toFixed(2))
        : 0,
      ratingDistribution: ratingDist.map((r) => ({
        rating: r.rating,
        count: r._count.id,
      })),
    },
  };
};

// ─── 6. Marketing Analytics ────────────────────────────────────
const getVendorMarketingStats = async (userId: string, storeId?: string) => {
  const vendor = await resolveVendor(userId);

  const storeFilter: any = { store: { vendor: { userId } }, isDeleted: false };
  if (storeId) storeFilter.storeId = storeId;

  const now = new Date();
  const [coupons, promotions] = await Promise.all([
    prisma.vendorCoupon.findMany({ where: storeFilter }),
    prisma.vendorPromotion.findMany({ where: storeFilter }),
  ]);

  const activeCoupons = coupons.filter(
    (c) => c.isActive && new Date(c.endDate) > now,
  );
  const expiredCoupons = coupons.filter(
    (c) => !c.isActive || new Date(c.endDate) <= now,
  );
  const activePromotions = promotions.filter(
    (p) => p.isActive && new Date(p.endDate) > now,
  );
  const expiredPromotions = promotions.filter(
    (p) => !p.isActive || new Date(p.endDate) <= now,
  );

  return {
    coupons: {
      total: coupons.length,
      active: activeCoupons.length,
      expired: expiredCoupons.length,
      list: coupons,
    },
    promotions: {
      total: promotions.length,
      active: activePromotions.length,
      expired: expiredPromotions.length,
      list: promotions,
    },
  };
};

// ─── 7. Store-level Overview ────────────────────────────────────
const getVendorStoreStats = async (userId: string) => {
  const vendor = await resolveVendor(userId);

  const stores = await prisma.store.findMany({
    where: { vendorId: vendor.id, isDeleted: false },
    include: {
      performance: true,
      _count: {
        select: {
          orders: true,
          products: true,
          followers: true,
          reviews: true,
          staff: true,
          coupons: true,
          promotions: true,
        },
      },
    },
  });

  const result = await Promise.all(
    stores.map(async (store) => {
      const reviewAgg = await prisma.vendorReview.aggregate({
        where: { storeId: store.id, isDeleted: false },
        _avg: { rating: true },
      });
      const revenue = await prisma.vendorOrder.aggregate({
        where: { storeId: store.id, status: "DELIVERED" },
        _sum: { total_amount: true },
      });
      return {
        storeId: store.id,
        shopName: store.shopName,
        status: store.status,
        viewCount: store.viewCount,
        performance: store.performance,
        counts: store._count,
        avgRating: reviewAgg._avg.rating
          ? parseFloat(reviewAgg._avg.rating.toFixed(2))
          : 0,
        totalRevenue: parseFloat((revenue._sum.total_amount ?? 0).toFixed(2)),
      };
    }),
  );

  return result;
};

// ─── 8. Finance Summary (enhanced) ─────────────────────────────
const getVendorFinanceSummary = async (userId: string) => {
  const vendor = await resolveVendor(userId);

  const [wallet, payoutMethods, recentTransactions, pendingPayouts] =
    await Promise.all([
      prisma.vendorWallet.findUnique({ where: { vendorId: vendor.id } }),
      prisma.vendorPayoutMethod.findMany({
        where: { vendorId: vendor.id, isDeleted: false },
      }),
      prisma.vendorTransaction.findMany({
        where: { vendorId: vendor.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { store: { select: { shopName: true } } },
      }),
      prisma.vendorPayout.findMany({
        where: { vendorId: vendor.id, status: "PENDING", isDeleted: false },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return {
    wallet,
    payoutMethods,
    recentTransactions,
    pendingPayouts,
  };
};

// ─── OLD endpoints kept intact ──────────────────────────────────
const getVendorPerformance = async (userId: string, storeId: string) => {
  const store = await prisma.store.findFirst({
    where: { id: storeId, vendor: { userId } },
  });
  if (!store) throw new ApiError(404, "Store not found or unauthorized");
  return await prisma.vendorPerformance.findUnique({
    where: { storeId: store.id },
  });
};

const getVendorExperienceHistory = async (userId: string) => {
  const vendor = await resolveVendor(userId);
  return await prisma.vendorExperienceHistory.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
  });
};

const getVendorSnapshots = async (userId: string) => {
  const vendor = await resolveVendor(userId);
  return await prisma.vendorSnapshot.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
  });
};

const getVendorUsage = async (userId: string) => {
  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    include: { counter: true, limits: true },
  });
  if (!vendor) throw new ApiError(404, "Vendor not found");
  return { counter: vendor.counter, limits: vendor.limits };
};

const getVendorActivityLogs = async (userId: string, storeId?: string) => {
  const vendor = await resolveVendor(userId);
  return await prisma.vendorActivityLog.findMany({
    where: { vendorId: vendor.id, ...(storeId ? { storeId } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { store: { select: { shopName: true } } },
  });
};

const getVendorRankRewards = async (userId: string) => {
  const vendor = await resolveVendor(userId);
  return await prisma.vendorRankReward.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
  });
};

const getVendorCommission = async (userId: string) => {
  const vendor = await resolveVendor(userId);
  return await prisma.vendorCommission.findUnique({
    where: { vendorId: vendor.id },
  });
};

export const AnalyticsService = {
  // new
  getVendorDashboardOverview,
  getVendorOrderStats,
  getVendorRevenueStats,
  getVendorProductStats,
  getVendorCustomerStats,
  getVendorMarketingStats,
  getVendorStoreStats,
  getVendorFinanceSummary,
  // existing
  getVendorPerformance,
  getVendorExperienceHistory,
  getVendorSnapshots,
  getVendorUsage,
  getVendorActivityLogs,
  getVendorRankRewards,
  getVendorCommission,
};
