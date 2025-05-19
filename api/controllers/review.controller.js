import createError from "../utils/createError.js";
import Review from "../models/review.model.js";
import Gig from "../models/gig.model.js";
import mongoose from "mongoose";

export const createReview = async (req, res, next) => {
  try {
    // Check if user is a seller
    if (req.role === "seller") {
      return next(createError(403, "Sellers can't create a review!"));
    }

    // Validate gigId is a valid ObjectId
    if (!req.body.gigId || !mongoose.Types.ObjectId.isValid(req.body.gigId)) {
      return next(createError(400, "Invalid or missing gig ID"));
    }

    // Validate star rating
    const star = parseInt(req.body.star);
    if (isNaN(star) || star < 1 || star > 5) {
      return next(createError(400, "Star rating must be between 1 and 5"));
    }

    // Validate description
    if (!req.body.desc || !req.body.desc.trim()) {
      return next(createError(400, "Review description is required"));
    }

    // Convert to ObjectId
    const gigId = new mongoose.Types.ObjectId(req.body.gigId);
    const userId = new mongoose.Types.ObjectId(req.userId);

    // Check if the gig exists
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return next(createError(404, "Gig not found"));
    }

    // Prevent reviewing own gig
    if (gig.sellerId.toString() === userId.toString()) {
      return next(createError(403, "You cannot review your own gig"));
    }

    // Check if user already reviewed this gig
    const existingReview = await Review.findOne({
      gigId,
      userId,
    });

    if (existingReview) {
      return next(
        createError(403, "You have already created a review for this gig!")
      );
    }

    //TODO: check if the user purchased the gig.

    const newReview = new Review({
      userId,
      gigId,
      desc: req.body.desc,
      star,
    });

    const savedReview = await newReview.save();

    // Update gig rating
    await Gig.findByIdAndUpdate(gigId, {
      $inc: { totalStars: star, starCount: 1 },
    });

    // Return review with user info
    const reviewWithUser = await Review.findById(savedReview._id).populate({
      path: "userId",
      select: "username img country fullName isVerified",
    });

    res.status(201).send(reviewWithUser);
  } catch (err) {
    console.error("Error creating review:", err);
    next(err);
  }
};

export const getReviews = async (req, res, next) => {
  try {
    // Validate and convert gigId
    if (!mongoose.Types.ObjectId.isValid(req.params.gigId)) {
      return next(createError(400, "Invalid gig ID format"));
    }

    const gigId = new mongoose.Types.ObjectId(req.params.gigId);

    const reviews = await Review.find({ gigId })
      .sort({ createdAt: -1 })
      .populate({
        path: "userId",
        select: "username img country fullName isVerified",
      });

    res.status(200).send(reviews);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    next(err);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(createError(400, "Invalid review ID format"));
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(createError(404, "Review not found"));
    }

    if (review.userId.toString() !== req.userId && !req.isAdmin) {
      return next(createError(403, "You can only delete your own review"));
    }

    // Update gig rating when deleting a review
    await Gig.findByIdAndUpdate(review.gigId, {
      $inc: { totalStars: -review.star, starCount: -1 },
    });

    await Review.findByIdAndDelete(req.params.id);

    res.status(200).send("Review has been deleted");
  } catch (err) {
    next(err);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    // Validate reviewId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(createError(400, "Invalid review ID format"));
    }

    // Validate star rating
    const newStarValue = parseInt(req.body.star);
    if (isNaN(newStarValue) || newStarValue < 1 || newStarValue > 5) {
      return next(createError(400, "Star rating must be between 1 and 5"));
    }

    const reviewId = new mongoose.Types.ObjectId(req.params.id);
    const userId = new mongoose.Types.ObjectId(req.userId);

    // Find existing review
    const existingReview = await Review.findById(reviewId);

    if (!existingReview) {
      return next(createError(404, "Review not found"));
    }

    // Check if user owns this review
    if (
      existingReview.userId.toString() !== userId.toString() &&
      !req.isAdmin
    ) {
      return next(createError(403, "You can only update your own review"));
    }

    // Calculate change in star rating
    const oldStarValue = existingReview.star;
    const starDifference = newStarValue - oldStarValue;

    // Update the review
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      {
        $set: {
          star: newStarValue,
          desc: req.body.desc,
        },
      },
      { new: true }
    ).populate({
      path: "userId",
      select: "username img country fullName isVerified",
    });

    // Update gig totalStars to reflect the change
    await Gig.findByIdAndUpdate(existingReview.gigId, {
      $inc: { totalStars: starDifference },
    });

    res.status(200).send(updatedReview);
  } catch (err) {
    next(err);
  }
};

// New endpoint to sync totalStars and starCount with actual reviews
export const syncGigRatings = async (req, res, next) => {
  try {
    if (!req.isAdmin) {
      return next(createError(403, "Only admins can perform this action"));
    }

    const gigId = req.params.gigId;

    // If a specific gig ID is provided, sync only that gig
    if (gigId) {
      if (!mongoose.Types.ObjectId.isValid(gigId)) {
        return next(createError(400, "Invalid gig ID format"));
      }

      await syncSingleGigRating(new mongoose.Types.ObjectId(gigId));
      return res.status(200).send("Gig rating synced successfully");
    }

    // Sync all gigs (could be resource intensive)
    const gigs = await Gig.find({});

    for (const gig of gigs) {
      await syncSingleGigRating(gig._id);
    }

    res.status(200).send("All gig ratings synced successfully");
  } catch (err) {
    next(err);
  }
};

// Helper function to sync a single gig's rating
async function syncSingleGigRating(gigId) {
  // Get all reviews for this gig
  const reviews = await Review.find({ gigId });

  // Calculate actual values
  const starCount = reviews.length;
  const totalStars = reviews.reduce((sum, review) => sum + review.star, 0);

  // Update the gig
  await Gig.findByIdAndUpdate(gigId, {
    starCount,
    totalStars,
  });
}
