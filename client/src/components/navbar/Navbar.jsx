import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiChevronDown, FiSearch } from "react-icons/fi";
import newRequest from "../../utils/newRequest";
import "./Navbar.scss";

function Navbar() {
  // State management
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Hooks
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  // Event handlers
  const handleScroll = () => {
    setActive(window.scrollY > 0);
  };

  const handleDropdownToggle = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const handleLogout = async () => {
    try {
      await newRequest.post("/auth/logout");
      localStorage.setItem("currentUser", null);
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    // Handle scroll event for navbar background change
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (!e.target.closest(".dropdown")) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Component rendering
  const renderDropdownMenu = (type, items) => {
    return (
      <div className="nav-item dropdown">
        <button
          className="dropdown-toggle"
          onClick={(e) => {
            e.stopPropagation();
            handleDropdownToggle(type);
          }}
        >
          {type === "pro" ? "Fjobs Pro" : "Explore"} <FiChevronDown />
        </button>
        <div
          className={`dropdown-menu ${activeDropdown === type ? "active" : ""}`}
        >
          {items.map((item, index) => (
            <Link key={index} to={item.link} className="link">
              {item.text}
            </Link>
          ))}
        </div>
      </div>
    );
  };

  const renderUserMenu = () => {
    if (!currentUser) {
      return (
        <>
          <Link to="/login" className="link">
            Sign in
          </Link>
          <Link className="link join-button-link" to="/register">
            <button>Join</button>
          </Link>
        </>
      );
    }

    return (
      <div className="user" onClick={() => setOpen(!open)}>
        <img src={currentUser.img || "/img/noavatar.jpg"} alt="User avatar" />
        <span>{currentUser?.fullName}</span>
        <div className={`options ${open ? "active" : ""}`}>
          <Link className="link" to="/profile">
            Profile
          </Link>
          <Link className="link" to="/change-password">
            Change Password
          </Link>
          {currentUser.role === "seller" && (
            <>
              <Link className="link" to="/mygigs">
                Gigs
              </Link>
              <Link className="link" to="/add">
                Add New Gig
              </Link>
            </>
          )}
          <Link className="link" to="/orders">
            Orders
          </Link>
          <Link className="link" to="/messages">
            Messages
          </Link>
          <Link className="link" onClick={handleLogout}>
            Logout
          </Link>
        </div>
      </div>
    );
  };

  // Dropdown menu items
  const proMenuItems = [
    { text: "Pro Services", link: "/pro" },
    { text: "Explore Pro", link: "/explore-pro" },
  ];

  const exploreMenuItems = [
    { text: "Categories", link: "/categories" },
    { text: "Discover", link: "/discover" },
    { text: "Guides", link: "/guides" },
  ];

  return (
    <div className={active || pathname !== "/" ? "navbar active" : "navbar"}>
      <div className="container">
        <div className="logo">
          <Link className="link" to="/">
            <img src="/img/fjobs_logo.png" alt="Fjobs logo" />
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="links">
          {/* Dropdown Menus */}
          {renderDropdownMenu("pro", proMenuItems)}
          {renderDropdownMenu("explore", exploreMenuItems)}
          {/* Language Selector */}
          <div className="language">
            <img src="/img/language.png" alt="Language icon" />
            <span className="globe-icon">EN</span>
          </div>
          {/* Conditional Links */}{" "}
          {currentUser?.role === "buyer" && (
            <Link to="/become-seller" className="link">
              {" "}
              Become a Seller{" "}
            </Link>
          )}{" "}
          {/* User Authentication Area */}
          {renderUserMenu()}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
