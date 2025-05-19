import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import newRequest from "../../utils/newRequest";
import Review from "../review/Review";
import "./Reviews.scss";
import { FiStar, FiAlertTriangle } from "react-icons/fi";

const Reviews = ({ gigId }) => {
  const queryClient = useQueryClient();
  const [starRating, setStarRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user info from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    setCurrentUser(user);
  }, []);

  // Reset error message when rating changes
  useEffect(() => {
    if (errorMessage) setErrorMessage("");
  }, [starRating]);

  const { isLoading, error, data } = useQuery({
    queryKey: ["reviews", gigId],
    queryFn: () =>
      newRequest.get(`/reviews/${gigId}`).then((res) => {
        return res.data;
      }),
    refetchOnWindowFocus: false,
    onError: (err) => {
      console.error("Error fetching reviews:", err);
    },
  });

  // Calculate average rating from reviews data
  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const totalStars = reviews.reduce((sum, review) => sum + review.star, 0);
    return (totalStars / reviews.length).toFixed(1);
  };

  const averageRating = data ? calculateAverageRating(data) : 0;

  // Check if user has already reviewed this gig
  const hasUserReviewed =
    data && currentUser
      ? data.some(
          (review) =>
            review.userId &&
            (review.userId._id === currentUser._id ||
              (typeof review.userId === "string" &&
                review.userId === currentUser._id))
        )
      : false;

  const mutation = useMutation({
    mutationFn: (review) => {
      setIsSubmitting(true);
      setErrorMessage("");
      return newRequest.post("/reviews", review);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["reviews", gigId]);
      setIsSubmitting(false);
    },
    onError: (error) => {
      setIsSubmitting(false);
      // Extract the specific error message from the response
      let message = "Failed to submit review. Please try again.";

      if (error.response) {
        if (error.response.status === 403) {
          if (error.response.data.message) {
            message = error.response.data.message;
          } else if (currentUser?.role === "seller") {
            message = "Sellers can't post reviews.";
          } else {
            message = "You don't have permission to post this review.";
          }
        } else if (error.response.data && error.response.data.message) {
          message = error.response.data.message;
        }
      }

      setErrorMessage(message);
      console.error("Error submitting review:", error);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const desc = e.target[0].value;

    // Frontend validation
    if (!currentUser) {
      setErrorMessage("You must be logged in to post a review");
      return;
    }

    if (currentUser.role === "seller") {
      setErrorMessage("Sellers can't post reviews");
      return;
    }

    if (hasUserReviewed) {
      setErrorMessage("You have already reviewed this gig");
      return;
    }

    if (!starRating) {
      setErrorMessage("Please select a star rating");
      return;
    }

    if (!desc.trim()) {
      setErrorMessage("Please write a review comment");
      return;
    }

    mutation.mutate({ gigId, desc, star: starRating });
    e.target[0].value = "";
    setStarRating(0);
  };

  // Check if user should be able to leave a review
  const canReview =
    currentUser && currentUser.role !== "seller" && !hasUserReviewed;

  return (
    <div className="reviews">
      <h2>Reviews</h2>

      {isLoading ? (
        <div className="reviews-loading">Loading reviews...</div>
      ) : error ? (
        <div className="reviews-error">
          Something went wrong while loading reviews. Please try refreshing the
          page.
        </div>
      ) : (
        <>
          {/* Reviews Summary */}
          {data && data.length > 0 && (
            <div className="reviews-summary">
              <div className="rating-avg">
                <div className="avg-value">{averageRating}</div>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      className={`star ${
                        star <= averageRating ? "filled" : ""
                      }`}
                    />
                  ))}
                </div>
                <span className="reviews-count">({data.length} reviews)</span>
              </div>
            </div>
          )}

          {/* Reviews List */}
          {!data || data.length === 0 ? (
            <div className="no-reviews">
              No reviews yet. Be the first to leave a review!
            </div>
          ) : (
            <div className="reviews-list">
              {data.map((review) => (
                <Review key={review._id} review={review} />
              ))}
            </div>
          )}
        </>
      )}

      {!currentUser ? (
        <div className="login-to-review">
          <FiAlertTriangle className="icon" />
          <p>Please log in to leave a review</p>
        </div>
      ) : hasUserReviewed ? (
        <div className="already-reviewed">
          <p>You have already reviewed this gig</p>
        </div>
      ) : (
        <div className="add">
          <h2>Add a review</h2>
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          <form className="addForm" onSubmit={handleSubmit}>
            <textarea
              placeholder="Write your opinion..."
              disabled={isSubmitting || !canReview}
            />
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${
                    (hoverRating || starRating) >= star ? "filled" : ""
                  } ${!canReview ? "disabled" : ""}`}
                  onClick={() => canReview && setStarRating(star)}
                  onMouseEnter={() => canReview && setHoverRating(star)}
                  onMouseLeave={() => canReview && setHoverRating(0)}
                >
                  ★
                </span>
              ))}
            </div>
            <button disabled={isSubmitting || starRating === 0 || !canReview}>
              {isSubmitting ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Reviews;
