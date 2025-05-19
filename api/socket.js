import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  // Store active users
  let onlineUsers = [];

  // Middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      console.log("Token not provided - allowing connection for debugging");
      socket.userId = "anonymous";
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_KEY);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      console.error("JWT verification error:", err.message);
      socket.userId = "anonymous";
      next();
    }
  });

  io.on("connection", (socket) => {
    console.log(
      "New client connected:",
      socket.id,
      "with userId:",
      socket.userId
    );

    // Add user to online users
    socket.on("add-user", (userId) => {
      const userIdToUse = userId || socket.userId || socket.id;

      console.log("User added to online list:", userIdToUse);

      // Ensure the user is not already in the online users array
      if (!onlineUsers.some((user) => user.userId === userIdToUse)) {
        onlineUsers.push({
          userId: userIdToUse,
          socketId: socket.id,
        });
      }
      io.emit("get-users", onlineUsers);
    });

    // Send and receive messages
    socket.on("send-message", (data) => {
      console.log("Message received via socket:", data);

      const receiver = onlineUsers.find(
        (user) => user.userId === data.receiverId
      );

      if (receiver) {
        io.to(receiver.socketId).emit("receive-message", {
          senderId: data.senderId,
          text: data.text,
          createdAt: Date.now(),
          conversationId: data.conversationId,
          attachments: data.attachments || [],
        });
      }
    });

    // Handle typing indicators
    socket.on("typing", (data) => {
      const receiver = onlineUsers.find(
        (user) => user.userId === data.receiverId
      );

      if (receiver) {
        io.to(receiver.socketId).emit("typing", {
          senderId: data.senderId,
          conversationId: data.conversationId,
        });
      }
    });

    socket.on("stop-typing", (data) => {
      const receiver = onlineUsers.find(
        (user) => user.userId === data.receiverId
      );

      if (receiver) {
        io.to(receiver.socketId).emit("stop-typing", {
          senderId: data.senderId,
          conversationId: data.conversationId,
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
      io.emit("get-users", onlineUsers);
    });
  });

  return io;
};

export default initializeSocket;
