import { prisma } from "../../../shared/prisma";

// ─── helpers ─────────────────────────────────────────────────────
const getDateRange = (period: "daily" | "weekly" | "monthly" | "yearly") => {
  const now = new Date();
  const from = new Date();
  if (period === "daily") from.setDate(now.getDate() - 30);
  else if (period === "weekly") from.setDate(now.getDate() - 84); // 12 weeks
  else if (period === "monthly") from.setMonth(now.getMonth() - 12);
  else from.setFullYear(now.getFullYear() - 5);
  return { from, to: now };
};

const buildTrend = (
  items: { createdAt: Date; amount?: number | null }[],
  period: "daily" | "weekly" | "monthly" | "yearly",
  valueKey: "amount" | "count" = "count",
) => {
  const map: Record<string, { count: number; amount: number }> = {};
  for (const item of items) {
    const d = new Date(item.createdAt);
    let key: string;
    if (period === "daily") key = d.toISOString().slice(0, 10);
    else if (period === "weekly") {
      const w = new Date(d); w.setDate(d.getDate() - d.getDay());
      key = w.toISOString().slice(0, 10);
    } else if (period === "monthly") key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    else key = String(d.getFullYear());
    if (!map[key]) map[key] = { count: 0, amount: 0 };
    map[key].count++;
    map[key].amount += (item as any).amount ?? 0;
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, v]) => ({ label, count: v.count, amount: parseFloat(v.amount.toFixed(2)) }));
};

// ─── 1. Platform Overview ─────────────────────────────────────
const getAdminOverview = async () => {
  const [
    totalVendors,
    activeVendors,
    pendingVendors,
    totalStores,
    activeStores,
    totalOrders,
    completedOrders,
    pendingOrders,
    cancelledOrders,
    totalProducts,
    totalUsers,
    totalRevenue,
    pendingPayouts,
  ] = await Promise.all([
    prisma.vendor.count({ where: { isDeleted: false } }),
    prisma.vendor.count({ where: { isDeleted: false, status: "APPROVED" } }),
    prisma.vendor.count({ where: { isDeleted: false, status: "PENDING" } }),
    prisma.store.count({ where: { isDeleted: false } }),
    prisma.store.count({ where: { isDeleted: false, status: "ACTIVE" } }),
    prisma.vendorOrder.count(),
    prisma.vendorOrder.count({ where: { status: "DELIVERED" } }),
    prisma.vendorOrder.count({ where: { status: "PENDING" } }),
    prisma.vendorOrder.count({ where: { status: "CANCELLED" } }),
    prisma.product.count({ where: { isDeleted: false } }),
    prisma.user.count({ where: { isDeleted: false } }),
    prisma.vendorWallet.aggregate({ _sum: { totalEarned: true } }),
    prisma.vendorPayout.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  return {
    vendors: {
      total: totalVendors,
      active: activeVendors,
      pending: pendingVendors,
      suspended: totalVendors - activeVendors - pendingVendors,
    },
    stores: { total: totalStores, active: activeStores, inactive: totalStores - activeStores },
    orders: {
      total: totalOrders,
      completed: completedOrders,
      pending: pendingOrders,
      cancelled: cancelledOrders,
      successRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : "0",
    },
    products: { total: totalProducts },
    users: { total: totalUsers },
    finance: {
      totalPlatformRevenue: parseFloat((totalRevenue._sum.totalEarned ?? 0).toFixed(2)),
      pendingPayoutsAmount: parseFloat((pendingPayouts._sum.amount ?? 0).toFixed(2)),
      pendingPayoutsCount: pendingPayouts._count.id,
    },
  };
};

// ─── 2. Vendor Stats ──────────────────────────────────────────
const getAdminVendorStats = async () => {
  const [byStatus, byRank, recentVendors] = await Promise.all([
    prisma.vendor.groupBy({
      by: ["status"],
      where: { isDeleted: false },
      _count: { id: true },
    }),
    prisma.vendor.groupBy({
      by: ["rank"],
      where: { isDeleted: false },
      _count: { id: true },
    }),
    prisma.vendor.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { name: true, email: true, profile_photo: true } },
        store: { select: { shopName: true, status: true } },
        wallet: { select: { currentBalance: true, totalEarned: true } },
      },
    }),
  ]);

  return {
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
    byRank: byRank.map((r) => ({ rank: r.rank, count: r._count.id })),
    recentVendors,
  };
};

// ─── 3. Order Trends ─────────────────────────────────────────
const getAdminOrderStats = async (
  period: "daily" | "weekly" | "monthly" | "yearly" = "monthly",
) => {
  const { from } = getDateRange(period);

  const [allOrders, byStatus, topStores] = await Promise.all([
    prisma.vendorOrder.findMany({
      where: { createdAt: { gte: from } },
      select: { id: true, status: true, total_amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.vendorOrder.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { total_amount: true },
    }),
    prisma.vendorOrder.groupBy({
      by: ["storeId"],
      _count: { id: true },
      _sum: { total_amount: true },
      orderBy: { _sum: { total_amount: "desc" } },
      take: 10,
      where: { storeId: { not: null } },
    }),
  ]);

  const trend = buildTrend(
    allOrders.map((o) => ({ createdAt: o.createdAt, amount: o.total_amount })),
    period,
  );

  // Enrich top stores
  const storeIds = topStores.map((s) => s.storeId).filter(Boolean) as string[];
  const storeNames = await prisma.store.findMany({
    where: { id: { in: storeIds } },
    select: { id: true, shopName: true },
  });
  const storeMap = Object.fromEntries(storeNames.map((s) => [s.id, s.shopName]));

  return {
    trend,
    byStatus: byStatus.map((s) => ({
      status: s.status,
      count: s._count.id,
      revenue: parseFloat((s._sum.total_amount ?? 0).toFixed(2)),
    })),
    topStoresByRevenue: topStores.map((s) => ({
      storeId: s.storeId,
      storeName: storeMap[s.storeId!] ?? "Unknown",
      orderCount: s._count.id,
      totalRevenue: parseFloat((s._sum.total_amount ?? 0).toFixed(2)),
    })),
  };
};

// ─── 4. Platform Finance Stats ───────────────────────────────
const getAdminFinanceStats = async (
  period: "daily" | "weekly" | "monthly" | "yearly" = "monthly",
) => {
  const { from } = getDateRange(period);

  const [payouts, allWallets, recentTransactions, commissions] = await Promise.all([
    prisma.vendorPayout.findMany({
      where: { createdAt: { gte: from } },
      select: { amount: true, status: true, createdAt: true, method: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.vendorWallet.aggregate({
      _sum: { totalEarned: true, totalWithdrawn: true, currentBalance: true, pendingBalance: true },
    }),
    prisma.vendorTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        vendor: { include: { user: { select: { name: true, email: true } } } },
        store: { select: { shopName: true } },
      },
    }),
    prisma.vendorCommission.aggregate({
      _avg: { commissionRate: true },
      _count: { id: true },
    }),
  ]);

  const payoutTrend = buildTrend(
    payouts.map((p) => ({ createdAt: p.createdAt, amount: p.amount })),
    period,
  );

  const payoutByStatus = payouts.reduce(
    (acc: Record<string, number>, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + p.amount;
      return acc;
    },
    {},
  );

  return {
    platformTotals: {
      totalEarned: parseFloat((allWallets._sum.totalEarned ?? 0).toFixed(2)),
      totalWithdrawn: parseFloat((allWallets._sum.totalWithdrawn ?? 0).toFixed(2)),
      totalCurrentBalance: parseFloat((allWallets._sum.currentBalance ?? 0).toFixed(2)),
      totalPendingBalance: parseFloat((allWallets._sum.pendingBalance ?? 0).toFixed(2)),
    },
    payoutTrend,
    payoutByStatus,
    recentTransactions,
    commission: {
      avgRate: commissions._avg.commissionRate
        ? parseFloat(commissions._avg.commissionRate.toFixed(2))
        : 0,
      vendorsWithCustomRate: commissions._count.id,
    },
  };
};

// ─── 5. Top Vendors ──────────────────────────────────────────
const getAdminTopVendors = async (
  sortBy: "revenue" | "orders" | "rating" = "revenue",
  limit = 10,
) => {
  if (sortBy === "revenue") {
    const topWallets = await prisma.vendorWallet.findMany({
      orderBy: { totalEarned: "desc" },
      take: limit,
      include: {
        vendor: {
          include: {
            user: { select: { name: true, email: true, profile_photo: true } },
            store: { select: { shopName: true, status: true } },
          },
        },
      },
    });
    return topWallets.map((w) => ({
      vendor: w.vendor,
      totalEarned: w.totalEarned,
      currentBalance: w.currentBalance,
    }));
  }

  if (sortBy === "orders") {
    const topByOrders = await prisma.vendorOrder.groupBy({
      by: ["vendorId"],
      _count: { id: true },
      _sum: { total_amount: true },
      orderBy: { _count: { id: "desc" } },
      take: limit,
      where: { vendorId: { not: null } },
    });
    const vendorIds = topByOrders.map((v) => v.vendorId).filter(Boolean) as string[];
    const vendors = await prisma.vendor.findMany({
      where: { id: { in: vendorIds } },
      include: {
        user: { select: { name: true, email: true, profile_photo: true } },
        store: { select: { shopName: true } },
      },
    });
    const vendorMap = Object.fromEntries(vendors.map((v) => [v.id, v]));
    return topByOrders.map((v) => ({
      vendor: vendorMap[v.vendorId!] ?? null,
      orderCount: v._count.id,
      totalRevenue: parseFloat((v._sum.total_amount ?? 0).toFixed(2)),
    }));
  }

  // sortBy === "rating"
  const topByRating = await prisma.vendorReview.groupBy({
    by: ["storeId"],
    _avg: { rating: true },
    _count: { id: true },
    orderBy: { _avg: { rating: "desc" } },
    take: limit,
  });
  const storeIds = topByRating.map((r) => r.storeId);
  const stores = await prisma.store.findMany({
    where: { id: { in: storeIds } },
    include: {
      vendor: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });
  const storeMap = Object.fromEntries(stores.map((s) => [s.id, s]));
  return topByRating.map((r) => ({
    store: storeMap[r.storeId] ?? null,
    avgRating: parseFloat((r._avg.rating ?? 0).toFixed(2)),
    reviewCount: r._count.id,
  }));
};

// ─── 6. All Stores Stats ─────────────────────────────────────
const getAdminStoreStats = async () => {
  const stores = await prisma.store.findMany({
    where: { isDeleted: false },
    include: {
      performance: true,
      vendor: { include: { user: { select: { name: true, email: true } } } },
      _count: { select: { orders: true, products: true, followers: true, reviews: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = stores.map((store) => ({
    storeId: store.id,
    shopName: store.shopName,
    status: store.status,
    viewCount: store.viewCount,
    vendor: store.vendor,
    performance: store.performance,
    counts: store._count,
  }));

  return result;
};

// ─── 7. Recent Activity / Registrations trend ───────────────
const getAdminRegistrationTrend = async (
  period: "daily" | "weekly" | "monthly" | "yearly" = "monthly",
) => {
  const { from } = getDateRange(period);

  const [vendors, users, stores] = await Promise.all([
    prisma.vendor.findMany({
      where: { createdAt: { gte: from }, isDeleted: false },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: from }, isDeleted: false },
      select: { createdAt: true },
    }),
    prisma.store.findMany({
      where: { createdAt: { gte: from }, isDeleted: false },
      select: { createdAt: true },
    }),
  ]);

  return {
    vendorTrend: buildTrend(vendors, period),
    userTrend: buildTrend(users, period),
    storeTrend: buildTrend(stores, period),
  };
};

export const AdminAnalyticsService = {
  getAdminOverview,
  getAdminVendorStats,
  getAdminOrderStats,
  getAdminFinanceStats,
  getAdminTopVendors,
  getAdminStoreStats,
  getAdminRegistrationTrend,

  // ─── 8. Global Revenue Stats ───────────────────────────────
  getAdminRevenueStats: async (period: "daily" | "weekly" | "monthly" | "yearly" = "monthly") => {
    const { from } = getDateRange(period);

    const [allWallets, transactions, payouts] = await Promise.all([
      prisma.vendorWallet.aggregate({
        _sum: { totalEarned: true, totalWithdrawn: true, currentBalance: true, pendingBalance: true },
      }),
      prisma.vendorTransaction.findMany({
        where: { createdAt: { gte: from } },
        select: { amount: true, type: true, createdAt: true },
      }),
      prisma.vendorPayout.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { vendor: { include: { user: { select: { name: true } } } } },
      }),
    ]);

    // Revenue trend from transactions of type CREDIT
    const revMap: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type !== "CREDIT") continue;
      const d = new Date(t.createdAt);
      let key: string;
      if (period === "daily") key = d.toISOString().slice(0, 10);
      else if (period === "weekly") {
        const w = new Date(d); w.setDate(d.getDate() - d.getDay());
        key = w.toISOString().slice(0, 10);
      } else if (period === "monthly") key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      else key = String(d.getFullYear());
      revMap[key] = (revMap[key] ?? 0) + t.amount;
    }
    const revenueTrend = Object.entries(revMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, revenue]) => ({ label, revenue: parseFloat(revenue.toFixed(2)) }));

    return {
      platformTotals: {
        totalEarned: parseFloat((allWallets._sum.totalEarned ?? 0).toFixed(2)),
        totalWithdrawn: parseFloat((allWallets._sum.totalWithdrawn ?? 0).toFixed(2)),
        totalCurrentBalance: parseFloat((allWallets._sum.currentBalance ?? 0).toFixed(2)),
        totalPendingBalance: parseFloat((allWallets._sum.pendingBalance ?? 0).toFixed(2)),
      },
      revenueTrend,
      recentPayouts: payouts,
    };
  },

  // ─── 9. Global Product Stats ───────────────────────────────
  getAdminProductStats: async () => {
    const [total, outOfStock, topByOrders] = await Promise.all([
      prisma.product.count({ where: { isDeleted: false } }),
      prisma.product.count({
        where: { isDeleted: false, variants: { every: { stock: 0 } } },
      }),
      prisma.orderItem.groupBy({
        by: ["product_id"],
        _sum: { price: true, quantity: true },
        _count: { id: true },
        orderBy: { _sum: { price: "desc" } },
        take: 10,
      }),
    ]);

    const topProductIds = topByOrders.map((t) => t.product_id);
    const topProducts = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, store: { select: { shopName: true } } },
    });
    const topProductMap = Object.fromEntries(topProducts.map((p) => [p.id, p]));

    const topProductsEnriched = topByOrders.map((t) => ({
      product: topProductMap[t.product_id] ?? null,
      totalRevenue: parseFloat((t._sum.price ?? 0).toFixed(2)),
      totalQuantity: t._sum.quantity ?? 0,
      orderCount: t._count.id,
    }));

    return {
      summary: { total, outOfStock },
      topProducts: topProductsEnriched,
    };
  },

  // ─── 10. Global Customer Stats ───────────────────────────────
  getAdminCustomerStats: async () => {
    const [totalFollowers, totalReviews, reviewAgg, ratingDist] = await Promise.all([
      prisma.vendorFollower.count(),
      prisma.vendorReview.count({ where: { isDeleted: false } }),
      prisma.vendorReview.aggregate({
        where: { isDeleted: false },
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.vendorReview.groupBy({
        by: ["rating"],
        where: { isDeleted: false },
        _count: { id: true },
        orderBy: { rating: "asc" },
      }),
    ]);

    return {
      totalFollowers,
      totalReviews,
      avgRating: reviewAgg._avg.rating ? parseFloat(reviewAgg._avg.rating.toFixed(2)) : 0,
      ratingDistribution: ratingDist.map((r) => ({ rating: r.rating, count: r._count.id })),
    };
  },

  // ─── 11. Global Marketing Stats ───────────────────────────────
  getAdminMarketingStats: async () => {
    const now = new Date();
    const [coupons, promotions] = await Promise.all([
      prisma.vendorCoupon.findMany({ where: { isDeleted: false } }),
      prisma.vendorPromotion.findMany({ where: { isDeleted: false } }),
    ]);

    const activeCoupons = coupons.filter((c) => c.isActive && new Date(c.endDate) > now);
    const activePromotions = promotions.filter((p) => p.isActive && new Date(p.endDate) > now);

    return {
      coupons: { total: coupons.length, active: activeCoupons.length },
      promotions: { total: promotions.length, active: activePromotions.length },
    };
  },

  // ─── 12. Global Usage & Performance ──────────────────────────
  getAdminUsageStats: async () => {
    const [usage, totalStores, totalStaff] = await Promise.all([
      prisma.vendorUsageCounter.aggregate({
        _sum: {
          orderProcessed: true,
          activeProductCount: true,
        },
      }),
      prisma.store.count({ where: { isDeleted: false } }),
      prisma.vendorStaff.count({ where: { isDeleted: false } }),
    ]);

    return {
      orderProcessed: usage._sum.orderProcessed ?? 0,
      activeProductCount: usage._sum.activeProductCount ?? 0,
      totalStores,
      totalStaff,
    };
  },

  getAdminPerformanceStats: async () => {
    const perf = await prisma.vendorPerformance.aggregate({
      _avg: {
        orderSuccessRate: true,
        avgProcessingTime: true,
        responseRate: true,
        cancellationRate: true,
      },
      _sum: {
        totalSalesCount: true,
      },
    });
    return {
      avgOrderSuccessRate: perf._avg.orderSuccessRate ?? 0,
      avgProcessingTime: perf._avg.avgProcessingTime ?? 0,
      avgResponseRate: perf._avg.responseRate ?? 0,
      avgCancellationRate: perf._avg.cancellationRate ?? 0,
      totalSalesCount: perf._sum.totalSalesCount ?? 0,
    };
  },

  // ─── 13. Commission Stats ────────────────────────────────────
  getAdminCommissionStats: async () => {
    const [globalAvg, customRates, totalCommission] = await Promise.all([
      prisma.vendorCommission.aggregate({ _avg: { commissionRate: true } }),
      prisma.vendorCommission.count({ where: { commissionRate: { not: 10 } } }), // Assuming 10 is default
      prisma.vendorOrder.aggregate({ _sum: { total_amount: true } }), // Simplified: actual commission should be calculated per order
    ]);

    return {
      avgCommissionRate: globalAvg._avg.commissionRate ? parseFloat(globalAvg._avg.commissionRate.toFixed(2)) : 0,
      vendorsWithCustomRate: customRates,
      estimatedTotalVolume: parseFloat((totalCommission._sum.total_amount ?? 0).toFixed(2)),
    };
  },

  // ─── 14. Global Activity Logs ───────────────────────────────
  getAdminActivityLogs: async () => {
    return await prisma.vendorActivityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        vendor: { include: { user: { select: { name: true } } } },
        store: { select: { shopName: true } },
      },
    });
  },
};
