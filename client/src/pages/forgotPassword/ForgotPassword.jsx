import React, { useState } from "react";
import "./ForgotPassword.scss";
import newRequest from "../../utils/newRequest";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await newRequest.post("/auth/forgot-password", { email });
      setSuccess(true);
      setError(null);
    } catch (err) {
      setError(err.response?.data || "Something went wrong!");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="form-side">
        <form onSubmit={handleSubmit}>
          <h1>Forgot Password</h1>
          <p className="subtitle">
            Enter your email address below and we'll send you a link to reset
            your password.
          </p>

          {success ? (
            <div className="success-message">
              <p>Password reset link has been sent to your email!</p>
              <p>Please check your inbox and spam folder.</p>
              <Link to="/login" className="back-link">
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <label htmlFor="email">Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="Enter your email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              {error && <span className="error">{error}</span>}
            </>
          )}

          <div className="back-to-login">
            <Link to="/login">Back to Login</Link>
          </div>
        </form>
      </div>
      <div className="image-side">
        <img src="/img/login-picture.jpg" alt="Decorative flower arrangement" />
      </div>
    </div>
  );
}

export default ForgotPassword;
