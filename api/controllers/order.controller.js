import Stripe from "stripe";
import Order from "../models/order.model.js";
import Gig from "../models/gig.model.js";
import User from "../models/user.model.js";
import createError from "../utils/createError.js";
import mongoose from "mongoose";

// console.log("STRIPE_SECRET_KEY from env:", process.env.STRIPE_SECRET_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const DEFAULT_CURRENCY = process.env.CURRENCY || "usd";

// 1. (Buyer) Tạo Payment Intent và Order ban đầu
export const createPaymentIntentAndOrder = async (req, res, next) => {
  const buyerId = req.userId; // Từ middleware verifyToken
  const { gigId } = req.params; // Gig ID từ URL

  try {
    const gig = await Gig.findById(gigId).populate("sellerId", "username");
    if (!gig) return next(createError(404, "Gig not found"));
    if (gig.status !== "active")
      return next(createError(400, "Gig is not active"));
    if (gig.sellerId._id.toString() === buyerId)
      return next(createError(400, "You cannot buy your own gig."));

    const buyer = await User.findById(buyerId);
    if (!buyer) return next(createError(404, "Buyer not found."));

    // Tạo PaymentIntent trên Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: gig.price * 100, // Stripe tính bằng cent
      currency: DEFAULT_CURRENCY,
      automatic_payment_methods: { enabled: true },
      metadata: {
        gigId: gig._id.toString(),
        buyerId: buyerId,
        sellerId: gig.sellerId._id.toString(),
        // Không cần orderId ở đây vì Order sẽ được tạo sau hoặc có PI ID
      },
    });

    // Tạo Order trong CSDL với trạng thái 'pending_payment'
    const newOrder = new Order({
      gigId: gig._id,
      img: gig.cover,
      title: gig.title,
      price: gig.price,
      sellerId: gig.sellerId._id,
      buyerId: buyerId,
      payment_intent: paymentIntent.id, // Lưu ID của PaymentIntent
      status: "pending_payment",
    });
    await newOrder.save();

    res.status(200).send({
      clientSecret: paymentIntent.client_secret, // Gửi client_secret cho frontend
      orderId: newOrder._id, // Gửi orderId để frontend có thể dùng sau này
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error("Create Payment Intent Error:", err.message);
    next(createError(500, "Failed to create payment intent"));
  }
};

// 2. (Client-side Triggered) Xác nhận và cập nhật Order sau khi thanh toán thành công ở Client
// API này được gọi từ frontend SAU KHI Stripe.confirmCardPayment() thành công ở client
export const confirmOrderAfterClientPayment = async (req, res, next) => {
  console.log("Received payment confirmation request:", req.body);
  const { orderId, paymentIntentId } = req.body; // Client gửi orderId và paymentIntentId

  if (!orderId || !paymentIntentId) {
    console.log("Missing required fields:", { orderId, paymentIntentId });
    return next(
      createError(400, "Order ID and Payment Intent ID are required.")
    );
  }

  try {
    // Check if orderId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      console.log("Invalid ObjectId:", orderId);
      return next(createError(400, "Invalid Order ID format"));
    }

    console.log("Looking for order:", orderId);
    const order = await Order.findById(orderId);
    console.log("Order found:", order ? "Yes" : "No");

    if (!order) return next(createError(404, "Order not found."));

    // Kiểm tra payment_intent trong order có khớp với paymentIntentId không
    if (order.payment_intent && order.payment_intent !== paymentIntentId) {
      console.log("Payment intent mismatch:", {
        orderPaymentIntent: order.payment_intent,
        receivedPaymentIntent: paymentIntentId,
      });
      return next(
        createError(400, "Payment Intent ID does not match order records.")
      );
    }

    // Chỉ cập nhật nếu đang là 'pending_payment', otherwise just return success
    console.log("Current order status:", order.status);
    if (order.status !== "pending_payment") {
      // This is likely a duplicate request, so return a success response
      return res.status(200).json({
        message: "Order has already been processed.",
        order,
        duplicateRequest: true,
      });
    }

    // Update order status to processing
    order.status = "processing";
    await order.save();
    console.log("Order updated successfully");

    // Return success response
    res.status(200).json({
      message: "Payment confirmed, order is now processing.",
      order,
    });
  } catch (err) {
    console.error("Confirm Order Error:", err);
    next(createError(500, "Failed to confirm order: " + err.message));
  }
};

export const getMyOrders = async (req, res, next) => {
  const userId = req.userId;
  const filter =
    req.role === "seller" ? { sellerId: userId } : { buyerId: userId };
  try {
    const orders = await Order.find(filter)
      .populate("gigId", "title cover")
      .populate(req.role === "seller" ? "buyerId" : "sellerId", "username img")
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).send(orders);
  } catch (err) {
    next(err);
  }
};

// 4. Lấy chi tiết một Order
export const getOrderById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(createError(400, "Invalid Order ID."));
    }
    const order = await Order.findById(req.params.id)
      .populate("gigId", "title cover price")
      .populate("sellerId", "username img")
      .populate("buyerId", "username img");

    if (!order) return next(createError(404, "Order not found"));

    if (
      req.role !== "admin" &&
      order.buyerId._id.toString() !== req.userId &&
      order.sellerId._id.toString() !== req.userId
    ) {
      return next(createError(403, "Not authorized to view this order."));
    }
    res.status(200).send(order);
  } catch (err) {
    next(err);
  }
};

// 5. Cập nhật trạng thái Order (Đơn giản hóa)
export const updateOrderStatus = async (req, res, next) => {
  const orderId = req.params.id;
  const { status: newStatus } = req.body; // newStatus: 'delivered' hoặc 'completed'
  const currentUserId = req.userId;

  try {
    if (!mongoose.Types.ObjectId.isValid(orderId))
      return next(createError(400, "Invalid Order ID."));
    const order = await Order.findById(orderId);
    if (!order) return next(createError(404, "Order not found."));

    let canUpdate = false;
    const updates = { status: newStatus };

    if (
      newStatus === "delivered" &&
      order.sellerId._id.toString() === currentUserId &&
      order.status === "processing"
    ) {
      canUpdate = true;
    } else if (
      newStatus === "completed" &&
      order.buyerId._id.toString() === currentUserId &&
      order.status === "delivered"
    ) {
      canUpdate = true;
      updates.isCompleted = true;
      updates.completedAt = new Date();
    }

    if (!canUpdate) {
      return next(
        createError(
          403,
          `Cannot change status from '${order.status}' to '${newStatus}' or unauthorized.`
        )
      );
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    res.status(200).json(updatedOrder);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation Error",
        errors: Object.values(err.errors).map((e) => e.message),
      });
    }
    next(err);
  }
};

// Hàm kiểm tra và dọn dẹp các đơn hàng cũ
export const cleanupPendingOrders = async (req, res, next) => {
  try {
    // Tìm các đơn hàng pending_payment đã quá 1 giờ
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const pendingOrders = await Order.find({
      status: "pending_payment",
      createdAt: { $lt: oneHourAgo },
    });

    console.log(
      `Found ${pendingOrders.length} pending orders older than 1 hour`
    );

    // Kiểm tra với Stripe xem các đơn này đã thanh toán chưa
    const updatedOrders = [];
    const canceledOrders = [];

    for (const order of pendingOrders) {
      try {
        // Kiểm tra trạng thái thanh toán trên Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(
          order.payment_intent
        );

        if (paymentIntent.status === "succeeded") {
          // Nếu đã thanh toán thành công nhưng chưa cập nhật trong DB
          order.status = "processing";
          await order.save();
          updatedOrders.push(order._id);
        } else if (
          ["canceled", "requires_payment_method", "requires_capture"].includes(
            paymentIntent.status
          )
        ) {
          // Nếu đã bị hủy hoặc thất bại
          order.status = "payment_failed";
          await order.save();
          canceledOrders.push(order._id);
        }
      } catch (stripeErr) {
        console.error(
          `Error retrieving payment intent for order ${order._id}:`,
          stripeErr
        );
      }
    }

    res.status(200).json({
      message: "Cleanup completed",
      updatedOrders,
      canceledOrders,
      totalProcessed: updatedOrders.length + canceledOrders.length,
    });
  } catch (err) {
    console.error("Cleanup Error:", err);
    next(createError(500, "Failed to cleanup pending orders: " + err.message));
  }
};
