import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import fileUpload from "express-fileupload";
import path from "path";
import { fileURLToPath } from "url";
import initializeSocket from "./socket.js";

// Import routes
import userRoute from "./routes/user.route.js";
import gigRoute from "./routes/gig.route.js";
import orderRoute from "./routes/order.route.js";
import conversationRoute from "./routes/conversation.route.js";
import messageRoute from "./routes/message.route.js";
import reviewRoute from "./routes/review.route.js";
import categoryRoute from "./routes/category.route.js";
import authRoute from "./routes/auth.route.js";
import uploadRoute from "./routes/upload.route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
dotenv.config();

if (!process.env.MONGO) {
  console.error("MONGO environment variable is not set");
  process.exit(1);
}

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to mongoDB");
  } catch (error) {
    console.log(error);
  }
};

app.use(
  cors({
    origin: process.env.FRONTEND_URL, // Frontend origin
    credentials: true, // Cho phép gửi cookie
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Các phương thức được phép
    allowedHeaders: ["Content-Type", "Authorization"], // Headers được phép
  })
);

// For normal routes, parse request body as JSON
app.use(express.json());
app.use(cookieParser());

// File upload middleware
app.use(
  fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    useTempFiles: true,
    tempFileDir: "/tmp/",
    abortOnLimit: true,
  })
);

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

// API Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/gigs", gigRoute);
app.use("/api/orders", orderRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/upload", uploadRoute);

app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";

  return res.status(errorStatus).send(errorMessage);
});

const httpServer = createServer(app);
const io = initializeSocket(httpServer);

httpServer.listen(8800, () => {
  connect();
  console.log("Backend server is running");
});

export { io };
