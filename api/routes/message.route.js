import express from "express";
import { verifyToken } from "../middleware/jwt.js";
import {
  createMessage,
  getMessages,
  markMessagesAsRead,
} from "../controllers/message.controller.js";

const router = express.Router();

router.post("/", verifyToken, createMessage);
router.get("/:conversationId", verifyToken, getMessages);
router.put("/:conversationId/read", verifyToken, markMessagesAsRead);

export default router;
