import React, { useState } from "react";
import "./ResetPassword.scss";
import newRequest from "../../utils/newRequest";
import { useNavigate, useParams, Link } from "react-router-dom";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { token } = useParams();

  const validatePassword = () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword()) return;

    setLoading(true);
    try {
      await newRequest.patch(`/auth/reset-password/${token}`, {
        password,
        passwordConfirm,
      });
      setSuccess(true);
      setError(null);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.response?.data || "Something went wrong!");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="form-side">
        <form onSubmit={handleSubmit}>
          <h1>Reset Password</h1>
          <p className="subtitle">Create a new password for your account.</p>

          {success ? (
            <div className="success-message">
              <p>Your password has been reset successfully!</p>
              <p>Redirecting to login page...</p>
            </div>
          ) : (
            <>
              <label htmlFor="password">New Password</label>
              <input
                name="password"
                type="password"
                placeholder="At least 8 characters"
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <label htmlFor="passwordConfirm">Confirm Password</label>
              <input
                name="passwordConfirm"
                type="password"
                placeholder="Confirm your password"
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
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

export default ResetPassword;
