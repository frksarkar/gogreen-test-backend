import { getIo } from "../../config/socket";

const sendNotification = async (
  data: { userId: string; message: string }[],
) => {
  data.map(({ userId, message }) => {
    const io = getIo();
    io.to(`user:${userId}`).emit("notification", `${message}`);
  });
};

export const notificationService = {
  sendNotification,
};
