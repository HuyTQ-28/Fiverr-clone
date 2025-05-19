import Gig from "../models/gig.model.js";
import createError from "../utils/createError.js";
import Category from "../models/category.model.js";
import mongoose from "mongoose";

export const createGig = async (req, res, next) => {
  if (req.role !== "seller" && req.role !== "admin") {
    return next(createError(403, "Only sellers can create a Gig."));
  }

  const {
    title,
    desc,
    categoryId,
    price,
    cover,
    images,
    shortTitle,
    shortDesc,
    deliveryTime,
    revisionNumber,
    features,
    tags,
  } = req.body;

  // Kiểm tra các trường bắt buộc cơ bản
  if (
    !title ||
    !desc ||
    !categoryId ||
    !price ||
    !cover ||
    !deliveryTime ||
    revisionNumber === undefined ||
    !shortTitle ||
    !shortDesc
  ) {
    return next(
      createError(
        400,
        "Please provide all required fields: title, description, category, price, cover image, delivery time, revision number, short title, and short description."
      )
    );
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return next(createError(400, "Invalid Category ID format."));
    }
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return next(createError(404, "Category not found."));
    }

    const newGig = new Gig({
      sellerId: req.userId,
      title,
      desc,
      categoryId,
      price,
      cover,
      images,
      shortTitle,
      shortDesc,
      deliveryTime,
      revisionNumber,
      features,
      tags,
    });

    const savedGig = await newGig.save();

    res.status(201).json(savedGig);
  } catch (error) {
    if (error.name === "ValidationError") {
      return next(createError(400, error.message));
    }
    next(error);
  }
};

// Get a single gig
export const getGig = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(createError(400, "Invalid gig ID format"));
    }

    const gig = await Gig.findById(req.params.id)
      .populate("sellerId", "username fullName img country createdAt")
      .populate("categoryId", "name slug");

    if (!gig) {
      return next(createError(404, "Gig not found"));
    }

    // Calculate average orders per month since created
    const creationDate = new Date(gig.createdAt);
    const now = new Date();
    const monthsDiff =
      (now.getFullYear() - creationDate.getFullYear()) * 12 +
      (now.getMonth() - creationDate.getMonth());
    const ordersPerMonth =
      monthsDiff > 0 ? Math.round(gig.sales / monthsDiff) : gig.sales;

    // Add packages pricing if not available
    const packages = {
      basic: {
        title: gig.shortTitle || "Basic Package",
        price: gig.price,
        deliveryTime: gig.deliveryTime,
        revisionNumber: gig.revisionNumber,
        features: gig.features || [],
      },
      standard: {
        title: "Standard Package",
        price: Math.round(gig.price * 1.5),
        deliveryTime: Math.max(1, gig.deliveryTime - 1),
        revisionNumber: gig.revisionNumber + 1,
        features: gig.features
          ? [...gig.features, "Priority support"]
          : ["Priority support"],
      },
      premium: {
        title: "Premium Package",
        price: gig.price * 2,
        deliveryTime: Math.max(1, gig.deliveryTime - 2),
        revisionNumber: gig.revisionNumber + 2,
        features: gig.features
          ? [
              ...gig.features,
              "Priority support",
              "Premium revisions",
              "Extended support",
            ]
          : ["Priority support", "Premium revisions", "Extended support"],
      },
    };

    // Add additional context data
    const responseData = {
      ...gig.toObject(),
      packages: packages,
      sellerStats: {
        ordersPerMonth: ordersPerMonth,
        responseTime: "1-3 hours",
        languages: ["English", "Spanish"],
        lastActive: "Recently",
      },
    };

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

// Get gigs with filters
export const getGigs = async (req, res, next) => {
  try {
    const {
      sellerId,
      categoryId,
      minPrice,
      maxPrice,
      search,
      sort = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter object
    const filters = {
      status: "active",
    };

    if (sellerId) filters.sellerId = sellerId;
    if (categoryId) filters.categoryId = categoryId;

    // Price range
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = parseInt(minPrice);
      if (maxPrice) filters.price.$lte = parseInt(maxPrice);
    }

    if (search && String(search).trim()) {
      const searchRegex = new RegExp(
        String(search)
          .trim()
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      filters.$or = [
        { title: { $regex: searchRegex } },
        { desc: { $regex: searchRegex } },
        { shortTitle: { $regex: searchRegex } },
        { shortDesc: { $regex: searchRegex } },
        { tags: { $elemMatch: { $regex: searchRegex } } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sort] = order === "asc" ? 1 : -1;

    // Execute query with pagination
    const gigs = await Gig.find(filters)
      .populate("sellerId", "username fullName img")
      .populate("categoryId", "name slug")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Gig.countDocuments(filters);

    res.status(200).json({
      gigs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update a gig
export const updateGig = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(createError(400, "Invalid gig ID format"));
    }

    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return next(createError(404, "Gig not found"));
    }

    if (gig.sellerId.toString() !== req.userId) {
      return next(createError(403, "You can only update your own gigs"));
    }

    const allowedUpdates = [
      "title",
      "desc",
      "categoryId",
      "price",
      "cover",
      "images",
      "shortTitle",
      "shortDesc",
      "deliveryTime",
      "revisionNumber",
      "features",
      "tags",
    ];
    const updates = {};
    let hasUpdates = false;

    for (const key of allowedUpdates) {
      if (req.body.hasOwnProperty(key)) {
        if (key === "categoryId" && req.body.categoryId) {
          if (!mongoose.Types.ObjectId.isValid(req.body.categoryId)) {
            return next(
              createError(400, "Invalid Category ID format for update.")
            );
          }
          const categoryExists = await Category.findById(req.body.categoryId);
          if (!categoryExists)
            return next(
              createError(
                404,
                `Category with ID ${req.body.categoryId} for update not found.`
              )
            );
        }
        updates[key] = req.body[key];
        hasUpdates = true;
      }
    }

    if (!hasUpdates) {
      return res.status(200).json({
        message: "No valid fields provided for update.",
        gig: await Gig.findById(req.params.id)
          .populate("sellerId", "username fullName img")
          .populate("categoryId", "name slug"),
      });
    }

    const updatedGig = await Gig.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("sellerId", "username fullName img")
      .populate("categoryId", "name slug");

    res.status(200).json(updatedGig);
  } catch (error) {
    if (error.name === "ValidationError") {
      return next(createError(400, error.message));
    }
    next(error);
  }
};

// Delete a gig
export const deleteGig = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(createError(400, "Invalid gig ID format"));
    }

    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return next(createError(404, "Gig not found"));
    }

    // Check ownership
    if (gig.sellerId.toString() !== req.userId && req.role !== "admin") {
      return next(
        createError(
          403,
          "Forbidden: You can only delete your own gigs or you are not an admin."
        )
      );
    }

    await Gig.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Gig deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Get seller gigs
export const getSellerGigs = async (req, res, next) => {
  try {
    if (req.role !== "seller" && req.role !== "admin") {
      return next(
        createError(403, "Forbidden: Only sellers can view their gigs.")
      );
    }

    const {
      status,
      sort = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const filters = { sellerId: req.userId };
    if (
      status &&
      ["active", "paused", "pending_approval", "draft", "denied"].includes(
        status
      )
    ) {
      filters.status = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum > 0 ? pageNum - 1 : 0) * limitNum;

    const sortOptions = {};

    const allowedSortFields = [
      "createdAt",
      "price",
      "sales",
      "status",
      "title",
    ];
    if (allowedSortFields.includes(sort)) {
      sortOptions[sort] = order === "asc" ? 1 : -1;
    } else {
      sortOptions["createdAt"] = -1;
    }

    const gigs = await Gig.find(filters)
      .populate("categoryId", "name")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Gig.countDocuments(filters);

    res.status(200).json({
      gigs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Change gig status for seller
export const changeGigStatus = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(createError(400, "Invalid gig ID format"));
    }

    const { status } = req.body;

    const allowedSellerStatus = ["active", "paused", "draft"];
    if (!status || !allowedSellerStatus.includes(status)) {
      return next(
        createError(
          400,
          `Invalid status value. Allowed values are: ${allowedSellerStatus.join(
            ", "
          )}`
        )
      );
    }

    const gig = await Gig.findById(req.params.id);
    if (!gig) return next(createError(404, "Gig not found"));

    if (gig.sellerId.toString() !== req.userId) {
      return next(
        createError(
          403,
          "Forbidden: You can only update the status of your own gigs"
        )
      );
    }

    if (
      (gig.status === "pending_approval" || gig.status === "denied") &&
      status === "active"
    ) {
      return next(
        createError(
          403,
          "Cannot activate a gig that is pending approval or has been denied."
        )
      );
    }

    gig.status = status;
    await gig.save({ validateBeforeSave: true });

    res.status(200).json(gig);
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ message: "Validation Error", errors: messages });
    }
    next(error);
  }
};

// Admin change gig status
export const adminChangeGigStatus = async (req, res, next) => {
  try {
    if (req.role !== "admin") {
      return next(
        createError(403, "Forbidden: Only admins can perform this action")
      );
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(createError(400, "Invalid gig ID format"));
    }

    const { status } = req.body;

    // Admins can set any status
    const allowedAdminStatus = [
      "active",
      "paused",
      "pending_approval",
      "draft",
      "denied",
    ];
    if (!status || !allowedAdminStatus.includes(status)) {
      return next(
        createError(
          400,
          `Invalid status value. Allowed values are: ${allowedAdminStatus.join(
            ", "
          )}`
        )
      );
    }

    const gig = await Gig.findById(req.params.id);
    if (!gig) return next(createError(404, "Gig not found"));

    // Optional: Add admin notes/reason, especially for denied status
    if (status === "denied" && req.body.adminNote) {
      gig.adminNote = req.body.adminNote;
    }

    gig.status = status;
    await gig.save({ validateBeforeSave: true });

    res.status(200).json({
      gig,
      message: `Gig status successfully changed to ${status}`,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ message: "Validation Error", errors: messages });
    }
    next(error);
  }
};
