import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import newRequest from "../../utils/newRequest";
import "./ChangePassword.scss";
import toast from "react-hot-toast";

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (
      !formData.oldPassword ||
      !formData.newPassword ||
      !formData.confirmNewPassword
    ) {
      setError("All fields are required");
      return false;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      setError("New passwords do not match");
      return false;
    }

    if (formData.newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return false;
    }

    if (formData.oldPassword === formData.newPassword) {
      setError("New password must be different from the old password");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      setLoading(true);
      const { oldPassword, newPassword, confirmNewPassword } = formData;
      await newRequest.patch("/users/change-password", {
        oldPassword,
        newPassword,
        confirmNewPassword,
      });
      setLoading(false);
      toast.success("Password changed successfully");
      navigate("/profile");
    } catch (err) {
      setLoading(false);
      setError(err.response?.data || "Something went wrong");
      console.error("Error changing password:", err);
    }
  };

  return (
    <div className="change-password">
      <div className="container">
        <h1>Change Password</h1>
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="oldPassword">Current Password</label>
              <input
                type="password"
                id="oldPassword"
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleChange}
                placeholder="Enter your current password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter your new password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmNewPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmNewPassword"
                name="confirmNewPassword"
                value={formData.confirmNewPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
              />
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
