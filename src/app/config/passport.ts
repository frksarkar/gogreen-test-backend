import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import config from ".";
import { prisma } from "../shared/prisma";
import { Request } from "express";
import { createReferralChain } from "../shared/createReferralChain";
import { createReferralCode } from "../utils/createReferralCode";
passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.client_id,
      clientSecret: config.google.client_secret,
      callbackURL: config.google.callback_url,
      passReqToCallback: true,
    },
    async (
      req: Request,
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      const state = req.query.state as string;
      const referral = state ? JSON.parse(state).ref : null;
      try {
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(null, false, { message: "No Email Found" });
        }
        //create referral code
        const referralCode = createReferralCode(email);
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          await prisma.$transaction(async (tnx) => {
            user = await tnx.user.create({
              data: {
                email,
                name: profile.displayName,
                profile_photo: profile.photos?.[0].value,
                referral_code: referralCode,
                isVerified: true,
              },
            });
            // const role = await tnx.role.findUnique({
            //   where: {
            //     name: "Customer",
            //   },
            // });
            // if (!role) return done(null, false, { message: "No Role Found" });
            // await tnx.userRole.create({
            //   data: {
            //     user_id: user.id,
            //     role_id: role.id,
            //   },
            // });
            if (referral) {
              await createReferralChain(tnx, user.id, referral);
            }
          });
        }
        return done(null, user!);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

passport.serializeUser((user: any, done: (err?: any, id?: unknown) => void) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });
    done(null, user);
  } catch (error) {
    done(error);
  }
});
