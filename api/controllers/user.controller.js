import User from "../models/user.model.js";
import createError from "../utils/createError.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return next(createError(404, "User not found!"));
    if (req.userId !== user._id.toString() && req.role !== "admin") {
      return next(
        createError(
          403,
          "Forbidden: You can only delete your own account or you are not an admin."
        )
      );
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).send("User has been deleted.");
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    // Validate userId parameter
    if (!req.params.id) {
      return next(createError(400, "User ID is required"));
    }

    // Handle various potential ID formats
    let userId;
    try {
      // Try to convert to ObjectId if it's not already one
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(createError(400, "Invalid user ID format"));
      }
      userId = new mongoose.Types.ObjectId(req.params.id);
    } catch (err) {
      return next(createError(400, "Invalid user ID format"));
    }

    const user = await User.findById(userId).select("-password -__v");

    if (!user) {
      return next(createError(404, "User not found!"));
    }

    res.status(200).send(user);
  } catch (error) {
    console.error("Error in getUser:", error);
    next(error);
  }
};

export const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id || req.userId;

    if (req.userId !== userId && req.role !== "admin") {
      return next(createError(403, "You can only update your own profile"));
    }

    const allowedUpdates = [
      "fullName",
      "img",
      "country",
      "phone",
      "desc",
      "skills",
    ];

    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return next(createError(400, "No valid fields to update"));
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select(
      "-password -__v -passwordResetToken -passwordResetExpires -stripeCustomerId -stripeAccountId -stripeAccountStatus"
    );

    if (!updatedUser) {
      return next(createError(404, "User not found"));
    }

    res.status(200).send(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const becomeSeller = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { skills } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    if (user.role !== "buyer") {
      return next(
        createError(
          400,
          `Users with role '${user.role}' cannot become a seller through this process.`
        )
      );
    }

    if (
      !skills ||
      !Array.isArray(skills) ||
      skills.some((skill) => typeof skill !== "string" || skill.trim() === "")
    ) {
      return next(
        createError(
          400,
          "Skills are required and must be a non-empty array of strings."
        )
      );
    }

    // Update user role to seller
    user.role = "seller";
    const uniqueSkills = [
      ...new Set(
        skills
          .map((skill) => skill.trim().toLowerCase())
          .filter((skill) => skill)
      ),
    ];
    user.skills = uniqueSkills;

    const updatedUser = await user.save();

    const {
      password,
      passwordResetToken,
      passwordResetExpires,
      stripeCustomerId,
      stripeAccountId,
      stripeAccountStatus,
      __v,
      ...userInfo
    } = updatedUser.toObject();

    res.status(200).json({
      message: "Congratulations! You are now a seller.",
      user: userInfo,
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to become a seller."));
  }
};

export const changePassword = async (req, res, next) => {
  const userId = req.userId;
  const { oldPassword, newPassword, confirmNewPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmNewPassword) {
    return next(
      createError(
        400,
        "All fields are required: old password, new password, and confirm new password."
      )
    );
  }

  if (newPassword !== confirmNewPassword) {
    return next(
      createError(400, "New password and confirm new password do not match.")
    );
  }

  if (newPassword.length < 8) {
    return next(
      createError(400, "New password must be at least 8 characters long.")
    );
  }

  if (oldPassword === newPassword) {
    return next(
      createError(400, "New password must be different from the old password.")
    );
  }

  try {
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return next(createError(404, "User not found."));
    }

    const isOldPasswordCorrect = await bcrypt.compare(
      oldPassword,
      user.password
    );
    if (!isOldPasswordCorrect) {
      return next(createError(401, "Old password is incorrect."));
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      message: "Password updated successfully.",
    });
  } catch (error) {
    next(createError(500, "Failed to change password."));
  }
};
