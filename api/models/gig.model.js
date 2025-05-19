import mongoose from "mongoose";
const { Schema } = mongoose;

const GigSchema = new Schema(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Gig title is required"],
      trim: true,
    },
    desc: {
      type: String,
      required: [true, "Gig description is required"],
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category ID is required"],
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: [1, "Price must be at least 1"],
    },
    cover: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      required: false,
    },
    shortTitle: {
      type: String,
      required: true,
    },
    shortDesc: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryTime: {
      type: Number,
      required: true,
    },
    revisionNumber: {
      type: Number,
      required: true,
    },
    features: {
      type: [String],
      required: false,
    },
    tags: {
      type: [String],
      required: false,
    },
    totalStars: {
      type: Number,
      default: 0,
    },
    starCount: {
      type: Number,
      default: 0,
    },
    sales: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "paused", "pending_approval", "draft", "denied"],
      default: "draft",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

GigSchema.virtual("averageRating").get(function () {
  if (this.starCount === 0) return 0;
  return parseFloat((this.totalStars / this.starCount).toFixed(1));
});

export default mongoose.model("Gig", GigSchema);
