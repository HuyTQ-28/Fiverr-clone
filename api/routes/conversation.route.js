import express from "express";
import { verifyToken } from "../middleware/jwt.js";
import {
  createConversation,
  getConversations,
  getSingleConversation,
  updateLastMessage,
} from "../controllers/conversation.controller.js";

const router = express.Router();

router.post("/", verifyToken, createConversation);
router.get("/", verifyToken, getConversations);
router.get("/:id", verifyToken, getSingleConversation);
router.put("/last-message", verifyToken, updateLastMessage);

export default router;
