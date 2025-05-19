import React, { useState } from "react";
import "./TagsInput.scss";

export const TagsInput = ({ value = [], onChange, name, placeHolder }) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        const newTags = [...value, inputValue.trim()];
        onChange(newTags);
      }
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove) => {
    const newTags = value.filter((tag) => tag !== tagToRemove);
    onChange(newTags);
  };

  return (
    <div className="tags-input-container">
      <div className="tags-list">
        {value.map((tag, index) => (
          <div className="tag" key={index}>
            <span>{tag}</span>
            <button
              type="button"
              className="tag-remove"
              onClick={() => removeTag(tag)}
            >
              ×
            </button>
          </div>
        ))}
        <input
          type="text"
          name={name}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeHolder : ""}
          className="tag-input"
        />
      </div>
    </div>
  );
};

export default TagsInput;
