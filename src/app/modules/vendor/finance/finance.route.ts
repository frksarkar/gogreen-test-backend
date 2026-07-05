import { Router } from "express";
import { auth } from "../../../middlewares/auth";
import { validateRequest } from "../../../middlewares/validateRequest";
import { FinanceController } from "./finance.controller";
import { FinanceValidation } from "./finance.validation";

const router = Router();

router.get("/wallet", 
  auth(),
   FinanceController.getVendorWallet);

router.post(
  "/payout-methods",
  auth(),
  validateRequest(FinanceValidation.createPayoutMethodZodSchema),
  FinanceController.addVendorPayoutMethod,
);

router.get(
  "/payout-methods",
  auth(),
  FinanceController.getVendorPayoutMethods,
);

router.get(
  "/payout-methods/:id",
  auth(),
  FinanceController.getPayoutMethodById,
);

router.patch(
  "/payout-methods/:id",
  auth(),
  FinanceController.updateVendorPayoutMethod,
);

router.delete(
  "/payout-methods/:id",
  auth(),
  FinanceController.deleteVendorPayoutMethod,
);

router.delete(
  "/payout-methods/hard/:id",
  auth(),
  FinanceController.hardDeleteVendorPayoutMethod,
);

router.post(
  "/request-payout",
  auth(),
  validateRequest(FinanceValidation.requestPayoutZodSchema),
  FinanceController.requestPayout,
);

router.get("/payouts", 
  auth(),
   FinanceController.getVendorPayouts);

router.get("/payout/:id", 
  auth(),
   FinanceController.getPayoutById);

router.patch("/payout/:id",
  auth(),
  validateRequest(FinanceValidation.updatePayoutZodSchema),
  FinanceController.updateVendorPayout);

router.delete("/payout/:id", 
  auth(),
   FinanceController.deleteVendorPayout);

router.delete("/payout/hard/:id", 
  auth(),
   FinanceController.hardDeleteVendorPayout);

router.get(
  "/transactions",
  auth(),
  FinanceController.getVendorTransactions,
);

// Admin Access
router.get(
  "/payouts/all",
  auth(),
  FinanceController.getAllPayouts,
);

router.patch(
  "/payout/:id/status",
  auth(),
  validateRequest(FinanceValidation.updatePayoutStatusZodSchema),
  FinanceController.updatePayoutStatus,
);

export const FinanceRouter = router;
