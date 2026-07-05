import {
  Prisma,
  PrismaClient,
  ReferralRewards,
  ReferredUsers,
  User,
} from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/client";

type tnx = Omit<
  PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

export async function createReferralChain(
  tnx: tnx,
  user_id: string,
  refCode: string,
) {
  // Step 1: find the direct referrer
  let currentReferrer: User | null = await tnx.user.findUnique({
    where: { referral_code: refCode },
  });

  if (!currentReferrer) throw new Error("No Referred User Found");

  const maxLevel = await tnx.referralConfig.findMany({});
  const level = maxLevel.length !== 0 ? maxLevel[0].max_level : 5;
  // Step 2: fetch all rewards once
  const rewards = await tnx.referralRewards.findMany({
    where: { level: { lte: level } },
  });
  const rewardMap = new Map<number, ReferralRewards>(
    rewards.map((r: any) => [r.level, r]),
  );

  // Step 3: traverse up to 5 levels
  let curLevel = 1;
  while (currentReferrer && curLevel <= level) {
    const reward = rewardMap.get(curLevel);
    if (!reward)
      throw new Error(`No Referral Reward Found for level ${curLevel}`);

    // create ReferredUsers entry
    await tnx.referredUsers.create({
      data: {
        referral_user: currentReferrer.id as string,
        referred_user: user_id as string,
        rewards_id: reward.id as string,
      },
    });
    const existingEarner = await tnx.referralEarning.findFirst({
      where: {
        user_id: currentReferrer.id as string,
      },
    });
    if (existingEarner) {
      await tnx.referralEarning.update({
        where: {
          id: existingEarner.id as string,
        },
        data: {
          amount: existingEarner.amount + reward.reward_value,
        },
      });
    } else {
      await tnx.referralEarning.create({
        data: {
          user_id: currentReferrer.id as string,
          amount: reward.reward_value as number,
        },
      });
    }
    // move up the referral tree
    const parentReferral: ReferredUsers | null =
      await tnx.referredUsers.findFirst({
        where: {
          referred_user: currentReferrer.id as string,
          rewards: {
            level: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          referral: true,
        },
      });
    currentReferrer = parentReferral
      ? await tnx.user.findUnique({
          where: { id: parentReferral.referral_user },
        })
      : null;

    curLevel++;
  }
}
