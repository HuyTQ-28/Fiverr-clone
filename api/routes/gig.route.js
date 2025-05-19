import express from "express";
import {
  createGig,
  deleteGig,
  getGig,
  getGigs,
  updateGig,
  getSellerGigs,
  changeGigStatus,
  adminChangeGigStatus,
} from "../controllers/gig.controller.js";
import { verifyToken } from "../middleware/jwt.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

// Public routes
router.get("/", getGigs);
router.get("/:id", getGig);

// Seller routes
router.post("/", verifyToken, createGig);
router.put("/:id", verifyToken, updateGig);
router.delete("/:id", verifyToken, deleteGig);
router.get("/seller/mygigs", verifyToken, getSellerGigs);
router.patch("/:id/status", verifyToken, changeGigStatus);

// Admin routes
router.patch("/admin/:id/status", verifyToken, isAdmin, adminChangeGigStatus);

export default router;
