import { Server } from "socket.io";
import ApiError from "../errors/ApiError";
import httpStatus from "http-status";
let io: Server;

export const initSocket = (httpServer: any) => {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
    },
  });
  io.on("connection", (socket) => {
    console.log("Socket connected", socket.id);
    socket.on("join_room", (room) => {
      socket.join(room);
      console.log(`${socket.id} joined ${room}`);
    });
  });
};
export const getIo = () => {
  if (!io)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Socket not initialized",
    );

  return io;
};
