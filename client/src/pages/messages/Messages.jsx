import React from "react";
import { Link, useNavigate } from "react-router-dom";
import ChatComponent from "../../components/Chat/ChatComponent";
import "./Messages.scss";

const Messages = () => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  // Chuyển hướng đến trang đăng nhập nếu chưa đăng nhập
  React.useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  return (
    <div className="messages">
      <div className="container">
        <div className="title">
          <h1>Messages</h1>
          <Link to="/" className="back-link">
            Back to home
          </Link>
        </div>
        <ChatComponent />
      </div>
    </div>
  );
};

export default Messages;
