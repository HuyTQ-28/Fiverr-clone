import express from "express";
import {
  deleteUser,
  getUser,
  updateUserProfile,
  becomeSeller,
  changePassword,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/jwt.js";
const router = express.Router();

router.delete("/delete/:id", verifyToken, deleteUser);
router.get("/:id", getUser);
router.put("/update/:id", verifyToken, updateUserProfile);
router.put("/become-seller", verifyToken, becomeSeller);
router.patch("/change-password", verifyToken, changePassword);
export default router;
