import { Router } from "express";
import { ShopRouter } from "./shop/shop.route";
import { MarketingRouter } from "./marketing/marketing.route";
import { ComplianceRouter } from "./compliance/compliance.route";
import { ProfileRouter } from "./profile/profile.route";
import { PoliciesRouter } from "./policies/policies.route";
import { ReviewRouter } from "./review/review.route";
import { SocialRouter } from "./social/social.route";
import { SupportRouter } from "./support/support.route";
import { LogisticsRouter } from "./logistics/logistics.route";
import { ShippingZoneRouter } from "./shippingZone/shippingZone.route";
import { StaffRouter } from "./staff/staff.route";
import { FinanceRouter } from "./finance/finance.route";
import { AnalyticsRouter } from "./analytics/analytics.route";
import { CommissionRouter } from "./commission/commission.route";
import { UsageRouter } from "./usage/usage.route";
import { HolidayRouter } from "./holiday/holiday.route";

const router = Router();
const moduleRouters = [
  {
    path: "/shop",
    route: ShopRouter,
  },
  {
    path: "/profile",
    route: ProfileRouter,
  },
  {
    path: "/policies",
    route: PoliciesRouter,
  },
  {
    path: "/marketing",
    route: MarketingRouter,
  },
  {
    path: "/compliance",
    route: ComplianceRouter,
  },
  {
    path: "/reviews",
    route: ReviewRouter,
  },
  {
    path: "/social",
    route: SocialRouter,
  },
  {
    path: "/support",
    route: SupportRouter,
  },
  {
    path: "/logistics",
    route: LogisticsRouter,
  },
  {
    path: "/shipping-zones",
    route: ShippingZoneRouter,
  },
  {
    path: "/finance",
    route: FinanceRouter,
  },
  {
    path: "/staff",
    route: StaffRouter,
  },
  {
    path: "/analytics",
    route: AnalyticsRouter,
  },
  {
    path: "/commission",
    route: CommissionRouter,
  },
  {
    path: "/usage",
    route: UsageRouter,
  },
  {
    path: "/holiday",
    route: HolidayRouter,
  },
];

moduleRouters.forEach((route) => router.use(route.path, route.route));
export default router;
