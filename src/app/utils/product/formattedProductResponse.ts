
import { buildCategoryPath } from "../../helper/buildCategoryPath";

export const formatRating = (rating: number | null) =>
  rating ? Number(rating.toFixed(2)) : null;

const formatSingleProduct = (product: any, categoryMap: Map<string, any>) => {
  /* ================= MAIN IMAGE ================= */

  let mainImage = null;

  const {
    embedding,
    imageEmbedding,
    embeddingUpdatedAt,
    imageEmbeddingUpdatedAt,
    ...productData
  } = product;

  // Find main image
  for (const variant of product?.variants || []) {
    const found = variant.images?.find((img: any) => img.mainImage?.length);
    if (found) {
      mainImage = found.imageUrl;
      break;
    }
  }

  /* ================= RESPONSE ================= */

  return {
    ...product,

    rating: formatRating(product.rating),

    mainImage,

    category: buildCategoryPath(product.category, categoryMap),

    /* ================= SPECIFICATIONS ================= */

    specifications:
      product?.specifications?.map((spec: any) => {
        const type = spec.assignment.type;

        const attributeName = spec.assignment.productAttribute?.name;
        const attributeId = spec.assignment.productAttribute?.id;

        const selectValue =
          spec.assignment.SelectPropertyValue?.[0]?.attributeValue?.value;

        const selectValueId =
          spec.assignment.SelectPropertyValue?.[0]?.attributeValue?.id;

        const inputValue =
          spec.assignment.inputCustomPropertyValues?.[0]?.attributeValue;

        const inputValueId =
          spec.assignment.inputCustomPropertyValues?.[0]?.id;

        return {
          attributeName,
          attributeId,
          value: selectValue ?? inputValue ?? null,
          valueId: selectValueId ?? inputValueId ?? null,
          type,
        };
      }) || [],

    /* ================= VARIANTS ================= */

    variants:
      product?.variants?.map((variant: any) => {
        const mainVariant = variant.variantPropertyAssignment;

        const type = mainVariant?.type;

        const mainAttrName = mainVariant?.productAttribute?.name;

        const mainSelectValue =
          mainVariant?.SelectPropertyValue?.[0]?.attributeValue?.value;

        const mainInputValue =
          mainVariant?.inputCustomPropertyValues?.[0]?.attributeValue;

        /* ===== SELECT VARIANT VALUES ===== */

        const selectValues =
          variant.variantValues?.map((v: any) => ({
            attributeName: v.attributeValue.attribute.name,
            value: v.attributeValue.value,
          })) || [];

        return {
          id: variant.id,

          type,

          mainPrice: variant.mainPrice,

          salePrice: variant.salePrice,

          variantId: variant.mainVariantId ?? null,

          productVariantAttributeName: mainAttrName ?? null,

          productVariantValue: mainSelectValue ?? mainInputValue ?? null,

          stock: variant.stock,

          barcode: variant.barcode,

          sku: variant.sku,

          isAvailable: variant.isAvailable,
          discount: variant.discounts ?? null,
          variantValues: [...selectValues, ],

          images:
            variant.images?.map((img: any) => ({
              id: img.id,
              imageUrl: img.imageUrl,
              alt: img.alt,
              sortOrder: img.sortOrder,
              isMain: img.mainImage?.length > 0,
            })) || [],
        };
      }) || [],

    /* ================= STORE ================= */

    ...(product.store && {
      store: {
        ...product.store,
        rating: formatRating(product.store.rating),
      },
    }),

    /* ================= VENDOR ================= */

    ...(product.vendor && {
      vendor: {
        ...product.vendor,
        rating: formatRating(product.vendor.rating),
      },
    }),
  };
};

export const formattedProductResponse = (
  result: any,
  categoryMap: Map<string, any>,
) => {
  if (!result) return null;

  if (Array.isArray(result)) {
    return result.map((product) => formatSingleProduct(product, categoryMap));
  }

  return formatSingleProduct(result, categoryMap);
};