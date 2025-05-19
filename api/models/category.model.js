import mongoose from "mongoose";
const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Category slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imgUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Category", categorySchema);
