import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { prisma } from "../../../shared/prisma";
import { generateSlug } from "../../../utils/generateSlug";
import { calculateSalePrice } from "../../../utils/product/calculateSalePrice";
import { formattedProductResponse } from "../../../utils/product/formattedProductResponse";
import { ImageSearchService } from "../../ai/image-search/image-search.service";
import { SearchService } from "../../ai/search/search.service";
const allCategories = async () => {
  const categories = await prisma.productCategory.findMany({
    select: {
      id: true,
      name: true,
      parentId: true,
    },
  });

  const categoryMap = new Map();

  categories.forEach((cat) => {
    categoryMap.set(cat.id, cat);
  });
  return categoryMap;
};

const createProduct = async (payload: any) => {
  const { specifications, variants, ...productData } = payload;

  /* ---------------- CATEGORY CHECK ---------------- */

  const category = await prisma.productCategory.findUnique({
    where: { id: productData.categoryId },
  });

  if (!category) throw new ApiError(404, "Category not found");

  /* ---------------- VENDOR CHECK ---------------- */

  if (productData?.vendorId) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: productData.vendorId },
    });

    if (!vendor) throw new ApiError(404, "Vendor not found");
  }

  /* ---------------- SLUG ---------------- */

  const productSlug = await generateSlug(
    productData.name,
    "product",
    "productSlug",
  );

  /* ---------------- VENDOR LIMIT ---------------- */

  const vendorLimits = await prisma.vendorUsageLimit.findUnique({
    where: { vendorId: productData.vendorId },
  });

  const vendorCounter = await prisma.vendorUsageCounter.findUnique({
    where: { vendorId: productData.vendorId },
  });

  if (
    vendorLimits &&
    vendorCounter &&
    vendorCounter.activeProductCount >= vendorLimits.maxProductCount
  ) {
    throw new ApiError(
      403,
      `Maximum product count limit (${vendorLimits.maxProductCount}) reached`,
    );
  }

  /* ---------------- SKU BULK CHECK ---------------- */

  if (variants?.length) {
    const sku = variants.map((v: any) => v.sku);

    const existing = await prisma.productVariant.findMany({
      where: { sku: { in: sku } },
      select: { sku: true },
    });

    if (existing.length) {
      throw new ApiError(400, `SKU already exists: ${existing[0].sku}`);
    }
  }

  /* ---------------- TRANSACTION ---------------- */

  const product = await prisma.$transaction(
    async (tx: any) => {
      /* ---------------- ATTRIBUTE CACHE ---------------- */

      const attributeCache: any = {};

      const getOrCreateCustomAttribute = async (
        propertyType: any,
        attributeName: any,
      ) => {
        if (attributeCache[propertyType]) {
          return attributeCache[propertyType];
        }
        const attr = await tx.attribute.create({
          data: {
            name: attributeName,
            type: "INPUT",
            propertyType,
          },
        });

        attributeCache[propertyType] = attr.id;

        return attr.id;
      };

      /* ---------------- CREATE PRODUCT ---------------- */

      const product = await tx.product.create({
        data: {
          ...productData,
          vendorId: productData.vendorId,
          productSlug,
        },
      });

      /* ---------------- VENDOR COUNTER ---------------- */

      await tx.vendorUsageCounter.upsert({
        where: { vendorId: productData.vendorId },
        update: { activeProductCount: { increment: 1 } },
        create: {
          vendorId: productData.vendorId,
          activeProductCount: 1,
        },
      });

      /* ---------------- SPECIFICATIONS ---------------- */

      if (specifications?.length) {
        await Promise.all(
          specifications.map(async (spec: any) => {
            const attributeId =
              spec.productAttributeId ??
              (await getOrCreateCustomAttribute("ATTRIBUTE", spec.name));

            const assignment = await tx.productAttributeAssignment.create({
              data: {
                productAttributeId: attributeId,
                type: spec.type,
                assignmentType: "ATTRIBUTE",
              },
            });

            await tx.productSpecification.create({
              data: {
                productId: product.id,
                productAttributeAssignmentId: assignment.id,
              },
            });

            if (spec.type === "SELECT" && spec.attributeValueId) {
              await tx.selectPropertyValue.create({
                data: {
                  productAttributeAssignmentId: assignment.id,
                  attributeValueId: spec.attributeValueId,
                },
              });
            }

            if (spec.type === "INPUT" || spec.type === "CUSTOM") {
              const inputValue = await tx.inputCustomPropertyValue.create({
                data: {
                  productAttributeAssignmentId: assignment.id,
                  attributeValue: spec.attributeValue,
                },
              });

              if (!spec.productAttributeId) {
                await tx.customProperty.create({
                  data: {
                    name: spec.name,
                    customValueId: inputValue.id,
                  },
                });
              }
            }
          }),
        );
      }

      /* ---------------- VARIANTS ---------------- */

      if (variants?.length) {
        for (const variant of variants) {
          if (!variant.mainVariant) {
            throw new ApiError(400, "Main variant is required");
          }

          const rootVal = variant.mainVariant;
          const rootAttrId =
            rootVal.productAttributeId ??
            (await getOrCreateCustomAttribute("MAIN_VARIANT", rootVal.name));

          const mainVariantAssignment =
            await tx.productAttributeAssignment.create({
              data: {
                productAttributeId: rootAttrId,
                type: rootVal.type,
                assignmentType: "MAIN_VARIANT",
              },
            });
          // console.log("mainVariantAssignment", mainVariantAssignment);

          const createdVariant = await tx.productVariant.create({
            data: {
              productId: product.id,
              mainVariantId: variant?.mainVariantId ?? rootAttrId,
              productVariantAssignmentId: mainVariantAssignment.id,
              productAttributeAssignmentId: mainVariantAssignment.id,
              mainPrice: variant.mainPrice,
              salePrice: variant.discount
                ? calculateSalePrice(
                    variant.mainPrice,
                    variant.discount.type,
                    variant.discount.value,
                  )
                : null,
              stock: variant.stock,
              sku: variant.sku,
              barcode: variant.barcode,
              isAvailable: variant.isAvailable,
            },
          });
          console.log("createdVariant", createdVariant);
          /* ---------------- MAIN VARIANT VALUE ---------------- */

          if (rootVal.type === "SELECT" && rootVal.attributeValueId) {
            await tx.selectPropertyValue.create({
              data: {
                productAttributeAssignmentId: mainVariantAssignment.id,
                attributeValueId: rootVal.attributeValueId,
              },
            });
          }

          if (rootVal.type === "INPUT" || rootVal.type === "CUSTOM") {
            const inputValue = await tx.inputCustomPropertyValue.create({
              data: {
                productAttributeAssignmentId: mainVariantAssignment.id,
                attributeValue: rootVal.attributeValue,
              },
            });
            console.log("inputValue", inputValue);
            if (!rootVal.productAttributeId) {
              const customProperty = await tx.customProperty.create({
                data: {
                  name: rootVal.name,
                  customValueId: inputValue.id,
                },
              });
              console.log("customProperty", customProperty);
            }
          }

          /* ---------------- VARIANT VALUES ---------------- */

          // await Promise.all(
          //   (variant.values ?? []).map(async (val: any) => {
          //     const attributeId =
          //       val.productAttributeId ??
          //       (await getOrCreateCustomAttribute("VARIANT", val.name));
          //     console.log("variant value attribute id ", attributeId);

          //     const assignment = await tx.productAttributeAssignment.create({
          //       data: {
          //         productAttributeId: attributeId,
          //         type: val.type,
          //         assignmentType: "VARIANT",
          //       },
          //     });
          //     console.log("variant value assignment  ", assignment);
          //     if (val.type === "SELECT" && val.attributeValueId) {
          //       await tx.variantValue.create({
          //         data: {
          //           variantId: createdVariant.id,
          //           attributeValueId: val.attributeValueId,
          //         },
          //       });

          //       await tx.selectPropertyValue.create({
          //         data: {
          //           productAttributeAssignmentId: assignment.id,
          //           attributeValueId: val.attributeValueId,
          //         },
          //       });
          //     }
          //     console.log("val type", val.type);
          //     if (val.type === "INPUT" || val.type === "CUSTOM") {
          //       const inputValue = await tx.inputCustomPropertyValue.create({
          //         data: {
          //           productAttributeAssignmentId: assignment.id,
          //           attributeValue: val.attributeValue,
          //         },
          //       });
          //       console.log("cutomval input  type", inputValue);
          //       if (!val.productAttributeId) {
          //         const cV = await tx.customProperty.create({
          //           data: {
          //             name: val.name,
          //             customValueId: inputValue.id,
          //           },
          //         });
          //         console.log("cV", cV);
          //       }
          //     }
          //   }),
          // );
          /* ---------------- VARIANT VALUES ---------------- */

          await Promise.all(
            (variant.values ?? []).map(async (val: any) => {
              /* ✅ STEP 1: GET / CREATE ATTRIBUTE */
              const attributeId =
                val.productAttributeId ??
                (await getOrCreateCustomAttribute("VARIANT", val.name));

              /* ---------------- SELECT TYPE ---------------- */
              if (val.type === "SELECT" && val.attributeValueId) {
                await tx.variantValue.create({
                  data: {
                    variantId: createdVariant.id,
                    attributeValueId: val.attributeValueId,
                  },
                });

                return;
              }

              /* ---------------- INPUT / CUSTOM TYPE ---------------- */
              if (val.type === "INPUT" || val.type === "CUSTOM") {
                /* ✅ FIX: CREATE ATTRIBUTE VALUE (IMPORTANT) */
                const attributeValue = await tx.attributeValue.create({
                  data: {
                    attributeId,
                    value: val.attributeValue,
                  },
                });

                /* ✅ FIX: SAVE INTO VariantValue (THIS WAS MISSING) */
                await tx.variantValue.create({
                  data: {
                    variantId: createdVariant.id,
                    attributeValueId: attributeValue.id,
                  },
                });

                /* OPTIONAL (keep your existing system if needed) */
                const assignment = await tx.productAttributeAssignment.create({
                  data: {
                    productAttributeId: attributeId,
                    type: val.type,
                    assignmentType: "VARIANT",
                  },
                });

                const inputValue = await tx.inputCustomPropertyValue.create({
                  data: {
                    productAttributeAssignmentId: assignment.id,
                    attributeValue: val.attributeValue,
                  },
                });

                if (!val.productAttributeId) {
                  await tx.customProperty.create({
                    data: {
                      name: val.name,
                      customValueId: inputValue.id,
                    },
                  });
                }
              }
            }),
          );

          /* ---------------- IMAGES ---------------- */

          if (variant.images?.length) {
            const images = await Promise.all(
              variant.images.map((img: any) =>
                tx.productVariantImage.create({
                  data: {
                    variantId: createdVariant.id,
                    imageUrl: img.imageUrl,
                    alt: img.alt ?? null,
                    sortOrder: img.sortOrder ?? null,
                  },
                }),
              ),
            );

            const mainImage = images.find(
              (_: any, i: number) => variant.images[i].isMain,
            );

            if (mainImage) {
              await tx.productMainImage.create({
                data: { productImageId: mainImage.id },
              });
            }
          }

          /* ---------------- DISCOUNT ---------------- */

          if (variant.discount) {
            await tx.discount.create({
              data: {
                variantId: createdVariant.id,
                type: variant.discount.type,
                value: variant.discount.value,
              },
            });
          }
        }
      }

      return product;
    },
    { timeout: 20000 },
  );

  /* ---------------- BACKGROUND JOB ---------------- */

  // Generate embeddings in background
  SearchService.generateAndStoreProductEmbedding(product.id);
  ImageSearchService.updateProductImageEmbedding(product.id);

  return product;
};

const getAllProducts = async () => {
  const result = await prisma.product.findMany({
    where: { isDeleted: false },

    select: {
      id: true,
      name: true,
      description: true,
      shortDescription: true,
      status: true,
      productSlug: true,
      viewCount: true,
      rating: true,
      ratingCount: true,
      isDisable: true,
      category: {
        select: {
          id: true,
          name: true,
          parentId: true,
        },
      },
      store: {
        select: {
          id: true,
          vendorId: true,
        },
      },
      specifications: {
        where: {
          assignment: { assignmentType: "ATTRIBUTE" },
        },

        select: {
          assignment: {
            select: {
              type: true,
              productAttribute: {
                select: { id: true, name: true },
              },

              SelectPropertyValue: {
                select: {
                  attributeValue: {
                    select: { id: true, value: true },
                  },
                },
              },

              inputCustomPropertyValues: {
                select: {
                  id: true,
                  attributeValue: true,
                },
              },
            },
          },
        },
      },
      /* ================= VARIANTS ================= */

      variants: {
        select: {
          id: true,
          mainVariantId: true,
          mainPrice: true,
          salePrice: true,
          stock: true,
          barcode: true,
          sku: true,
          isAvailable: true,
          discounts: {
            select: {
              type: true,
              value: true,
            },
          },
          // variantPropertyAssignment: {
          //   where: {
          //     assignmentType: "MAIN_VARIANT",
          //   },

          //   select: {
          //     type: true,
          //     productAttribute: {
          //       select: { name: true },
          //     },

          //     SelectPropertyValue: {
          //       select: {
          //         attributeValue: {
          //           select: { value: true },
          //         },
          //       },
          //     },

          //     inputCustomPropertyValues: {
          //       select: {
          //         attributeValue: true,
          //       },
          //     },
          //   },
          // },
          variantPropertyAssignment: {
            where: {
              assignmentType: "MAIN_VARIANT",
            },
            select: {
              type: true,

              productAttribute: {
                select: { name: true },
              },

              SelectPropertyValue: {
                select: {
                  attributeValue: {
                    select: { value: true },
                  },
                },
              },

              inputCustomPropertyValues: {
                select: {
                  attributeValue: true,
                },
              },
            },
          },
          variantValues: {
            select: {
              attributeValue: {
                select: {
                  value: true,
                  attribute: {
                    select: { name: true },
                  },
                },
              },
            },
          },

          images: {
            select: {
              id: true,
              imageUrl: true,
              alt: true,
              sortOrder: true,

              mainImage: {
                select: {
                  id: true,
                },
              },
            },
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },
    },

    orderBy: { createdAt: "desc" },
  });
  // return result;
  return formattedProductResponse(result, await allCategories());
};

// Created by nahid
const getVendorAllProducts = async (vendorId: string) => {
  console.log(vendorId);
  if (!vendorId) {
    throw new ApiError(400, "Vendor ID is required");
  }
  const result = await prisma.product.findMany({
    where: {
      store: {
        vendorId,
      },

      isDeleted: false,
    },

    select: {
      id: true,
      name: true,
      description: true,
      shortDescription: true,
      status: true,
      productSlug: true,
      viewCount: true,
      rating: true,
      ratingCount: true,
      isDisable: true,
      category: {
        select: {
          id: true,
          name: true,
          parentId: true,
        },
      },
      store: {
        select: {
          id: true,
          vendorId: true,
        },
      },
      specifications: {
        where: {
          assignment: { assignmentType: "ATTRIBUTE" },
        },

        select: {
          assignment: {
            select: {
              type: true,
              productAttribute: {
                select: { id: true, name: true },
              },

              SelectPropertyValue: {
                select: {
                  attributeValue: {
                    select: { id: true, value: true },
                  },
                },
              },

              inputCustomPropertyValues: {
                select: {
                  id: true,
                  attributeValue: true,
                },
              },
            },
          },
        },
      },
      /* ================= VARIANTS ================= */

      variants: {
        select: {
          id: true,
          mainVariantId: true,
          mainPrice: true,
          salePrice: true,
          stock: true,
          barcode: true,
          sku: true,
          isAvailable: true,
          discounts: {
            select: {
              type: true,
              value: true,
            },
          },
          // variantPropertyAssignment: {
          //   where: {
          //     assignmentType: "MAIN_VARIANT",
          //   },

          //   select: {
          //     type: true,
          //     productAttribute: {
          //       select: { name: true },
          //     },

          //     SelectPropertyValue: {
          //       select: {
          //         attributeValue: {
          //           select: { value: true },
          //         },
          //       },
          //     },

          //     inputCustomPropertyValues: {
          //       select: {
          //         attributeValue: true,
          //       },
          //     },
          //   },
          // },
          variantPropertyAssignment: {
            where: {
              assignmentType: "MAIN_VARIANT",
            },
            select: {
              type: true,

              productAttribute: {
                select: { name: true },
              },

              SelectPropertyValue: {
                select: {
                  attributeValue: {
                    select: { value: true },
                  },
                },
              },

              inputCustomPropertyValues: {
                select: {
                  attributeValue: true,
                },
              },
            },
          },
          variantValues: {
            select: {
              attributeValue: {
                select: {
                  value: true,
                  attribute: {
                    select: { name: true },
                  },
                },
              },
            },
          },

          images: {
            select: {
              id: true,
              imageUrl: true,
              alt: true,
              sortOrder: true,

              mainImage: {
                select: {
                  id: true,
                },
              },
            },
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },
    },

    orderBy: { createdAt: "desc" },
  });

  if (result.length === 0) {
    throw new ApiError(404, "No products found for this vendor");
  }
  // return result;
  return formattedProductResponse(result, await allCategories());
};

// create by nahid
const getVendorMostSoldProducts = async (
  vendorId: string,
  limit: number = 20,
) => {
  console.log(vendorId);

  if (!vendorId) {
    throw new ApiError(400, "Vendor ID is required");
  }

  const result = await prisma.product.findMany({
    where: {
      store: {
        vendorId,
      },
      isDeleted: false,
    },

    select: {
      id: true,
      name: true,
      description: true,
      shortDescription: true,
      status: true,
      productSlug: true,
      viewCount: true,
      rating: true,
      ratingCount: true,
      isDisable: true,

      category: {
        select: {
          id: true,
          name: true,
          parentId: true,
        },
      },

      store: {
        select: {
          id: true,
          vendorId: true,
          shopName: true,
        },
      },

      specifications: {
        where: {
          assignment: { assignmentType: "ATTRIBUTE" },
        },
        select: {
          assignment: {
            select: {
              type: true,
              productAttribute: {
                select: { id: true, name: true },
              },
              SelectPropertyValue: {
                select: {
                  attributeValue: {
                    select: { id: true, value: true },
                  },
                },
              },
              inputCustomPropertyValues: {
                select: {
                  id: true,
                  attributeValue: true,
                },
              },
            },
          },
        },
      },

      variants: {
        select: {
          id: true,
          mainVariantId: true,
          mainPrice: true,
          salePrice: true,
          stock: true,
          barcode: true,
          sku: true,
          isAvailable: true,

          discounts: {
            select: {
              type: true,
              value: true,
            },
          },

          variantPropertyAssignment: {
            where: {
              assignmentType: "MAIN_VARIANT",
            },
            select: {
              type: true,
              productAttribute: {
                select: { name: true },
              },
              SelectPropertyValue: {
                select: {
                  attributeValue: {
                    select: { value: true },
                  },
                },
              },
              inputCustomPropertyValues: {
                select: {
                  attributeValue: true,
                },
              },
            },
          },

          variantValues: {
            select: {
              attributeValue: {
                select: {
                  value: true,
                  attribute: {
                    select: { name: true },
                  },
                },
              },
            },
          },

          images: {
            select: {
              id: true,
              imageUrl: true,
              alt: true,
              sortOrder: true,
              mainImage: {
                select: {
                  id: true,
                },
              },
            },
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  if (result.length === 0) {
    throw new ApiError(404, "No products found for this vendor");
  }

  // 🔥 ADD SOLD LOGIC (you can replace this later with real orderItems)
  const enriched = result.map((product) => {
    const soldUnits = product.ratingCount || product.viewCount || 0;

    const totalRevenue = (product.variants?.[0]?.salePrice || 0) * soldUnits;

    return {
      ...product,
      soldUnits,
      totalRevenue,
      mainImage: product.variants?.[0]?.images?.[0]?.imageUrl || null,
    };
  });

  // 🔥 SORT BY MOST SOLD
  const sorted = enriched.sort((a, b) => b.soldUnits - a.soldUnits);

  // OPTIONAL LIMIT
  const limited = sorted.slice(0, limit);

  return formattedProductResponse(limited, await allCategories());
};

const getSingleProduct = async (id: string) => {
  const result = await prisma.product.findUnique({
    where: { id, isDeleted: false },
    select: {
      id: true,
      name: true,
      description: true,
      shortDescription: true,
      status: true,
      productSlug: true,
      viewCount: true,
      rating: true,
      isDisable: true,
      ratingCount: true,
      category: {
        select: {
          id: true,
          name: true,
          parentId: true,
        },
      },
      store: {
        select: {
          id: true,
          vendorId: true,
          slug: true,
        },
      },
      specifications: {
        where: {
          assignment: { assignmentType: "ATTRIBUTE" },
        },

        select: {
          assignment: {
            select: {
              type: true,
              productAttribute: {
                select: { id: true, name: true },
              },

              SelectPropertyValue: {
                select: {
                  attributeValue: {
                    select: { id: true, value: true },
                  },
                },
              },

              inputCustomPropertyValues: {
                select: {
                  id: true,
                  attributeValue: true,
                },
              },
            },
          },
        },
      },
      /* ================= VARIANTS ================= */

      variants: {
        select: {
          id: true,
          mainVariantId: true,
          mainPrice: true,
          salePrice: true,
          stock: true,
          barcode: true,
          sku: true,
          isAvailable: true,
          discounts: {
            select: {
              type: true,
              value: true,
            },
          },
          variantPropertyAssignment: {
            where: {
              assignmentType: "MAIN_VARIANT",
            },

            select: {
              type: true,
              productAttribute: {
                select: { name: true },
              },

              SelectPropertyValue: {
                select: {
                  attributeValue: {
                    select: { value: true },
                  },
                },
              },

              inputCustomPropertyValues: {
                select: {
                  attributeValue: true,
                },
              },
            },
          },

          variantValues: {
            select: {
              attributeValue: {
                select: {
                  value: true,
                  attribute: {
                    select: { name: true },
                  },
                },
              },
            },
          },

          images: {
            select: {
              id: true,
              imageUrl: true,
              alt: true,
              sortOrder: true,

              mainImage: {
                select: {
                  id: true,
                },
              },
            },
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },

      /* ================= REVIEWS ================= */

      productReviews: {
        take: 2,
        orderBy: { createdAt: "desc" },

        select: {
          id: true,
          review: true,
          reply: true,
          rating: true,

          reviewer: {
            select: {
              id: true,
              name: true,
              profile_photo: true,
            },
          },
          replier: {
            select: {
              id: true,
              name: true,
              profile_photo: true,
            },
          },
        },
      },
    },
  });

  if (!result) {
    throw new ApiError(404, "Product not found");
  }
  return formattedProductResponse(result, await allCategories());
};

const getSingleProductBySlug = async (slug: string) => {
  const product = await prisma.product.findFirst({
    where: {
      productSlug: slug,
      isDeleted: false,
    },
    select: { id: true },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Increment view count safely
  await prisma.product.update({
    where: { productSlug: slug },
    data: { viewCount: { increment: 1 } },
  });

  const result = await prisma.product.findUnique({
    where: { productSlug: slug, isDeleted: false },
    select: {
      id: true,
      name: true,
      description: true,
      shortDescription: true,
      isDisable: true,
      status: true,
      productSlug: true,
      viewCount: true,
      rating: true,
      ratingCount: true,

      category: {
        select: {
          id: true,
          name: true,
          parentId: true,
        },
      },

      specifications: {
        where: {
          assignment: { assignmentType: "ATTRIBUTE" },
        },

        select: {
          assignment: {
            select: {
              type: true,
              productAttribute: {
                select: { id: true, name: true },
              },

              SelectPropertyValue: {
                select: {
                  attributeValue: {
                    select: { id: true, value: true },
                  },
                },
              },

              inputCustomPropertyValues: {
                select: {
                  id: true,
                  attributeValue: true,
                },
              },
            },
          },
        },
      },
      /* ================= VARIANTS ================= */

      variants: {
        select: {
          id: true,
          mainVariantId: true,
          mainPrice: true,
          salePrice: true,
          stock: true,
          barcode: true,
          sku: true,
          isAvailable: true,
          discounts: {
            select: {
              type: true,
              value: true,
            },
          },
          variantPropertyAssignment: {
            where: {
              assignmentType: "MAIN_VARIANT",
            },

            select: {
              type: true,
              productAttribute: {
                select: { name: true },
              },

              SelectPropertyValue: {
                select: {
                  attributeValue: {
                    select: { value: true },
                  },
                },
              },

              inputCustomPropertyValues: {
                select: {
                  attributeValue: true,
                },
              },
            },
          },

          variantValues: {
            select: {
              attributeValue: {
                select: {
                  value: true,
                  attribute: {
                    select: { name: true },
                  },
                },
              },
            },
          },

          images: {
            select: {
              id: true,
              imageUrl: true,
              alt: true,
              sortOrder: true,

              mainImage: {
                select: {
                  id: true,
                },
              },
            },
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },

      /* ================= REVIEWS ================= */

      productReviews: {
        take: 2,
        orderBy: { createdAt: "desc" },

        select: {
          id: true,
          review: true,
          reply: true,
          rating: true,
          createdAt: true,
          reviewer: {
            select: {
              id: true,
              name: true,
              profile_photo: true,
            },
          },
          replier: {
            select: {
              id: true,
              name: true,
              profile_photo: true,
            },
          },
        },
      },
      store: {
        select: {
          id: true,
          vendorId: true,
          shopName: true,
          rating: true,
          reviewCount: true,
          shopLogo: true,
          slug: true,
          shopBanner: true,
        },
      },
      vendor: {
        select: {
          rank: true,
          experience: true,
          rating: true,
          reviewCount: true,
          user: {
            select: {
              name: true,
              profile_photo: true,
              addresses: {
                select: {
                  id: true,
                  label: true,
                  division: true,
                  district: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!result) {
    throw new ApiError(404, "Product not found");
  }
  return formattedProductResponse(result, await allCategories());
};

// const updateProduct = async (id: string, payload: any) => {
//   const { specifications, variants, ...productData } = payload;

//   const existingProduct = await prisma.product.findUnique({
//     where: { id, isDeleted: false },
//   });

//   if (!existingProduct) {
//     throw new ApiError(404, "Product not found");
//   }

//   return await prisma.$transaction(
//     async (tx: any) => {
//       /* ---------------- UPDATE PRODUCT ---------------- */

//       const updatedProduct = await tx.product.update({
//         where: { id },
//         data: { ...productData },
//       });

//       /* ---------------- ATTRIBUTE CACHE ---------------- */

//       const attributeCache: Record<string, string> = {};

//       const getOrCreateCustomAttribute = async (
//         propertyType: string,
//         attributeName: string,
//       ) => {
//         const key = `${propertyType}-${attributeName}`;

//         if (attributeCache[key]) return attributeCache[key];

//         const attr = await tx.attribute.create({
//           data: {
//             name: attributeName,
//             type: "INPUT",
//             propertyType,
//           },
//         });

//         attributeCache[key] = attr.id;

//         return attr.id;
//       };

//       /* ---------------- SPECIFICATIONS (RESET) ---------------- */

//       await tx.productSpecification.deleteMany({
//         where: { productId: id },
//       });

//       if (specifications?.length) {
//         for (const spec of specifications) {
//           const attributeId =
//             spec.productAttributeId ??
//             (await getOrCreateCustomAttribute("ATTRIBUTE", spec.name));

//           const assignment = await tx.productAttributeAssignment.create({
//             data: {
//               productAttributeId: attributeId,
//               type: spec.type,
//               assignmentType: "ATTRIBUTE",
//             },
//           });

//           await tx.productSpecification.create({
//             data: {
//               productId: id,
//               productAttributeAssignmentId: assignment.id,
//             },
//           });

//           if (spec.type === "SELECT" && spec.attributeValueId) {
//             await tx.selectPropertyValue.create({
//               data: {
//                 productAttributeAssignmentId: assignment.id,
//                 attributeValueId: spec.attributeValueId,
//               },
//             });
//           }

//           if (spec.type === "INPUT" || spec.type === "CUSTOM") {
//             await tx.inputCustomPropertyValue.create({
//               data: {
//                 productAttributeAssignmentId: assignment.id,
//                 attributeValue: spec.attributeValue,
//               },
//             });
//           }
//         }
//       }

//       /* ================= VARIANT SMART UPDATE ================= */

//       const existingVariants = await tx.productVariant.findMany({
//         where: { productId: id },
//         include: {
//           variantValues: true,
//           images: true,
//         },
//       });

//       const existingMap = new Map(existingVariants.map((v: any) => [v.sku, v]));

//       const incomingSkus = variants?.map((v: any) => v.sku) || [];

//       /* -------- DELETE MISSING -------- */

//       await tx.productVariant.deleteMany({
//         where: {
//           productId: id,
//           sku: { notIn: incomingSkus },
//         },
//       });

//       /* -------- UPSERT VARIANTS -------- */

//       for (const variant of variants ?? []) {
//         const rootVal = variant.mainVariant;

//         if (!rootVal) {
//           throw new ApiError(400, "Main variant is required");
//         }

//         const existing: any = existingMap.get(variant.sku);

//         const rootAttrId =
//           rootVal.productAttributeId ??
//           (await getOrCreateCustomAttribute("MAIN_VARIANT", rootVal.name));

//         const mainVariantAssignment =
//           await tx.productAttributeAssignment.create({
//             data: {
//               productAttributeId: rootAttrId,
//               type: rootVal.type,
//               assignmentType: "MAIN_VARIANT",
//             },
//           });

//         let currentVariant;

//         /* ================= UPDATE ================= */
//         if (existing) {
//           currentVariant = await tx.productVariant.update({
//             where: { id: existing.id },
//             data: {
//               mainPrice: variant.mainPrice,
//               salePrice: variant.discount
//                 ? calculateSalePrice(
//                     variant.mainPrice,
//                     variant.discount.type,
//                     variant.discount.value,
//                   )
//                 : null,
//               stock: variant.stock,
//               barcode: variant.barcode,
//               isAvailable: variant.isAvailable,
//               productVariantAssignmentId: mainVariantAssignment.id,
//               productAttributeAssignmentId: mainVariantAssignment.id,
//             },
//           });

//           /* CLEAN OLD VALUES */
//           await tx.variantValue.deleteMany({
//             where: { variantId: existing.id },
//           });

//           await tx.productVariantImage.deleteMany({
//             where: { variantId: existing.id },
//           });

//           await tx.discount.deleteMany({
//             where: { variantId: existing.id },
//           });
//         } else {
//           /* ================= CREATE ================= */
//           currentVariant = await tx.productVariant.create({
//             data: {
//               productId: id,
//               mainVariantId: rootAttrId,
//               productVariantAssignmentId: mainVariantAssignment.id,
//               productAttributeAssignmentId: mainVariantAssignment.id,
//               mainPrice: variant.mainPrice,
//               salePrice: variant.discount
//                 ? calculateSalePrice(
//                     variant.mainPrice,
//                     variant.discount.type,
//                     variant.discount.value,
//                   )
//                 : null,
//               stock: variant.stock,
//               sku: variant.sku,
//               barcode: variant.barcode,
//               isAvailable: variant.isAvailable,
//             },
//           });
//         }

//         /* -------- VARIANT VALUES -------- */

//         for (const val of variant.values ?? []) {
//           const attributeId =
//             val.productAttributeId ??
//             (await getOrCreateCustomAttribute("VARIANT", val.name));

//           if (val.type === "SELECT" && val.attributeValueId) {
//             await tx.variantValue.create({
//               data: {
//                 variantId: currentVariant.id,
//                 attributeValueId: val.attributeValueId,
//               },
//             });

//             continue;
//           }

//           if (val.type === "INPUT" || val.type === "CUSTOM") {
//             const normalizedValue = val.attributeValue.trim();

//             let attributeValue = await tx.attributeValue.findFirst({
//               where: { attributeId, value: normalizedValue },
//             });

//             if (!attributeValue) {
//               attributeValue = await tx.attributeValue.create({
//                 data: {
//                   attributeId,
//                   value: normalizedValue,
//                 },
//               });
//             }

//             await tx.variantValue.create({
//               data: {
//                 variantId: currentVariant.id,
//                 attributeValueId: attributeValue.id,
//               },
//             });
//           }
//         }

//         /* -------- IMAGES -------- */

//         if (variant.images?.length) {
//           const images = await Promise.all(
//             variant.images.map((img: any) =>
//               tx.productVariantImage.create({
//                 data: {
//                   variantId: currentVariant.id,
//                   imageUrl: img.imageUrl,
//                   alt: img.alt ?? null,
//                   sortOrder: img.sortOrder ?? null,
//                 },
//               }),
//             ),
//           );

//           const mainImage = images.find(
//             (_: any, i: number) => variant.images[i].isMain,
//           );

//           if (mainImage) {
//             await tx.productMainImage.create({
//               data: { productImageId: mainImage.id },
//             });
//           }
//         }

//         /* -------- DISCOUNT -------- */

//         if (variant.discount) {
//           await tx.discount.create({
//             data: {
//               variantId: currentVariant.id,
//               type: variant.discount.type,
//               value: variant.discount.value,
//             },
//           });
//         }
//       }

//       return updatedProduct;
//     },
//     { timeout: 20000 },
//   );
// };

const updateProduct = async (id: string, payload: any) => {
  const { specifications, variants, ...productData } = payload;

  const existingProduct = await prisma.product.findUnique({
    where: { id, isDeleted: false },
  });

  if (!existingProduct) {
    throw new ApiError(404, "Product not found");
  }

  return await prisma.$transaction(
    async (tx: any) => {
      /* ---------------- UPDATE PRODUCT ---------------- */

      const updatedProduct = await tx.product.update({
        where: { id },
        data: { ...productData },
      });

      /* ---------------- ATTRIBUTE CACHE ---------------- */

      const attributeCache: Record<string, string> = {};

      const getOrCreateCustomAttribute = async (
        propertyType: string,
        attributeName: string,
      ) => {
        const key = `${propertyType}-${attributeName}`;
        if (attributeCache[key]) return attributeCache[key];

        const attr = await tx.attribute.create({
          data: {
            name: attributeName,
            type: "INPUT",
            propertyType,
          },
        });

        attributeCache[key] = attr.id;
        return attr.id;
      };

      /* ---------------- SPECIFICATIONS RESET ---------------- */

      await tx.productSpecification.deleteMany({
        where: { productId: id },
      });

      if (specifications?.length) {
        for (const spec of specifications) {
          const attributeId =
            spec.productAttributeId ??
            (await getOrCreateCustomAttribute("ATTRIBUTE", spec.name));

          const assignment = await tx.productAttributeAssignment.create({
            data: {
              productAttributeId: attributeId,
              type: spec.type,
              assignmentType: "ATTRIBUTE",
            },
          });

          await tx.productSpecification.create({
            data: {
              productId: id,
              productAttributeAssignmentId: assignment.id,
            },
          });

          if (spec.type === "SELECT" && spec.attributeValueId) {
            await tx.selectPropertyValue.create({
              data: {
                productAttributeAssignmentId: assignment.id,
                attributeValueId: spec.attributeValueId,
              },
            });
          }

          if (spec.type === "INPUT" || spec.type === "CUSTOM") {
            await tx.inputCustomPropertyValue.create({
              data: {
                productAttributeAssignmentId: assignment.id,
                attributeValue: spec.attributeValue,
              },
            });
          }
        }
      }

      /* ================= VARIANTS ================= */

      const existingVariants = await tx.productVariant.findMany({
        where: { productId: id },
      });

      const existingMap = new Map(existingVariants.map((v: any) => [v.sku, v]));
      const incomingSkus = variants?.map((v: any) => v.sku) || [];

      /* -------- DELETE REMOVED VARIANTS -------- */

      const toDelete = existingVariants.filter(
        (v: any) => !incomingSkus.includes(v.sku),
      );

      for (const v of toDelete) {
        // delete children first
        await tx.variantValue.deleteMany({ where: { variantId: v.id } });
        await tx.productVariantImage.deleteMany({ where: { variantId: v.id } });
        await tx.discount.deleteMany({ where: { variantId: v.id } });

        // delete variant first (IMPORTANT)
        await tx.productVariant.delete({ where: { id: v.id } });

        // then delete assignment
        if (v.productVariantAssignmentId) {
          await tx.inputCustomPropertyValue.deleteMany({
            where: {
              productAttributeAssignmentId: v.productVariantAssignmentId,
            },
          });

          await tx.selectPropertyValue.deleteMany({
            where: {
              productAttributeAssignmentId: v.productVariantAssignmentId,
            },
          });

          await tx.productAttributeAssignment.deleteMany({
            where: { id: v.productVariantAssignmentId },
          });
        }
      }

      /* -------- UPSERT VARIANTS -------- */

      for (const variant of variants ?? []) {
        const rootVal = variant.mainVariant;
        if (!rootVal) throw new ApiError(400, "Main variant is required");

        const existing: any = existingMap.get(variant.sku);

        const rootAttrId =
          rootVal.productAttributeId ??
          (await getOrCreateCustomAttribute("MAIN_VARIANT", rootVal.name));

        let oldAssignmentId = existing?.productVariantAssignmentId;

        /* -------- CREATE NEW ASSIGNMENT -------- */

        const newAssignment = await tx.productAttributeAssignment.create({
          data: {
            productAttributeId: rootAttrId,
            type: rootVal.type,
            assignmentType: "MAIN_VARIANT",
          },
        });

        /* -------- SAVE MAIN VARIANT VALUE (FIX) -------- */

        if (rootVal.type === "SELECT" && rootVal.attributeValueId) {
          await tx.selectPropertyValue.create({
            data: {
              productAttributeAssignmentId: newAssignment.id,
              attributeValueId: rootVal.attributeValueId,
            },
          });
        }

        if (rootVal.type === "INPUT" || rootVal.type === "CUSTOM") {
          await tx.inputCustomPropertyValue.create({
            data: {
              productAttributeAssignmentId: newAssignment.id,
              attributeValue: rootVal.attributeValue,
            },
          });
        }

        let currentVariant;

        /* ================= UPDATE ================= */
        if (existing) {
          currentVariant = await tx.productVariant.update({
            where: { id: existing.id },
            data: {
              mainPrice: variant.mainPrice,
              salePrice: variant.discount
                ? calculateSalePrice(
                    variant.mainPrice,
                    variant.discount.type,
                    variant.discount.value,
                  )
                : null,
              stock: variant.stock,
              barcode: variant.barcode,
              isAvailable: variant.isAvailable,
              productVariantAssignmentId: newAssignment.id,
              productAttributeAssignmentId: newAssignment.id,
            },
          });

          // clean children
          await tx.variantValue.deleteMany({
            where: { variantId: existing.id },
          });

          await tx.productVariantImage.deleteMany({
            where: { variantId: existing.id },
          });

          await tx.discount.deleteMany({
            where: { variantId: existing.id },
          });

          // delete old assignment AFTER update (IMPORTANT)
          if (oldAssignmentId) {
            await tx.inputCustomPropertyValue.deleteMany({
              where: { productAttributeAssignmentId: oldAssignmentId },
            });

            await tx.selectPropertyValue.deleteMany({
              where: { productAttributeAssignmentId: oldAssignmentId },
            });

            await tx.productAttributeAssignment.deleteMany({
              where: { id: oldAssignmentId },
            });
          }
        } else {
          /* ================= CREATE ================= */
          currentVariant = await tx.productVariant.create({
            data: {
              productId: id,
              mainVariantId: rootAttrId,
              productVariantAssignmentId: newAssignment.id,
              productAttributeAssignmentId: newAssignment.id,
              mainPrice: variant.mainPrice,
              salePrice: variant.discount
                ? calculateSalePrice(
                    variant.mainPrice,
                    variant.discount.type,
                    variant.discount.value,
                  )
                : null,
              stock: variant.stock,
              sku: variant.sku,
              barcode: variant.barcode,
              isAvailable: variant.isAvailable,
            },
          });
        }

        /* -------- VARIANT VALUES -------- */

        for (const val of variant.values ?? []) {
          const attributeId =
            val.productAttributeId ??
            (await getOrCreateCustomAttribute("VARIANT", val.name));

          if (val.type === "SELECT" && val.attributeValueId) {
            await tx.variantValue.create({
              data: {
                variantId: currentVariant.id,
                attributeValueId: val.attributeValueId,
              },
            });
            continue;
          }

          if (val.type === "INPUT" || val.type === "CUSTOM") {
            let attributeValue = await tx.attributeValue.findFirst({
              where: {
                attributeId,
                value: val.attributeValue,
              },
            });

            if (!attributeValue) {
              attributeValue = await tx.attributeValue.create({
                data: {
                  attributeId,
                  value: val.attributeValue,
                },
              });
            }

            await tx.variantValue.create({
              data: {
                variantId: currentVariant.id,
                attributeValueId: attributeValue.id,
              },
            });
          }
        }

        /* -------- IMAGES -------- */

        if (variant.images?.length) {
          const images = await Promise.all(
            variant.images.map((img: any) =>
              tx.productVariantImage.create({
                data: {
                  variantId: currentVariant.id,
                  imageUrl: img.imageUrl,
                  alt: img.alt ?? null,
                  sortOrder: img.sortOrder ?? null,
                },
              }),
            ),
          );

          const mainImage = images.find(
            (_: any, i: number) => variant.images[i].isMain,
          );

          if (mainImage) {
            await tx.productMainImage.create({
              data: { productImageId: mainImage.id },
            });
          }
        }

        /* -------- DISCOUNT -------- */

        if (variant.discount) {
          await tx.discount.create({
            data: {
              variantId: currentVariant.id,
              type: variant.discount.type,
              value: variant.discount.value,
            },
          });
        }
      }

      return updatedProduct;
    },
    { timeout: 20000 },
  );
};

const deleteProduct = async (userId: string, id: string) => {
  const product = await prisma.product.findFirst({
    where: { id, vendor: { userId }, isDeleted: false },
  });

  if (!product) {
    throw new ApiError(404, "Product not found or unauthorized");
  }

  // Naim
  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  });

  return null;
};

const restoreProduct = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (!product.isDeleted) {
    throw new ApiError(400, "Product is not deleted");
  }

  return prisma.product.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });
};

const hardDeleteProduct = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return prisma.$transaction(async (tx) => {
    /* ===== Get Variant IDs ===== */

    const variants = await tx.productVariant.findMany({
      where: { productId: id },
      select: { id: true },
    });

    const variantIds = variants.map((v) => v.id);

    /* ===== Delete Variant Related Data ===== */

    if (variantIds.length) {
      await tx.variantValue.deleteMany({
        where: { variantId: { in: variantIds } },
      });

      await tx.productVariantImage.deleteMany({
        where: { variantId: { in: variantIds } },
      });

      await tx.discount.deleteMany({
        where: { variantId: { in: variantIds } },
      });

      await tx.productVariant.deleteMany({
        where: { id: { in: variantIds } },
      });
    }

    /* ===== Delete Specifications ===== */

    await tx.productSpecification.deleteMany({
      where: { productId: id },
    });

    /* ===== Finally Delete Product ===== */

    await tx.product.delete({
      where: { id },
    });

    return null;
  });
};

const createReview = async (
  userId: string,
  payload: { productId: string; review: string; rating: number },
) => {
  const { productId, review, rating } = payload;

  if (rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  // check if the product is ordered
  const orderItem = await prisma.orderItem.findFirst({
    where: {
      product_id: productId,
      order: {
        user_id: userId,
      },
    },
    select: {
      id: true,
    },
  });
  if (!orderItem) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Order the product to place a review",
    );
  }
  const product = await prisma.product.findUnique({
    where: { id: productId, isDeleted: false },
    select: {
      id: true,
      rating: true,
      ratingCount: true,
      storeId: true,
      vendorId: true,
    },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const alreadyReviewed = await prisma.productReview.findUnique({
    where: {
      productId_reviewBy: {
        productId,
        reviewBy: userId,
      },
    },
  });

  if (alreadyReviewed) {
    throw new ApiError(400, "You already reviewed this product");
  }

  return prisma.$transaction(async (tx) => {
    /* ---------------- CREATE REVIEW ---------------- */

    const createdReview = await tx.productReview.create({
      data: {
        productId,
        review,
        rating,
        reviewBy: userId,
      },
    });

    /* ---------------- UPDATE PRODUCT RATING ---------------- */

    const oldProductRating = product.rating ?? 0;
    const oldProductCount = product.ratingCount ?? 0;

    const newProductRating =
      (oldProductRating * oldProductCount + rating) / (oldProductCount + 1);

    await tx.product.update({
      where: { id: productId },
      data: {
        rating: newProductRating,
        ratingCount: { increment: 1 },
      },
    });

    /* ---------------- UPDATE STORE RATING ---------------- */

    const store = await tx.store.findUnique({
      where: { id: product.storeId },
      select: {
        rating: true,
        reviewCount: true,
      },
    });

    if (store) {
      const oldStoreRating = store.rating ?? 0;
      const oldStoreCount = store.reviewCount ?? 0;

      const newStoreRating =
        (oldStoreRating * oldStoreCount + rating) / (oldStoreCount + 1);

      await tx.store.update({
        where: { id: product.storeId },
        data: {
          rating: newStoreRating,
          reviewCount: { increment: 1 },
        },
      });
    }

    /* ---------------- UPDATE VENDOR RATING ---------------- */

    if (product.vendorId) {
      const vendor = await tx.vendor.findUnique({
        where: { id: product.vendorId },
        select: {
          rating: true,
          reviewCount: true,
        },
      });

      if (vendor) {
        const oldVendorRating = vendor.rating ?? 0;
        const oldVendorCount = vendor.reviewCount ?? 0;

        const newVendorRating =
          (oldVendorRating * oldVendorCount + rating) / (oldVendorCount + 1);

        await tx.vendor.update({
          where: { id: product.vendorId },
          data: {
            rating: newVendorRating,
            reviewCount: { increment: 1 },
          },
        });
      }
    }

    return createdReview;
  });
};

const updateReview = async (
  userId: string,
  reviewId: string,
  payload: { review?: string; rating?: number },
) => {
  const existing = await prisma.productReview.findFirst({
    where: { id: reviewId, reviewBy: userId },
  });

  if (!existing) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Review not found or unauthorized",
    );
  }

  return prisma.$transaction(async (tx) => {
    const updatedReview = await tx.productReview.update({
      where: { id: reviewId },
      data: payload,
    });

    const stats = await tx.productReview.aggregate({
      where: { productId: existing.productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const updatedProduct = await tx.product.update({
      where: { id: existing.productId },
      data: {
        rating: stats._avg.rating ?? 0,
        ratingCount: stats._count.rating,
      },
    });

    return {
      review: updatedReview,
      product: updatedProduct,
    };
  });
};

const deleteReview = async (userId: string, reviewId: string) => {
  const existing = await prisma.productReview.findFirst({
    where: { id: reviewId, reviewBy: userId },
  });

  if (!existing) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Review not found or unauthorized",
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.productReview.delete({
      where: { id: reviewId },
    });

    const stats = await tx.productReview.aggregate({
      where: { productId: existing.productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.product.update({
      where: { id: existing.productId },
      data: {
        rating: stats._avg.rating ?? 0,
        ratingCount: stats._count.rating,
      },
    });

    return null;
  });
};

const replyToReview = async (
  adminId: string,
  reviewId: string,
  reply: string,
) => {
  const reviewData = await prisma.productReview.findUnique({
    where: { id: reviewId },
  });

  if (!reviewData) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Review not found");
  }
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
  });
  if (!admin) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }
  return prisma.productReview.update({
    where: { id: reviewId },
    data: {
      reply,
      replyBy: adminId,
    },
  });
};

const productRestrict = async (
  // userId: string,
  productId: string,
  payload: { isDisable: boolean },
) => {
  const { isDisable } = payload;

  if (typeof isDisable !== "boolean") {
    throw new ApiError(400, "isDisable must be true or false");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      isDisable: true,
      isDeleted: true,
    },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (product.isDeleted) {
    throw new ApiError(400, "Deleted product cannot be restricted");
  }

  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: {
      isDisable,
    },
    select: {
      id: true,
      name: true,
      isDisable: true,
      updatedAt: true,
    },
  });

  return updatedProduct;
};

const getVendorWiseReviews = async (vendorId: string, type?: string) => {
  /* ---------------- VALIDATE TYPE ---------------- */
  const validTypes = ["replied", "unreplied"];

  let filterCondition: any = {};

  if (type && validTypes.includes(type)) {
    if (type === "replied") {
      filterCondition.reply = { not: null };
    }

    if (type === "unreplied") {
      filterCondition.reply = null;
    }
  }

  /* ---------------- GET REVIEWS ---------------- */
  const reviews = await prisma.productReview.findMany({
    where: {
      ...filterCondition,

      product: {
        vendorId: vendorId,
        isDeleted: false,
      },
    },

    orderBy: {
      createdAt: "desc", // recent first
    },

    select: {
      id: true,
      review: true,
      reply: true,
      rating: true,
      createdAt: true,

      product: {
        select: {
          id: true,
          name: true,
          productSlug: true,
        },
      },

      reviewer: {
        select: {
          id: true,
          name: true,
          profile_photo: true,
        },
      },

      replier: {
        select: {
          id: true,
          name: true,
          profile_photo: true,
        },
      },
    },
  });

  /* ---------------- ADD TYPE FIELD ---------------- */
  const formatted = reviews.map((item) => ({
    ...item,
    reviewType: item.reply ? "replied" : "unreplied",
  }));

  return formatted;
};

const getCheckoutProducts = async (productIds: string[]) => {
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isDeleted: false,
      isDisable: false,
    },

    select: {
      id: true,
      name: true,

      category: {
        select: {
          id: true,
          name: true,
        },
      },

      store: {
        select: {
          id: true,
          vendorId: true,
          shopName: true,
        },
      },

      variants: {
        where: {
          isAvailable: true,
        },
        select: {
          id: true,
          mainPrice: true,
          salePrice: true,
          stock: true,
          sku: true,

          images: {
            take: 1,
            orderBy: {
              createdAt: "asc",
            },
            select: {
              imageUrl: true,
            },
          },
        },
      },
    },
  });

  return products;
};

export const ProductService = {
  createProduct,
  getAllProducts,

  // by nahid
  getVendorAllProducts,
  getVendorMostSoldProducts,

  getSingleProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  hardDeleteProduct,
  createReview,
  updateReview,
  deleteReview,
  replyToReview,
  getSingleProductBySlug,
  productRestrict,
  getVendorWiseReviews,
  getCheckoutProducts,
};
