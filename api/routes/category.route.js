import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import { verifyToken } from "../middleware/jwt.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

router.get("/", getAllCategories);
router.get("/:identifier", getCategory);

router.post("/", verifyToken, isAdmin, createCategory);
router.put("/:identifier", verifyToken, isAdmin, updateCategory);
router.delete("/:identifier", verifyToken, isAdmin, deleteCategory);

export default router;
