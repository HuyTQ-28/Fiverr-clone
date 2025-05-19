import React from "react";
import "./Slide.scss";
import Slider from "infinite-react-carousel";

const Slide = ({ children, slidesToShow, arrowsScroll }) => {
  return (
    <div className="slide">
      <div className="container">
        <div className="slider">
          <Slider
            slidesToShow={slidesToShow}
            arrowsScroll={arrowsScroll}
            className="custom-slider"
          >
            {children}
          </Slider>
        </div>
      </div>
    </div>
  );
};

export default Slide;
