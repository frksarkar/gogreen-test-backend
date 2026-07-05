import { Request, Response, Router } from "express";
import { notificationService } from "./notification.service";

const route = Router();

route.get("/", async (req: Request, res: Response) => {
  const result = await notificationService.sendNotification([
    { userId: "1", message: "Hello" },
  ]);
  res.send({
    success: true,
    message: "Notification sent",
    data: result,
  });
});

export const NotificationRouter = route;
