import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import newRequest from "../../utils/newRequest";
import "./BecomeSeller.scss";

const BecomeSeller = () => {
  const [skills, setSkills] = useState([]);
  const [inputSkill, setInputSkill] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleAddSkill = () => {
    if (inputSkill.trim() === "") return;

    // Check if skill already exists
    if (!skills.includes(inputSkill.trim())) {
      setSkills([...skills, inputSkill.trim()]);
    }

    setInputSkill("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (skills.length === 0) {
      setError("Please add at least one skill to continue");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await newRequest.put("/users/become-seller", { skills });

      // The role has been changed in database, but the JWT token still has the old role
      // Need to logout and login again to get a new token with updated role
      try {
        await newRequest.post("/auth/logout");
        localStorage.removeItem("currentUser");

        // Show success message and redirect to login
        alert(
          "Congratulations! You are now a seller. Please login again to access seller features."
        );
        navigate("/login");
      } catch (logoutErr) {
        console.error("Logout error:", logoutErr);
        // If logout fails, at least update local storage and redirect
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            ...currentUser,
            ...response.data.user,
          })
        );
        navigate("/profile");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="become-seller">
      <div className="container">
        <h1>Become a Seller</h1>
        <p className="description">
          Share your expertise with the world by becoming a seller on our
          platform. Add your skills below to get started.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="skills-section">
            <label>Your Skills</label>
            <div className="skills-input">
              <input
                type="text"
                value={inputSkill}
                onChange={(e) => setInputSkill(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a skill (e.g., Web Development, Logo Design)"
              />
              <button
                type="button"
                className="add-skill-btn"
                onClick={handleAddSkill}
              >
                Add
              </button>
            </div>

            {skills.length > 0 && (
              <div className="skills-list">
                {skills.map((skill, index) => (
                  <div key={index} className="skill-tag">
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {skills.length === 0 && (
              <p className="no-skills">
                Please add at least one skill to continue
              </p>
            )}
          </div>

          {error && <div className="error">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate("/")}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading || skills.length === 0}
            >
              {isLoading ? "Processing..." : "Become a Seller"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BecomeSeller;
