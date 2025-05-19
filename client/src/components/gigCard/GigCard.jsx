import React, { useState, useEffect } from "react";
import "./GigCard.scss";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import newRequest from "../../utils/newRequest";

const GigCard = ({ item }) => {
  const [favorite, setFavorite] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  // Prepare images array with cover as first image and any additional images
  const images =
    item.images?.length > 0 ? [item.cover, ...item.images] : [item.cover];

  // Extract sellerId correctly, handling both string and object cases
  const sellerId =
    typeof item.sellerId === "object" ? item.sellerId._id : item.sellerId;

  const {
    isLoading,
    error,
    data: seller,
  } = useQuery({
    queryKey: [`user-${sellerId}`],
    queryFn: () => {
      if (!sellerId) return null;
      return newRequest.get(`/users/${sellerId}`).then((res) => res.data);
    },
    enabled: !!sellerId,
  });

  // Calculate rating from totalStars and starCount
  const rating =
    item.starCount > 0 ? (item.totalStars / item.starCount).toFixed(1) : "New";

  // Auto rotate images every 3 seconds
  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [images.length]);

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorite(!favorite);
  };

  return (
    <Link to={`/gig/${item._id}`} className="link">
      <div className="gigCard">
        <div className="image-container">
          <img
            src={images[currentImage]}
            alt={item.title}
            className="cover-image"
          />

          <button
            className={`favorite-button ${favorite ? "active" : ""}`}
            onClick={toggleFavorite}
          >
            <i className={`fa${favorite ? "s" : "r"} fa-heart`}></i>
          </button>

          {images.length > 1 && (
            <div className="carousel-navigation">
              <div className="dots">
                {images.map((_, index) => (
                  <span
                    key={index}
                    className={`dot ${currentImage === index ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImage(index);
                    }}
                  ></span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card-content">
          <div className="seller-info">
            {isLoading ? (
              <div className="skeleton-loader"></div>
            ) : error ? (
              <span className="error-message">Error loading seller</span>
            ) : seller ? (
              <>
                <div className="seller-profile">
                  <img
                    src={seller.img || "/img/noavatar.jpg"}
                    alt={seller.fullName || seller.username}
                    className="seller-avatar"
                  />
                  <div className="seller-details">
                    <span className="ad-by">Ad by</span>
                    <span className="seller-name">
                      {seller.fullName || seller.username}
                    </span>
                  </div>
                </div>
                {/* {item.sales > 100 && ( */}
                <div className="seller-badge">
                  Top Rated <span>♦♦♦</span>
                </div>
                {/* )} */}
              </>
            ) : (
              <div className="seller-profile">
                <img
                  src="/img/noavatar.jpg"
                  alt="Seller"
                  className="seller-avatar"
                />
                <div className="seller-details">
                  <span className="ad-by">Ad by</span>
                  <span className="seller-name">Seller</span>
                </div>
              </div>
            )}
          </div>

          <h3 className="gig-title">{item.shortTitle || item.title}</h3>

          <div className="gig-rating">
            <i className="fas fa-star"></i>
            <span className="rating-value">{rating}</span>
            <span className="review-count">
              (
              {item.starCount > 1000
                ? `${Math.floor(item.starCount / 1000)}k+`
                : item.starCount || 0}
              )
            </span>
          </div>

          <div className="gig-price">
            <span className="price-from">From</span>
            <span className="price-value">US${item.price}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GigCard;
