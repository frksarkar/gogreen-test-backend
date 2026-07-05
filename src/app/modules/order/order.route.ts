// import { SSLService } from "../sslCommerz/sslCommerz.service";
// import sendResponse from "../../shared/sendResponse";

import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { roleGuard } from "../../middlewares/roleGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { OrderController } from "./order.controller";
import { OrderZodSchema } from "./order.validation";

const route = Router();

route.post(
  "/",
  auth(),
  validateRequest(OrderZodSchema.createOrderZodSchema),
  OrderController.createOrder,
);
route.get("/details/:id", OrderController.getOrderDetails);
route.patch("/status/:id", auth(), OrderController.updateVendorOrderStatus);
route.get(
  "/vendor/:vendorId",
  auth(),
  roleGuard(["SYSTEM", "ADMIN", "VENDOR"]),
  OrderController.getAllVendorOrders,
);
route.get(
  "/admin/orders",
  auth(),
  roleGuard(["SYSTEM", "ADMIN"]),

  OrderController.getAllAdminOrders,
);
route.get("/my-orders", auth(), OrderController.getAllUserOrders);
route.get("/byId/:id", OrderController.getOrderById);
route.get("/store-orders/:id", OrderController.getAllAStoreOrders);
export const OrderRouter = route;
