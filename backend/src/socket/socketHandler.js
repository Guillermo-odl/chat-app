const Message = require("../models/Message");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");

// Map userId -> socketId
const userSocketMap = new Map();

const initSocket = (io) => {
  io.use((socket, next) => {
    // Authenticate via JWT cookie
    const cookies = cookie.parse(socket.handshake.headers.cookie || "");
    const token = cookies.jwt;
    if (!token) return next(new Error("Authentication error: No token"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    userSocketMap.set(userId, socket.id);
    console.log(`🔌 User connected: ${userId} (socket: ${socket.id})`);

    socket.on("sendMessage", async (data) => {
      try {
        const { sender, recipient, content, messageType = "text" } = data;
        if (!sender || !recipient || !content) return;

        const message = await Message.create({ sender, recipient, content, messageType });
        await message.populate([
          { path: "sender", select: "_id firstName lastName email image color" },
          { path: "recipient", select: "_id firstName lastName email image color" },
        ]);

        const payload = {
          id: message._id,
          sender: message.sender,
          recipient: message.recipient,
          content: message.content,
          messageType: message.messageType,
          timestamp: message.timestamp,
        };

        // Emit to recipient if online
        const recipientSocketId = userSocketMap.get(recipient.toString());
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("receiveMessage", payload);
        }

        // Also emit back to sender
        io.to(socket.id).emit("receiveMessage", payload);
      } catch (err) {
        console.error("sendMessage error:", err);
      }
    });

    socket.on("disconnect", () => {
      userSocketMap.delete(userId);
      console.log(`🔌 User disconnected: ${userId}`);
    });
  });
};

module.exports = { initSocket };
