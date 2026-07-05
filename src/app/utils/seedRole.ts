import { prisma } from "../shared/prisma";
import { generateSlug } from "./generateSlug";

export const seedRole = async () => {
  const userRoleExists = await prisma.role.findFirst({
    where: {
      systemLevel: "CUSTOMER",
    },
  });
  if (!userRoleExists) {
    const slug = await generateSlug("CUSTOMER", "role");
    await prisma.role.create({
      data: {
        name: "CUSTOMER",
        systemLevel: "CUSTOMER",
        slug,
        description: "Role for customer",
      },
    });
    console.log("User role created");
  } else {
    console.log("User role already exists");
  }

  const vendorRoleExists = await prisma.role.findFirst({
    where: {
      systemLevel: "VENDOR",
    },
  });
  if (!vendorRoleExists) {
    const slug = await generateSlug("VENDOR", "role");
    await prisma.role.create({
      data: {
        name: "VENDOR",
        slug,
        systemLevel: "VENDOR",
        description: "Role for vendor",
      },
    });
    console.log("Vendor role created");
  } else {
    console.log("VENDOR role already exists");
  }
  const adminRoleExists = await prisma.role.findFirst({
    where: {
      name: "ADMIN",
      systemLevel: "SYSTEM",
    },
  });
  if (!adminRoleExists) {
    const slug = await generateSlug("ADMIN", "role");
    await prisma.role.create({
      data: {
        name: "ADMIN",
        slug,
        systemLevel: "SYSTEM",
        description: "Role for admin",
      },
    });
    console.log("ADMIN Role created successfully");
  } else {
    console.log("Admin role already exists");
  }
};
