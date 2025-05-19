import React from "react";
import { Link } from "react-router-dom";
import "./CatCard.scss";

function CatCard({ card }) {
  return (
    <Link to={`/gigs?categoryId=${card._id}`} className="cat-card-link">
      <div className="catCard">
        <div className="top">
          <span className="title">{card.name}</span>
        </div>
        <div className="bottom">
          <img src={card.imgUrl} alt={card.name} />
        </div>
      </div>
    </Link>
  );
}
export default CatCard;
