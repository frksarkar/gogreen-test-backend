import { NextFunction, Request, Response, Router } from "express";
import { AuthController } from "./auth.controller";
import passport from "passport";
import { validateRequest } from "../../middlewares/validateRequest";
import { AuthSchema } from "./auth.validation";
import { auth } from "../../middlewares/auth";

const route = Router();
route.post(
  "/register",
  validateRequest(AuthSchema.registerSchema),
  AuthController.register,
);
route.post(
  "/login",
  validateRequest(AuthSchema.loginSchema),
  AuthController.login,
);
route.post("/logout", AuthController.logout);
route.post(
  "/add-password",
  auth(),
  validateRequest(AuthSchema.addPasswordSchema),
  AuthController.addPassword,
);
route.post("/refresh-token", AuthController.getNewAccessToken);
route.post(
  "/forget-password",
  validateRequest(AuthSchema.forgetPasswordSchema),
  AuthController.forgetPassword,
);
route.post(
  "/generate-reset-token",
  validateRequest(AuthSchema.generateResetTokenSchema),
  AuthController.generateResetToken,
);
route.post(
  "/reset-password",
  validateRequest(AuthSchema.resetPasswordSchema),
  AuthController.resetPassword,
);
route.get(
  "/google",
  async (req: Request, res: Response, next: NextFunction) => {
    const state = JSON.stringify(req.query || {});
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state,
    })(req, res, next);
  },
);
route.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    failureMessage: true,
  }),
  AuthController.googleCallback,
);
export const AuthRouter = route;
