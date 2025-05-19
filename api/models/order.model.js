import mongoose from "mongoose";
const { Schema } = mongoose;

const OrderSchema = new Schema(
  {
    gigId: {
      type: Schema.Types.ObjectId,
      ref: "Gig",
      required: [true, "Gig ID for the order is required"],
    },
    img: {
      type: String,
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    payment_intent: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: [
        "pending_payment",
        "processing",
        "delivered",
        "completed",
        "cancelled",
        "payment_failed",
      ],
      default: "pending_payment",
      index: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Order", OrderSchema);
