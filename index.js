// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import cookie from "cookie";

import userRoutes from "./routes/users.js";
import questionRoutes from "./routes/Questions.js";
import answerRoutes from "./routes/Answers.js";
import tweetcommentRoutes from "./routes/TweetComment.js";
import tweetsRoutes from "./routes/Tweets.js";
import storesRoutes from "./routes/Store.js";
import paymentRoutes from "./routes/payment.js";
import connectDB from "./connectMongoDb.js";

// Initialize
dotenv.config();
connectDB();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = {}; // { roomId: { users: [], files: [] } }

// Middleware
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

// Static file serving
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// HTML routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "main.html"));
});
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Register.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Login.html"));
});
app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "About.html"));
});

// API routes
app.use("/api/user", userRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/answer", answerRoutes);
app.use("/api/tweetcomment", tweetcommentRoutes);
app.use("/api/tweets", tweetsRoutes);
app.use("/api/stores", storesRoutes);
app.use("/api/payment", paymentRoutes);

// Socket.IO middleware to validate auth token
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    const apiKey = socket.handshake.headers['x-api-key'] || cookies.userApiKey;

    if (!token && !apiKey) {
      return next(new Error("Unauthorized: Token or API key required"));
    }

    if (apiKey === process.env.MASTER_API_KEY) {
      return next();
    }

    if (apiKey !== cookies.userApiKey) {
      return next(new Error("Forbidden: Invalid API key"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded?.id;
    next();
  } catch (err) {
    console.error("Socket auth error:", err);
    return next(new Error("Authentication failed"));
  }
});

// Live Code Collaboration - Socket.IO
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", ({ roomId, user, language }) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {
        users: [],
        notes: "",
        files: [
          {
            id: 1,
            name: `Solution.${getExtension(language)}`,
            language,
            content: ""
          }
        ]
      };
    }

    rooms[roomId].users.push({ ...user, socketId: socket.id });
    io.to(roomId).emit("users-update", rooms[roomId].users);

    socket.emit("file-update", {
      files: rooms[roomId].files,
      userId: user.id
    });

    socket.emit("notes-update", {
      newNotes: rooms[roomId].notes || "",
      userId: "server"
    });
  });

  socket.on("code-update", ({ roomId, newCode, userId, fileId }) => {
    const file = rooms[roomId]?.files.find(f => f.id === fileId);
    if (file) file.content = newCode;
    socket.to(roomId).emit("code-update", { newCode, userId, fileId });
  });

  socket.on("language-update", ({ roomId, newLanguage, userId, fileId }) => {
    const file = rooms[roomId]?.files.find(f => f.id === fileId);
    if (file) file.language = newLanguage;
    socket.to(roomId).emit("language-update", { newLanguage, userId, fileId });
  });

  socket.on("notes-update", ({ roomId, newNotes, userId }) => {
    if (rooms[roomId]) rooms[roomId].notes = newNotes;
    socket.to(roomId).emit("notes-update", { newNotes, userId });
  });

  
  socket.on("file-update", ({ roomId, files, userId }) => {
    if (rooms[roomId]) rooms[roomId].files = files;
    socket.to(roomId).emit("file-update", { files, userId });
  });

  socket.on("cursor-update", ({ roomId, position, userId, fileId }) => {
    socket.to(roomId).emit("cursor-update", { position, userId, fileId });
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const index = room.users.findIndex(u => u.socketId === socket.id);
      if (index !== -1) {
        room.users.splice(index, 1);
        io.to(roomId).emit("users-update", room.users);
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

function getExtension(language) {
  const map = {
    javascript: "js",
    python: "py",
    java: "java",
    cpp: "cpp",
    html: "html",
    css: "css",
    typescript: "ts",
  };
  return map[language] || "txt";
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
