import mongoose from "mongoose";
import Review from "../models/review.model.js";
import Gig from "../models/gig.model.js";
import dotenv from "dotenv";

dotenv.config();

// Connect to database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB for migration");
    runMigration()
      .then(() => {
        console.log("Migration completed successfully");
        process.exit(0);
      })
      .catch((err) => {
        console.error("Migration failed:", err);
        process.exit(1);
      });
  })
  .catch((err) => {
    console.error("Could not connect to MongoDB:", err);
    process.exit(1);
  });

// Migration function
async function runMigration() {
  console.log("Starting review migration...");

  // 1. Get all reviews that might have string IDs
  const reviews = await Review.find({});
  console.log(`Found ${reviews.length} reviews to check`);

  let fixedCount = 0;

  // 2. Iterate through each review
  for (const review of reviews) {
    let needsUpdate = false;
    const updates = {};

    // Check gigId format
    if (typeof review.gigId === "string") {
      try {
        updates.gigId = new mongoose.Types.ObjectId(review.gigId);
        needsUpdate = true;
        console.log(
          `Converting gigId from string to ObjectId for review ${review._id}`
        );
      } catch (err) {
        console.error(
          `Invalid gigId format for review ${review._id}: ${review.gigId}`
        );
      }
    }

    // Check userId format
    if (typeof review.userId === "string") {
      try {
        updates.userId = new mongoose.Types.ObjectId(review.userId);
        needsUpdate = true;
        console.log(
          `Converting userId from string to ObjectId for review ${review._id}`
        );
      } catch (err) {
        console.error(
          `Invalid userId format for review ${review._id}: ${review.userId}`
        );
      }
    }

    // Update if needed
    if (needsUpdate) {
      await Review.updateOne({ _id: review._id }, { $set: updates });
      fixedCount++;
    }
  }

  console.log(`Updated ${fixedCount} reviews`);

  // 3. Now sync all gigs' ratings
  const gigs = await Gig.find({});
  console.log(`Found ${gigs.length} gigs to sync ratings`);

  for (const gig of gigs) {
    const gigReviews = await Review.find({ gigId: gig._id });
    const starCount = gigReviews.length;
    const totalStars = gigReviews.reduce((sum, review) => sum + review.star, 0);

    await Gig.updateOne({ _id: gig._id }, { $set: { starCount, totalStars } });

    console.log(
      `Synced ratings for gig ${gig._id}: ${totalStars}/${starCount}`
    );
  }

  console.log("Migration completed successfully");
}
