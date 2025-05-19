import React from "react";
import LoadingSpinner from "../loadingSpinner/LoadingSpinner";
import "./ActionButton.scss";

/**
 * A button component with loading state
 * @param {Object} props - The component props
 * @param {string} props.text - The button text
 * @param {boolean} props.loading - Whether the button is in loading state
 * @param {string} props.loadingText - The text to display while loading
 * @param {string} props.type - The button type (button, submit, reset)
 * @param {string} props.variant - The button variant (primary, secondary, outline)
 * @param {Function} props.onClick - The click handler
 * @param {boolean} props.disabled - Whether the button is disabled
 * @returns {JSX.Element} - The ActionButton component
 */
const ActionButton = ({
  text,
  loading = false,
  loadingText = "Processing...",
  type = "button",
  variant = "primary",
  onClick,
  disabled = false,
  ...props
}) => {
  return (
    <button
      type={type}
      className={`action-button ${variant} ${loading ? "loading" : ""}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner size="inline" text="" />}
      <span>{loading ? loadingText : text}</span>
    </button>
  );
};

export default ActionButton;
