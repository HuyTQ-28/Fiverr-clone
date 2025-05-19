import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.scss";
import upload from "../../utils/upload";
import newRequest from "../../utils/newRequest";

const Profile = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    country: "",
    phone: "",
    desc: "",
    skills: [],
  });
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) {
      navigate("/login");
      return;
    }
    setCurrentUser(user);
    setFormData({
      fullName: user.fullName || "",
      country: user.country || "",
      phone: user.phone || "",
      desc: user.desc || "",
      skills: user.skills || [],
    });
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (
      skillInput.trim() &&
      !formData.skills.includes(skillInput.trim().toLowerCase())
    ) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim().toLowerCase()],
      }));
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const updates = { ...formData };

      // Upload new image if provided
      if (file) {
        const imgUrl = await upload(file);
        updates.img = imgUrl;
      }

      const res = await newRequest.put(
        `/users/update/${currentUser._id}`,
        updates
      );

      // Update localStorage with the new user data
      const updatedUser = { ...currentUser, ...res.data };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="profile">
      <div className="container">
        <h1>Profile Settings</h1>
        <div className="profile-content">
          <form onSubmit={handleSubmit}>
            <div className="profile-image">
              <img
                src={
                  file
                    ? URL.createObjectURL(file)
                    : currentUser.img || "/img/noavatar.jpg"
                }
                alt="Profile"
              />
              <div className="upload-container">
                <label htmlFor="file-upload" className="custom-file-upload">
                  Change Photo
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Enter your country"
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="desc"
                value={formData.desc}
                onChange={handleChange}
                placeholder="Tell us about yourself"
                rows={5}
              />
            </div>

            <div className="form-group skills-section">
              <label>Skills</label>
              <div className="skill-input-container">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add a skill"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                />
                <button
                  type="button"
                  className="add-skill-btn"
                  onClick={handleAddSkill}
                >
                  Add
                </button>
              </div>
              <div className="skills-list">
                {formData.skills.map((skill, index) => (
                  <div key={index} className="skill-tag">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && (
              <div className="success-message">
                Profile updated successfully!
              </div>
            )}

            <button type="submit" className="save-btn" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
