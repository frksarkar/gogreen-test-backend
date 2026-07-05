import { Server } from "http";
import app from "./app";
import config from "./app/config";
// import { connectRedis } from "./app/config/redis.config";
import { initSocket } from "./app/config/socket";
import { seedRole } from "./app/utils/seedRole";
import { seedSuperAdmin } from "./app/utils/seedSuperAdmin";
import { startWalletSettlementJob } from "./jobs/walletSettlement.job";

async function bootstrap() {
  let server: Server;
  try {
    server = app.listen(config.port, () => {
      console.log(`🚀 Server is running on http://localhost:${config.port}`);
    });
    initSocket(server);

    const exitHandler = () => {
      if (server) {
        server.close(() => {
          console.log(`Server closed gracefully.`);
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    };

    process.on("unhandledRejection", (error) => {
      console.log(
        "Unhandled Rejection is detected, we are closing our server...",
      );
      if (server) {
        server.close(() => {
          console.log(error);
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("Error during server startup:", error);
    process.exit(1);
  }
}

(async () => {
  await bootstrap();
  await seedSuperAdmin();
  await seedRole();
  await startWalletSettlementJob();

  const { initOrderEmailWorker } = await import("./app/workers/order_email.worker.js");
  const { initOrderRewardWorker } = await import("./app/workers/order_reward.worker.js");
  const { initReferralWorker } = await import("./app/workers/referral.worker.js");
  initOrderEmailWorker();
  initOrderRewardWorker();
  initReferralWorker();

  // await connectRedis();
})();
