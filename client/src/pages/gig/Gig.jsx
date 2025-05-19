import React, { useState, useEffect } from "react";
import "./Gig.scss";
import { Slider } from "infinite-react-carousel/lib";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import newRequest from "../../utils/newRequest";
import Reviews from "../../components/reviews/Reviews";
import LoadingSpinner from "../../components/loadingSpinner/LoadingSpinner";
import {
  FiClock,
  FiRefreshCw,
  FiCheck,
  FiHeart,
  FiShare2,
  FiChevronDown,
  FiStar,
  FiHome,
} from "react-icons/fi";

function Gig() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("description");
  const [showFaq, setShowFaq] = useState({});
  const [selectedPackage, setSelectedPackage] = useState("basic");

  const {
    isLoading,
    error,
    data: gig,
  } = useQuery({
    queryKey: ["gig", id],
    queryFn: () =>
      // Try with 'single' endpoint first as fallback
      newRequest
        .get(`/gigs/${id}`)
        .catch((err) => {
          if (err.response?.status === 404) {
            return newRequest.get(`/gigs/single/${id}`);
          }
          throw err;
        })
        .then((res) => res.data),
  });

  // Fetch reviews for this gig
  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => newRequest.get(`/reviews/${id}`).then((res) => res.data),
    enabled: !!id,
  });

  // Calculate rating properly from actual reviews
  const calculateAverageRating = (reviewsData) => {
    if (!reviewsData || reviewsData.length === 0) return 0;
    const totalStars = reviewsData.reduce(
      (sum, review) => sum + review.star,
      0
    );
    return (totalStars / reviewsData.length).toFixed(1);
  };

  // Use the reviews data for accurate rating
  const rating = reviews ? calculateAverageRating(reviews) : 0;
  const reviewsCount = reviews ? reviews.length : 0;

  // Extract seller ID correctly
  const sellerId =
    gig && (typeof gig.sellerId === "object" ? gig.sellerId._id : gig.sellerId);

  const {
    data: seller,
    isLoading: isLoadingSeller,
    error: errorSeller,
  } = useQuery({
    queryKey: ["seller", sellerId],
    queryFn: () => {
      if (!sellerId) return null;
      return newRequest.get(`/users/${sellerId}`).then((res) => res.data);
    },
    enabled: !!sellerId,
  });

  // Get package details based on selection
  const getCurrentPackage = () => {
    if (gig?.packages) {
      return gig.packages[selectedPackage];
    }

    // Fallback to old format if packages not available
    return {
      title:
        selectedPackage === "basic"
          ? gig?.shortTitle || "Basic Package"
          : selectedPackage === "standard"
          ? "Standard Package"
          : "Premium Package",
      price:
        selectedPackage === "basic"
          ? gig?.price
          : selectedPackage === "standard"
          ? Math.round(gig?.price * 1.5)
          : gig?.price * 2,
      deliveryTime:
        selectedPackage === "basic"
          ? gig?.deliveryTime
          : selectedPackage === "standard"
          ? Math.max(1, gig?.deliveryTime - 1)
          : Math.max(1, gig?.deliveryTime - 2),
      revisionNumber:
        selectedPackage === "basic"
          ? gig?.revisionNumber
          : selectedPackage === "standard"
          ? gig?.revisionNumber + 1
          : gig?.revisionNumber + 2,
      features: gig?.features || [],
    };
  };

  // Fake FAQs (would be replaced with real data from API)
  const faqs = [
    {
      question: "What information do you need to get started?",
      answer:
        "Please provide details about your project requirements, timeline, and any specific instructions or references you'd like me to follow.",
    },
    {
      question: "How many revisions are included?",
      answer: `${
        getCurrentPackage().revisionNumber
      } revisions are included with this package. Additional revisions can be purchased if needed.`,
    },
    {
      question: "What's your typical turnaround time?",
      answer: `I typically deliver within ${
        getCurrentPackage().deliveryTime
      } days, but this can vary depending on project complexity and my current workload.`,
    },
  ];

  // Toggle FAQ
  const toggleFaq = (index) => {
    setShowFaq({ ...showFaq, [index]: !showFaq[index] });
  };

  // Handle package selection
  const handlePackageSelect = (packageName) => {
    setSelectedPackage(packageName);
  };

  // handle continue to checkout
  const handleContinue = () => {
    navigate(`/pay/${id}?package=${selectedPackage}`);
  };

  // Format date - e.g., "Joined Mar 2022"
  const formatJoinDate = (dateString) => {
    if (!dateString) return "Joined recently";
    const date = new Date(dateString);
    return `Joined ${date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    })}`;
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isLoading)
    return (
      <div className="loading-container">
        <LoadingSpinner size="large" text="Loading gig details..." />
      </div>
    );

  if (error)
    return (
      <div className="error-container">
        <h2>Error loading gig</h2>
        <p>Something went wrong. Please try again later.</p>
        {error.response?.status === 404 && (
          <p className="error-detail">
            The gig you are looking for was not found. It may have been removed
            or doesn't exist.
          </p>
        )}
      </div>
    );

  // Extract category info safely
  const categoryId = gig.categoryId
    ? typeof gig.categoryId === "object"
      ? gig.categoryId._id
      : gig.categoryId
    : null;
  const categoryName =
    gig.categoryId && typeof gig.categoryId === "object"
      ? gig.categoryId.name
      : "Category";

  // Get current package details
  const currentPackage = getCurrentPackage();

  // Get seller response time from API or use default
  const responseTime = gig?.sellerStats?.responseTime || "4 hours";

  // Random orders in queue number if not provided by API
  const ordersInQueue =
    gig?.sellerStats?.ordersInQueue || Math.floor(Math.random() * 10) + 1;

  return (
    <div className="gig">
      <div className="container">
        <div className="left">
          <div className="breadcrumbs">
            <Link to="/" className="home-link">
              <FiHome />
            </Link>{" "}
            &gt;
            {categoryId && (
              <>
                <Link to={`/gigs?categoryId=${categoryId}`}>
                  {categoryName}
                </Link>{" "}
                &gt;
              </>
            )}
            <span>{gig.title.substring(0, 30)}...</span>
          </div>

          <h1>{gig.title}</h1>

          <div className="gig-overview">
            {isLoadingSeller ? (
              <div className="seller-skeleton">Loading seller info...</div>
            ) : errorSeller ? (
              <div className="seller-error">
                Error loading seller information
              </div>
            ) : seller || (gig.sellerId && typeof gig.sellerId === "object") ? (
              <div className="seller-snippet">
                <img
                  className="avatar"
                  src={(seller || gig.sellerId).img || "/img/noavatar.jpg"}
                  alt={(seller || gig.sellerId).username || "Seller"}
                />
                <div className="seller-info">
                  <h4>
                    {(seller || gig.sellerId).fullName ||
                      (seller || gig.sellerId).username}
                  </h4>
                  <p className="seller-level">Seller</p>
                </div>
              </div>
            ) : (
              <div className="seller-snippet">
                <img className="avatar" src="/img/noavatar.jpg" alt="Seller" />
                <div className="seller-info">
                  <h4>Seller</h4>
                </div>
              </div>
            )}

            <div className="gig-stats">
              {rating > 0 && (
                <div className="rating">
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar
                        key={star}
                        className={`star ${star <= rating ? "filled" : ""}`}
                      />
                    ))}
                    <span className="score">{rating}</span>
                  </div>
                  <span className="reviews-count">({reviewsCount})</span>
                </div>
              )}
              <div className="orders-in-queue">
                <span>{ordersInQueue} Orders in Queue</span>
              </div>
            </div>
          </div>

          <div className="slider-container">
            <Slider slidesToShow={1} arrowsScroll={1} className="slider">
              <img src={gig.cover} alt={gig.title} className="main-image" />
              {gig.images?.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`${gig.title} - image ${index + 1}`}
                />
              ))}
            </Slider>
          </div>

          <div className="gig-nav">
            <div className="nav-tabs">
              <button
                className={activeTab === "description" ? "active" : ""}
                onClick={() => setActiveTab("description")}
              >
                Overview
              </button>
              <button
                className={activeTab === "about" ? "active" : ""}
                onClick={() => setActiveTab("about")}
              >
                About the Seller
              </button>
              <button
                className={activeTab === "reviews" ? "active" : ""}
                onClick={() => setActiveTab("reviews")}
              >
                Reviews
              </button>
              <button
                className={activeTab === "faq" ? "active" : ""}
                onClick={() => setActiveTab("faq")}
              >
                FAQ
              </button>
            </div>
          </div>

          {activeTab === "description" && (
            <div className="details-section">
              <h2>About This Gig</h2>
              <p className="description">{gig.desc}</p>

              {gig.tags && gig.tags.length > 0 && (
                <div className="tags">
                  {gig.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "about" &&
            (isLoadingSeller ? (
              <div className="seller-skeleton">Loading seller details...</div>
            ) : errorSeller ? (
              <div className="seller-error">Error loading seller details</div>
            ) : seller || (gig.sellerId && typeof gig.sellerId === "object") ? (
              <div className="seller-section">
                <h2>About The Seller</h2>
                <div className="seller-profile">
                  <div className="seller-header">
                    <img
                      src={(seller || gig.sellerId).img || "/img/noavatar.jpg"}
                      alt={(seller || gig.sellerId).username || "Seller"}
                    />
                    <div className="seller-intro">
                      <h3>
                        {(seller || gig.sellerId).fullName ||
                          (seller || gig.sellerId).username}
                      </h3>
                      <p className="seller-title">
                        Professional {categoryName} Expert
                      </p>
                      {rating > 0 && (
                        <div className="rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FiStar
                              key={star}
                              className={`star ${
                                star <= rating ? "filled" : ""
                              }`}
                            />
                          ))}
                          <span className="score">{rating}</span>
                        </div>
                      )}
                      <button className="contact-button">Contact Me</button>
                    </div>
                  </div>

                  <div className="seller-stats">
                    <div className="stat">
                      <span className="label">From</span>
                      <span className="value">
                        {(seller || gig.sellerId).country || "Unknown"}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="label">Member since</span>
                      <span className="value">
                        {formatJoinDate((seller || gig.sellerId).createdAt)}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="label">Avg. response time</span>
                      <span className="value">{responseTime}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Languages</span>
                      <span className="value">
                        {gig?.sellerStats?.languages?.join(", ") || "English"}
                      </span>
                    </div>
                  </div>

                  <div className="seller-description">
                    <p>
                      {(seller || gig.sellerId).desc ||
                        "This seller has not added a description yet."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="seller-section placeholder">
                <h2>About The Seller</h2>
                <p>Seller information unavailable</p>
              </div>
            ))}

          {activeTab === "reviews" && <Reviews gigId={id} />}

          {activeTab === "faq" && (
            <div className="faq-section">
              <h2>Frequently Asked Questions</h2>
              <div className="faq-list">
                {faqs.map((faq, index) => (
                  <div key={index} className="faq-item">
                    <div
                      className="faq-question"
                      onClick={() => toggleFaq(index)}
                    >
                      <h3>{faq.question}</h3>
                      <FiChevronDown
                        className={showFaq[index] ? "rotate" : ""}
                      />
                    </div>
                    {showFaq[index] && (
                      <div className="faq-answer">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="right">
          <div className="gig-package">
            <div className="action-buttons">
              <button className="save-button">
                <FiHeart /> Save
              </button>
              <button className="share-button">
                <FiShare2 /> Share
              </button>
            </div>

            <div className="package-tabs">
              <button
                className={selectedPackage === "basic" ? "active" : ""}
                onClick={() => handlePackageSelect("basic")}
              >
                Basic
              </button>
              <button
                className={selectedPackage === "standard" ? "active" : ""}
                onClick={() => handlePackageSelect("standard")}
              >
                Standard
              </button>
              <button
                className={selectedPackage === "premium" ? "active" : ""}
                onClick={() => handlePackageSelect("premium")}
              >
                Premium
              </button>
            </div>

            <div className="header">
              <h3>{currentPackage.title}</h3>
              <h2>${currentPackage.price}</h2>
            </div>

            <p className="package-description">{gig.shortDesc}</p>

            <div className="package-features">
              <div className="feature">
                <FiClock />
                <span>
                  {currentPackage.deliveryTime} Day
                  {currentPackage.deliveryTime !== 1 ? "s" : ""} Delivery
                </span>
              </div>
              <div className="feature">
                <FiRefreshCw />
                <span>
                  {currentPackage.revisionNumber} Revision
                  {currentPackage.revisionNumber !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {currentPackage.features && currentPackage.features.length > 0 && (
              <ul className="included-features">
                {currentPackage.features.map((feature, index) => (
                  <li key={index}>
                    <FiCheck className="check-icon" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            <button onClick={handleContinue} className="order-button">
              Continue
            </button>

            <div className="comparison-link">Compare Packages</div>

            <div className="guarantee">
              <i className="fas fa-shield-alt"></i>
              <span>Full Protection. Money-back Guarantee.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Gig;
