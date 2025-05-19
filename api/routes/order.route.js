import express from "express";
import {
  createPaymentIntentAndOrder,
  confirmOrderAfterClientPayment,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

// Buyer tạo Payment Intent và Order ban đầu
router.post(
  "/create-payment-intent/gig/:gigId",
  verifyToken,
  createPaymentIntentAndOrder
);

// Buyer xác nhận thanh toán thành công từ client (SAU KHI Stripe.confirmCardPayment() ở client thành công)
router.post("/confirm-client-payment", confirmOrderAfterClientPayment);

// Lấy danh sách order (của buyer hoặc seller tùy theo req.role)
router.get("/my-orders", verifyToken, getMyOrders);

// Lấy chi tiết order
router.get("/:id", verifyToken, getOrderById);

// Cập nhật trạng thái order (ví dụ: delivered, completed)
router.patch("/:id/status", verifyToken, updateOrderStatus);

export default router;
