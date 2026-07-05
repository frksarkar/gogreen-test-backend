import { deleteImgFromCloudinary } from "../../config/cloudinary.config";
import ApiError from "../../errors/ApiError";
import { prisma } from "../../shared/prisma";
type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  parentId: string | null;
  children: CategoryNode[];
  totalProducts?: number;
};
const getCategories = async () => {
  const categories = await prisma.productCategory.findMany({
    where: { isDeleted: false },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      parentId: true,
    },
  });
  const productCounts = await prisma.product.groupBy({
    by: ["categoryId"],
    _count: {
      id: true,
    },
    where: {
      isDeleted: false,
    },
  });
  // convert to map → { categoryId: count }
  const countMap: Record<string, number> = {};
  productCounts.forEach((item) => {
    countMap[item.categoryId] = item._count.id;
  });
  // 3. Build tree helper
  const buildTree = (parentId: string | null = null): CategoryNode[] => {
    return categories
      .filter((cat) => cat.parentId === parentId)
      .map((cat) => ({
        ...cat,
        children: buildTree(cat.id),
      }));
  };

  const tree = buildTree(null);

  // 4. Recursive count function
  const calculateTotal = (category: any) => {
    let total = countMap[category.id] || 0;

    for (const child of category.children) {
      total += calculateTotal(child);
    }

    return total;
  };

  // 5. Final result (only parents)
  const result = tree.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    image: cat.image,
    totalProducts: calculateTotal(cat),
  }));

  return result;
};

const getPopularProducts = async (limit = 20) => {
  const result = await prisma.product.findMany({
    where: {
      isDeleted: false,
      isDisable: false,
    },

    take: limit,

    orderBy: [{ viewCount: "desc" }, { rating: "desc" }],

    select: {
      id: true,
      name: true,
      productSlug: true,
      viewCount: true,
      rating: true,
      ratingCount: true,
      variants: {
        take: 1,
        select: {
          mainPrice: true,
          salePrice: true,
          stock: true,

          images: {
            take: 1,
            select: {
              imageUrl: true,
              alt: true,
            },
          },
        },
      },
    },
  });

  return result;
};

const requestFeatured = async (userId: string, payload: any) => {
  const { productId, vendorId, storeId } = payload;

  /* ---------------- CHECK PRODUCT ---------------- */
  const product = await prisma.product.findUnique({
    where: { id: productId, isDeleted: false },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  /* ---------------- CHECK ALREADY EXISTS ---------------- */
  const existing = await prisma.featuredProduct.findFirst({
    where: { productId },
  });

  if (existing) {
    throw new ApiError(400, "Product already requested for featured");
  }

  /* ---------------- CREATE REQUEST ---------------- */
  return prisma.featuredProduct.create({
    data: {
      amount: 100,
      productId,
      vendorId,
      storeId,
      isApproved: false,
      isPaid: false,
    },
  });
};

const getAllRequestedFeatured = async () => {
  const result = await prisma.featuredProduct.findMany({
    where: {
      isApproved: false,
    },

    include: {
      product: {
        select: {
          id: true,
          name: true,
          productSlug: true,
          viewCount: true,
          rating: true,
          store: {
            select: {
              id: true,
              shopName: true,
            },
          },
        },
      },

      vendor: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },

      store: {
        select: {
          id: true,
          shopName: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};
const approveFeatured = async (userId: string, id: string, payload: any) => {
  const existing = await prisma.featuredProduct.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(404, "Featured request not found");
  }

  return prisma.featuredProduct.update({
    where: { id },
    data: {
      isApproved: payload.isApproved,
      approvedBy: userId,
    },
  });
};

const getAllFeatured = async () => {
  const result = await prisma.featuredProduct.findMany({
    where: {
      isApproved: true,
      isPaid: true,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          productSlug: true,
          viewCount: true,
          rating: true,
        },
      },
      approvedUser: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};
const getTopSellingProducts = async (limit = 12) => {
  const result = await prisma.product.findMany({
    where: {
      isDeleted: false,
      isDisable: false,
    },

    take: limit,

    orderBy: {
      orderItems: {
        _count: "desc",
      },
    },

    select: {
      id: true,
      name: true,
      productSlug: true,
      rating: true,
      ratingCount: true,

      orderItems: {
        select: {
          id: true,
        },
      },

      variants: {
        take: 1,
        select: {
          mainPrice: true,
          salePrice: true,
          stock: true,

          images: {
            take: 1,
            select: {
              imageUrl: true,
              alt: true,
            },
          },
        },
      },
    },
  });

  return result;
};
const getTopVendors = async (limit = 10) => {
  const result = await prisma.vendor.findMany({
    take: limit,

    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],

    select: {
      id: true,
      rating: true,
      reviewCount: true,
      experience: true,
      rank: true,
      store: {
        select: {
          slug: true,
        },
      },

      user: {
        select: {
          id: true,
          name: true,
          profile_photo: true,
        },
      },

      products: {
        where: {
          isDeleted: false,
          isDisable: false,
        },

        select: {
          name: true,
          productSlug: true,

          variants: {
            select: {
              images: {
                select: {
                  imageUrl: true,
                },
                take: 1,
              },
            },
          },
        },
      },

      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  return result;
};

const createBanner = async (payload: any) => {
  return prisma.clientBanner.create({
    data: payload,
    include: {
      position: true,
    },
  });
};

const updateBanner = async (id: string, payload: any) => {
  console.log("update banner payload", payload);
  const banner = await prisma.clientBanner.findUnique({
    where: { id },
  });

  if (!banner) throw new ApiError(404, "Banner not found");

  const updated = await prisma.clientBanner.update({
    where: { id },
    data: payload,
  });

  if (payload.image && banner.image) {
    await deleteImgFromCloudinary(banner.image);
  }

  return updated;
};
const getAllBanner = async () => {
  return prisma.clientBanner.findMany({
    where: {
      isDeleted: false,
    },
    select: {
      id: true,
      image: true,
      alt: true,
      isPaid: true,
      status: true,
      position: {
        select: {
          id: true,
          position: true,
          page: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
const getDashboardBanner = async (positions?: string[]) => {
  const defaultPositions = Array.from({ length: 12 }, (_, i) => `${i + 1}`);

  const positionFilter =
    positions && positions.length > 0 ? positions : defaultPositions;

  return prisma.clientBanner.findMany({
    where: {
      isDeleted: false,
      status: "Approved",
      position: {
        page: "Home",
        position: {
          in: positionFilter,
        },
      },
    },
    select: {
      image: true,
      alt: true,
      position: {
        select: {
          position: true,
          page: true,
        },
      },
    },
    orderBy: [
      {
        position: {
          position: "asc", // 🔥 important
        },
      },
      {
        createdAt: "desc",
      },
    ],
  });
};
const deleteBanner = async (id: string) => {
  const banner = await prisma.clientBanner.findUnique({
    where: { id },
  });

  if (!banner) throw new ApiError(404, "Banner not found");

  const deletedBanner = await prisma.clientBanner.delete({
    where: { id },
  });

  if (deletedBanner.image) {
    try {
      await deleteImgFromCloudinary(deletedBanner.image);
    } catch (error) {
      throw new ApiError(400, "Image deleted failed from cloudinary");
    }
  }

  return deletedBanner;
};
const createBannerPosition = async (payload: any) => {
  return prisma.clientBannerPosition.create({
    data: payload,
  });
};

const getAllBannerPosition = async () => {
  return prisma.clientBannerPosition.findMany({
    where: {
      isDeleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      position: true,
      price: true,
      type: true,
      page: true,
    },
  });
};

const updateBannerPosition = async (id: string, payload: any) => {
  const existing = await prisma.clientBannerPosition.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(404, "Banner position not found");
  }

  return prisma.clientBannerPosition.update({
    where: { id },
    data: payload,
  });
};

const deleteBannerPosition = async (id: string) => {
  const existing = await prisma.clientBannerPosition.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(404, "Banner position not found");
  }

  // 🔥 CHECK: if any banner exists for this position
  const bannerExists = await prisma.clientBanner.findFirst({
    where: {
      positionId: id,
      isDeleted: false,
    },
  });

  if (bannerExists) {
    throw new ApiError(
      400,
      "This banner position already has banners, cannot delete",
    );
  }

  return prisma.clientBannerPosition.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};
const createBestDeal = async (payload: any) => {
  return prisma.bestDeal.create({
    data: payload,
  });
};

const getAllBestDeals = async () => {
  return prisma.bestDeal.findMany({
    where: {
      isDeleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const updateBestDeal = async (id: string, payload: any) => {
  const existing = await prisma.bestDeal.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(404, "Best deal not found");
  }

  const updated = await prisma.bestDeal.update({
    where: { id },
    data: payload,
  });

  if (payload.image && existing.image) {
    await deleteImgFromCloudinary(existing.image);
  }

  return updated;
};

const deleteBestDeal = async (id: string) => {
  const existing = await prisma.bestDeal.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(404, "Best deal not found");
  }

  return prisma.bestDeal.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};

// created by nahid

type ProductType = "POPULAR" | "TRENDING" | "BEST_SELLERS" | "TOP_RATED";

const getProductsByType = async (productType: ProductType, limit = 20) => {
  let orderBy: any = [];

  switch (productType) {
    case "POPULAR":
      orderBy = [{ viewCount: "desc" }, { ratingCount: "desc" }];
      break;

    case "TRENDING":
      orderBy = [
        { createdAt: "desc" }, // recent products
        { viewCount: "desc" },
      ];
      break;

    case "BEST_SELLERS":
      orderBy = [
        {
          orderItems: {
            _count: "desc",
          },
        },
      ];
      break;

    case "TOP_RATED":
      orderBy = [{ rating: "desc" }, { ratingCount: "desc" }];
      break;

    default:
      orderBy = [{ createdAt: "desc" }];
  }

  const result = await prisma.product.findMany({
    where: {
      isDeleted: false,
      isDisable: false,
    },

    take: limit,
    orderBy,

    select: {
      id: true,
      name: true,
      productSlug: true,
      viewCount: true,
      rating: true,
      ratingCount: true,

      variants: {
        take: 1,
        select: {
          mainPrice: true,
          salePrice: true,
          stock: true,

          images: {
            take: 1,
            select: {
              imageUrl: true,
              alt: true,
            },
          },
        },
      },
    },
  });

  return result;
};

export const ClientHomeService = {
  getCategories,
  getPopularProducts,
  requestFeatured,
  getAllRequestedFeatured,
  approveFeatured,
  getAllFeatured,
  getTopSellingProducts,
  getTopVendors,
  createBanner,
  getAllBanner,
  getDashboardBanner,
  updateBanner,
  deleteBanner,
  createBannerPosition,
  getAllBannerPosition,
  updateBannerPosition,
  deleteBannerPosition,
  createBestDeal,
  getAllBestDeals,
  updateBestDeal,
  deleteBestDeal,

  //  nahid

  getProductsByType,
};
