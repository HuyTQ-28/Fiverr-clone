import React from "react";
import "./LoadingSpinner.scss";

function LoadingSpinner({
  size = "medium",
  text = "Loading...",
  fullPage = false,
}) {
  return (
    <div className={`loading-spinner-container ${fullPage ? "full-page" : ""}`}>
      <div className={`spinner ${size}`}></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
}

export default LoadingSpinner;
