import express from "express";
import { verifyToken } from "../middleware/jwt.js";
import { uploadFile } from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/", verifyToken, uploadFile);

export default router;
