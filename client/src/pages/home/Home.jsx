import React, { useEffect } from "react";
import "./Home.scss";
import Featured from "../../components/featured/Featured";
import Slide from "../../components/slide/Slide";
import CatCard from "../../components/catCard/CatCard";
import { useQuery } from "@tanstack/react-query";
import newRequest from "../../utils/newRequest";

function Home() {
  const {
    isLoading,
    error,
    data: categories,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => newRequest.get("/categories").then((res) => res.data),
  });

  return (
    <div className="home">
      <Featured />

      <div className="popular-services-container">
        <h1>Services</h1>
        {isLoading ? (
          "Loading categories..."
        ) : error ? (
          "Error loading categories"
        ) : (
          <Slide slidesToShow={6} arrowsScroll={6}>
            {categories.map((category) => (
              <CatCard key={category._id} card={category} />
            ))}
          </Slide>
        )}
      </div>

      <div className="fjobs-pro">
        <div className="container">
          <div className="inner-container">
            <div className="content-section">
              <div className="logo-container">
                <h2 className="fjobs-logo">
                  fjobs<span className="pro-text">pro.</span>
                </h2>
              </div>

              <div className="headline-container">
                <h1 className="headline">
                  The <span className="premium-text">premium</span> freelance
                  solution for businesses
                </h1>
              </div>

              <div className="features-grid">
                <div className="feature-box">
                  <img src="./img/check.png" alt="" />
                  <h3 className="feature-title">Dedicated hiring experts</h3>
                  <p className="feature-description">
                    Count on an account manager to find you the right talent and
                    see to your project's every need.
                  </p>
                </div>

                <div className="feature-box">
                  <img src="./img/check.png" alt="" />
                  <h3 className="feature-title">Satisfaction guarantee</h3>
                  <p className="feature-description">
                    Order confidently, with guaranteed refunds for
                    less-than-satisfactory deliveries.
                  </p>
                </div>

                <div className="feature-box">
                  <img src="./img/check.png" alt="" />
                  <h3 className="feature-title">Advanced management tools</h3>
                  <p className="feature-description">
                    Seamlessly integrate freelancers into your team and
                    projects.
                  </p>
                </div>

                <div className="feature-box">
                  <img src="./img/check.png" alt="" />
                  <h3 className="feature-title">Flexible payment models</h3>
                  <p className="feature-description">
                    Pay per project or opt for hourly rates to facilitate
                    longer-term collaboration.
                  </p>
                </div>
              </div>

              <div className="cta-container">
                <button className="try-now-btn">Try Now</button>
              </div>
            </div>

            <div className="visual-section">
              <img
                src="./img/fjobs-pro.png"
                alt="Fiverr Pro Dashboard"
                className="dashboard-image"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="success-story">
        <div className="text-section">
          <h1 className="main-title">What success on Fjobs looks like</h1>
          <p className="subtitle">
            Vontélle Eyewear turns to Fiverr freelancers to bring their vision
            to life.
          </p>
        </div>

        {/* Video Section */}
        <div className="video-container">
          <video
            className="video-player"
            controls
            poster="https://fiverr-res.cloudinary.com/image/upload/f_auto,q_auto/v1/attachments/generic_asset/asset/ef51b45f79342925d5268e0b2377eae8-1704717764992/thumbnail.png"
          >
            <source
              src={
                "https://fiverr-res.cloudinary.com/video/upload/t_fiverr_hd/v1/video-attachments/generic_asset/asset/4934b0c8f6441211d97f83585a7c9c00-1722433273322/Vontelle%20Cutdown-%20Breakthrough%20V5"
              }
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
}

export default Home;
