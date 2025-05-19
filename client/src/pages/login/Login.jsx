import React, { useState, useRef } from "react";
import "./Login.scss";
import newRequest from "../../utils/newRequest";
import { useNavigate, Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const recaptchaRef = useRef(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get the reCAPTCHA token
    const recaptchaToken = recaptchaRef.current.getValue();

    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification");
      return;
    }

    try {
      const res = await newRequest.post("/auth/login", {
        username,
        password,
        recaptchaToken,
      });
      localStorage.setItem("currentUser", JSON.stringify(res.data));
      navigate("/");
    } catch (err) {
      setError(err.response.data);
      // Reset reCAPTCHA after failed login attempt
      recaptchaRef.current.reset();
    }
  };

  return (
    <div className="login">
      <div className="form-side">
        <form onSubmit={handleSubmit}>
          <h1>Welcome Back</h1>
          <p className="subtitle">
            Today is a new day. It's your day. You shape it. Sign in to start
            managing your projects.
          </p>
          <label htmlFor="email">Username</label>
          <input
            name="username"
            type="username"
            placeholder="Enter your username"
            onChange={(e) => setUsername(e.target.value)}
          />

          <label htmlFor="password">Password</label>
          <input
            name="password"
            type="password"
            placeholder="At least 8 characters"
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="forgot-password">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          <div className="recaptcha-container">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              size="normal"
            />
          </div>

          <button type="submit">Sign in</button>
          {error && <span className="error">{error}</span>}

          <div className="divider">
            <span>Or</span>
          </div>

          <div className="social-login">
            <button type="button" className="google-btn">
              <img src="/img/google-logo.png" alt="Google" />
              Sign in with Google
            </button>
            <button type="button" className="facebook-btn">
              <img src="/img/facebook-logo.png" alt="Facebook" />
              Sign in with Facebook
            </button>
          </div>
        </form>
        <div className="signup-link">
          Don't you have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
      <div className="image-side">
        <img src="/img/login-picture.jpg" alt="Decorative flower arrangement" />
      </div>
    </div>
  );
}

export default Login;
