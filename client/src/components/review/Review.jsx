import React from "react";
import "./Review.scss";
import { FiStar, FiCheck } from "react-icons/fi";

const Review = ({ review }) => {
  // Check if userId is populated with user info
  const isUserPopulated =
    review.userId &&
    typeof review.userId === "object" &&
    review.userId.username;
  const userData = isUserPopulated ? review.userId : null;

  // Format date as "Month Day, Year"
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  // Calculate how long ago the review was posted
  const getTimeAgo = (dateString) => {
    const currentDate = new Date();
    const reviewDate = new Date(dateString);
    const diffInDays = Math.floor(
      (currentDate - reviewDate) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  return (
    <div className="review">
      {!userData ? (
        <div className="review-content">
          <div className="stars">
            {Array(5)
              .fill()
              .map((item, i) => (
                <FiStar key={i} className={i < review.star ? "filled" : ""} />
              ))}
            <span className="review-score">{review.star}</span>
            <span className="review-time">{getTimeAgo(review.createdAt)}</span>
          </div>
          <p className="review-date">{formatDate(review.createdAt)}</p>
          <p className="review-text">{review.desc}</p>
          <div className="user-unknown">User information unavailable</div>
        </div>
      ) : (
        <>
          <div className="user">
            <img
              className="profile-pic"
              src={userData.img || "/img/noavatar.jpg"}
              alt={userData.fullName || userData.username || "User"}
            />
            <div className="user-info">
              <span className="username">
                {userData.fullName || userData.username}
              </span>
              <div className="user-country">
                <span>{userData.country}</span>
                {userData.isVerified && (
                  <span className="verified-badge">
                    <FiCheck /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="review-content">
            <div className="stars">
              {Array(5)
                .fill()
                .map((item, i) => (
                  <FiStar key={i} className={i < review.star ? "filled" : ""} />
                ))}
              <span className="review-score">{review.star}</span>
              <span className="review-time">
                {getTimeAgo(review.createdAt)}
              </span>
            </div>
            <p className="review-date">{formatDate(review.createdAt)}</p>
            <p className="review-text">{review.desc}</p>
            <div className="helpful">
              <span>Was this review helpful?</span>
              <div className="buttons">
                <button>Yes</button>
                <button>No</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Review;
