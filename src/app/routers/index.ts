import { Router } from "express";
import { AuthRouter } from "../modules/auth/auth.routes";
import { OTPRouter } from "../modules/otp/otp.routes";
import { userRouter } from "../modules/user/user.route";
import { referralRouter } from "../modules/referral/referral.route";
import { bkashRouter } from "../modules/bkash/bkash.route";
import { attributeRouter } from "../modules/product/attribute/attribute.routes";
import { attributeValueRouter } from "../modules/product/attributeValue/attributeValue.route";
import { categoryRouter } from "../modules/product/category/category.routes";
import { OrderRouter } from "../modules/order/order.route";
import VendorRouter from "../modules/vendor/vendorModule.route";
import { PermissionsRouter } from "../modules/admin/permission/permission.route";
import { RoleRouter } from "../modules/admin/role/role.route";
import { categoryPropertyRouter } from "../modules/product/categoryProperty/categoryProperty.route";
import { productRouter } from "../modules/product/products/product.routes";
import { employeeRouter } from "../modules/admin/employee/employee.route";
import { StaticContentRouter } from "../modules/admin/staticContent/staticContent.route";
import { NotificationRouter } from "../modules/notification/notification.route";
import { AIRoutes } from "../modules/ai/ai.route";
import { cartWishlistRouter } from "../modules/product/cartWishlist/cartWishlist.routes";
import { PaymentRoutes } from "../modules/payment/payment.route";
import { CampaignRouter } from "../modules/admin/campaign/campaign.route";
import { TaxRouter } from "../modules/admin/tax/tax.route";
import { variantValueRouter } from "../modules/product/variantValue/variantValue.routes";
import { TestimonialRouter } from "../modules/admin/testimonial/testimonial.route";
import { AdminAnalyticsRouter } from "../modules/admin/analytics/adminAnalytics.route";
import { clientHome } from "../modules/client_home/client.routes";
import { SmsRoutes } from "../modules/sms/sms.route";

const router = Router();
const moduleRouters = [
  {
    path: "/auth",
    route: AuthRouter,
  },
  {
    path: "/otp",
    route: OTPRouter,
  },
  {
    path: "/sms",
    route: SmsRoutes,
  },
  {
    path: "/user",
    route: userRouter,
  },
  {
    path: "/referral",
    route: referralRouter,
  },
  { path: "/order", route: OrderRouter },
  {
    path: "/bkash",
    route: bkashRouter,
  },
  {
    path: "/attribute",
    route: attributeRouter,
  },
  {
    path: "/attribute-value",
    route: attributeValueRouter,
  },
  {
    path: "/category",
    route: categoryRouter,
  },
  {
    path: "/vendor",
    route: VendorRouter,
  },
  {
    path: "/permission",
    route: PermissionsRouter,
  },
  {
    path: "/role",
    route: RoleRouter,
  },
  {
    path: "/category-property",
    route: categoryPropertyRouter,
  },
  {
    path: "/product",
    route: productRouter,
  },
  {
    path: "/employee",
    route: employeeRouter,
  },
  {
    path: "/static-content",
    route: StaticContentRouter,
  },
  {
    path: "/notification",
    route: NotificationRouter,
  },
  {
    path: "/cart-wishlist",
    route: cartWishlistRouter,
  },
  {
    path: "/ai",
    route: AIRoutes,
  },
  {
    path: "/payment",
    route: PaymentRoutes,
  },
  {
    path: "/campaign",
    route: CampaignRouter,
  },
  {
    path: "/tax",
    route: TaxRouter,
  },
  {
    path: "/variant-value",
    route: variantValueRouter,
  },
  {
    path: "/testimonial",
    route: TestimonialRouter,
  },
  {
    path: "/admin-analytics",
    route: AdminAnalyticsRouter,
  },
  {
    path: "/client-home",
    route: clientHome,
  },
];

moduleRouters.forEach((route) => router.use(route.path, route.route));
export default router;
