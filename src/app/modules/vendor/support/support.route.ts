import { Router } from "express";
import { auth } from "../../../middlewares/auth";
import { validateRequest } from "../../../middlewares/validateRequest";
import { SupportController } from "./support.controller";
import { SupportValidation } from "./support.validation";

const router = Router();

router.post(
  "/",
  auth(),
  validateRequest(SupportValidation.createTicketZodSchema),
  SupportController.createTicket,
);

router.get("/", 
  auth(),
   SupportController.getVendorTickets);

   // Admin Access
router.get("/all", 
  auth(),
  SupportController.getAllTickets);

router.get("/:id", 
  auth(),
   SupportController.getVendorTicketById);



router.patch("/:id", 
  auth(),
  validateRequest(SupportValidation.updateTicketZodSchema),
  SupportController.updateVendorTicket);

router.delete("/:id", 
  auth(),
  SupportController.deleteTicket);

router.delete("/hard/:id", 
  auth(),
  SupportController.hardDeleteTicket);

export const SupportRouter = router;
