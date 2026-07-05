import config from "../config";
import { prisma } from "../shared/prisma";
import bcryptjs from "bcryptjs";
import { generateSlug } from "./generateSlug";
export const seedSuperAdmin = async () => {
  try {
    let superAdmin;
    superAdmin = await prisma.user.findFirst({
      where: {
        email: config.super_admin.email,
      },
    });
    if (superAdmin) {
      console.log("Super Admin already exists");
      return;
    }
    console.log("Trying to create super admin");
    const password = await bcryptjs.hash(
      config.super_admin.password,
      config.bcrypt_salt_round,
    );
    await prisma.$transaction(async (tnx) => {
      superAdmin = await tnx.user.create({
        data: {
          email: config.super_admin.email,
          isVerified: true,
          password,
        },
      });
      let role;
      role = await tnx.role.findFirst({
        where: {
          name: {
            equals: config.super_admin.role,
            mode: "insensitive",
          },
        },
      });
      if (!role) {
        const slug = await generateSlug(config.super_admin.role, "role");
        role = await tnx.role.create({
          data: {
            name: config.super_admin.role,
            slug,
            description: "Super Admin Role",
            systemLevel: "SYSTEM",
          },
        });
      }
      await tnx.userRole.create({
        data: {
          user_id: superAdmin.id,
          role_id: role.id,
        },
      });
    });
    console.log("Super admin created successfully!");
  } catch (error) {
    console.log(error);
  }
};
