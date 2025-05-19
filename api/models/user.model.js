import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please use a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
    },
    role: {
      type: String,
      enum: ["buyer", "admin", "seller"],
      default: "buyer",
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    img: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
    },
    phone: {
      type: String,
      required: false,
      trim: true,
    },
    desc: {
      type: String,
      required: false,
    },
    skills: {
      type: [
        {
          type: String,
          trim: true,
          lowercase: true,
        },
      ],
      default: [],
      index: true,
    },
    stripeCustomerId: {
      type: String,
      select: false,
    },
    stripeAccountId: {
      type: String,
      select: false,
    },
    stripeAccountStatus: {
      type: String,
      enum: [
        "incomplete",
        "pending",
        "verified",
        "restricted",
        "disabled",
        "action_required",
      ],
      default: "incomplete",
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

export default mongoose.model("User", userSchema);
