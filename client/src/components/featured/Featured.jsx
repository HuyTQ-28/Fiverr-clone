import React, { useState, useRef } from "react";
import "./Featured.scss";
import { useNavigate } from "react-router-dom";

function Featured() {
  const [input, setInput] = useState("");
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const handleSubmit = () => {
    navigate(`/gigs?search=${input}`);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="featured">
      <video ref={videoRef} className="video-background" autoPlay loop muted>
        <source src="./video/background.mp4" type="video/mp4" />
      </video>
      <div className="container">
        <div className="content">
          <h1>
            Our freelancers <br />
            will take it from here
          </h1>
          <div className="search">
            <div className="searchInput">
              <input
                type="text"
                placeholder="Search for any service..."
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            <button onClick={handleSubmit}>
              <img src="./img/search.png" alt="" />
            </button>
          </div>
          <div className="popular">
            <button>
              website development <span>→</span>
            </button>
            <button>
              architecture & interior design <span>→</span>
            </button>
            <button>
              UGC videos <span>→</span>
            </button>
            <button>
              video editing <span>→</span>
            </button>
          </div>
          <div className="trusted">
            <span>Trusted by:</span>
            <div className="brands">
              <img src="./img/meta.png" alt="Meta" />
              <img src="./img/google.png" alt="Google" />
              <img src="./img/netflix.png" alt="Netflix" />
              <img src="./img/pg.png" alt="P&G" />
              <img src="./img/paypal.png" alt="PayPal" />
              <img src="./img/payoneer.png" alt="Payoneer" />
            </div>
          </div>
        </div>
      </div>
      <button className="video-control" onClick={togglePlay}>
        {isPlaying ? "II" : "▶"}
      </button>
    </div>
  );
}

export default Featured;
