import slugify from "slugify";
import { prisma } from "../shared/prisma";

export const generateSlug = async <
  T extends keyof typeof prisma
>(
  name: string,
  model: T,
  field: string = "slug"
): Promise<string> => {
  const prismaModel = prisma[model];

  if (!prismaModel || typeof prismaModel !== "object") {
    throw new Error(`Model "${String(model)}" does not exist in Prisma client.`);
  }

  if (!("findUnique" in prismaModel)) {
    throw new Error(`Model "${String(model)}" is not a valid Prisma model.`);
  }

  const baseSlug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await (prismaModel as any).findUnique({
      where: {
        [field]: slug,
      },
    });

    if (!existing) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};