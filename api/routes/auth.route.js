import express from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);

export default router;
