import { getLeafCategory } from "./getLeafCategory";

export const transformProducts = (products: any[]) => {
  return products.map((p) => ({
    id: p.id,

    category: getLeafCategory(p.category), // latest category

    vendorId: p.vendorId,
    name: p.name,
    description: p.description,
    shortDescription: p.shortDescription,
    status: p.status,
    productSlug: p.productSlug,
    viewCount: p.viewCount,
    rating: p.rating,
    ratingCount: p.ratingCount,

    /* ================= SPECIFICATIONS ================= */
    specifications: p.specifications.map((s: any) => {
      // ⭐ FIX name fallback
      const name =
        s.selectValues?.[0]?.attributeValue?.attribute?.name ??
        s.inputValues?.[0]?.customProperty?.name ??
        null;

      return {
        id: s.id,

        name,

        // ⭐ merge ALL → values
        values: [
          // SELECT
          ...(s.selectValues ?? []).map((v: any) => ({
            value: v.attributeValue?.value,
          })),

          // INPUT + CUSTOM (same table)
          ...(s.inputValues ?? []).map((v: any) => ({
            value: v.attributeValue,
          })),
        ],
      };
    }),
    /* ================= VARIANTS ================= */
    variants: p.variants.map((v: any) => ({
      id: v.id,

      mainPrice: v.mainPrice?.toString(),
      salePrice: v.salePrice?.toString(),
      stock: v.stock,
      barcode: v.barcode,
      sku: v.sku,
      isAvailable: v.isAvailable,

      /* ===== variantValues (your exact style) ===== */
      variantValues: {
        name: v.variantValues?.[0]?.attributeValue?.attribute?.name ?? null,

        selectValues:
          v.variantValues?.map((vv: any) => ({
            value: vv.attributeValue?.value,
          })) ?? [],
      },

      /* ===== images ===== */
      images:
        v.images?.map((img: any) => ({
          imageUrl: img.imageUrl,
          alt: img.alt ?? null,
          sortOrder: img.sortOrder ?? null,
        })) ?? [],

      /* ===== discount (single object like your style) ===== */
      discounts: v.discounts?.[0]
        ? {
            type: v.discounts[0].type,
            amount: v.discounts[0].amount?.toString(),
          }
        : null,
    })),
  }));
};
