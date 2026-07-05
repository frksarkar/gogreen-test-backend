import { Router } from "express";
import { CartWishlistController } from "./cartWishlist.controller";
import { cartWishlistZodValidation } from "./cartWishlist.validation";
import { validateRequest } from "../../../middlewares/validateRequest";
import { auth } from "../../../middlewares/auth";

const router = Router();

router.post(
  "/",
  auth(),
  validateRequest(cartWishlistZodValidation.createCartWishlistZodSchema),
  CartWishlistController.createCartWishlist,
);

router.get("/", auth(), CartWishlistController.getAllCartWishlists);
router.get("/:id", auth(), CartWishlistController.getSingleCartWishlist);
router.patch("/:id", auth(), CartWishlistController.updateCartQuantity);
router.delete(
  "/",
  auth(),
  validateRequest(cartWishlistZodValidation.deleteCartWishlistZodSchema),
  CartWishlistController.deleteCartWishlist,
);

export const cartWishlistRouter = router;
