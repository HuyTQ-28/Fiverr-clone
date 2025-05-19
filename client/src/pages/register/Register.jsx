import React, { useState } from "react";
import upload from "../../utils/upload";
import "./Register.scss";
import newRequest from "../../utils/newRequest";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    country: "",
    img: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setUser((prev) => {
      return { ...prev, [e.target.name]: e.target.value };
    });
  };

  const validateForm = () => {
    if (user.password !== user.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (user.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Upload image if provided
      let imageUrl = "";
      if (file) {
        imageUrl = await upload(file);
      }

      // Register user
      await newRequest.post("/auth/register", {
        username: user.username,
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        country: user.country,
        img: imageUrl,
      });

      // Navigate to login page after successful registration
      navigate("/login");
    } catch (err) {
      setError(err.response?.data || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register">
      <div className="form-side">
        <form onSubmit={handleSubmit}>
          <h1>Create an Account</h1>
          <p className="subtitle">
            Join our community and start your journey with us.
          </p>

          <label htmlFor="username">Username</label>
          <input
            name="username"
            type="text"
            placeholder="Enter your username"
            onChange={handleChange}
            required
          />

          <label htmlFor="email">Email</label>
          <input
            name="email"
            type="email"
            placeholder="Enter your email"
            onChange={handleChange}
            required
          />

          <label htmlFor="fullName">Full Name</label>
          <input
            name="fullName"
            type="text"
            placeholder="Enter your full name"
            onChange={handleChange}
            required
          />

          <label htmlFor="country">Country</label>
          <input
            name="country"
            type="text"
            placeholder="Enter your country"
            onChange={handleChange}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            name="password"
            type="password"
            placeholder="At least 8 characters"
            onChange={handleChange}
            required
          />

          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            onChange={handleChange}
            required
          />

          <label htmlFor="profilePicture">Profile Picture (Optional)</label>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

          {error && <span className="error">{error}</span>}
        </form>
        <div className="login-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
      <div className="image-side">
        <img src="/img/login-picture.jpg" alt="Decorative flower arrangement" />
      </div>
    </div>
  );
}

export default Register;
