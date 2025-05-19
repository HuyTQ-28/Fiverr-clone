import toast from "react-hot-toast";

/**
 * Utility functions for displaying toast notifications
 */
const notification = {
  /**
   * Display a success notification
   * @param {string} message - The message to display
   * @param {object} options - Additional options for the toast
   */
  success: (message, options = {}) => {
    return toast.success(message, options);
  },

  /**
   * Display an error notification
   * @param {string} message - The message to display
   * @param {object} options - Additional options for the toast
   */
  error: (message, options = {}) => {
    return toast.error(message, options);
  },

  /**
   * Display an info notification
   * @param {string} message - The message to display
   * @param {object} options - Additional options for the toast
   */
  info: (message, options = {}) => {
    return toast(message, {
      icon: "ℹ️",
      ...options,
    });
  },

  /**
   * Display a warning notification
   * @param {string} message - The message to display
   * @param {object} options - Additional options for the toast
   */
  warning: (message, options = {}) => {
    return toast(message, {
      icon: "⚠️",
      style: {
        border: "1px solid #fff8e1",
        borderLeft: "4px solid #FFC107",
      },
      ...options,
    });
  },

  /**
   * Display a loading notification
   * @param {string} message - The message to display
   * @param {object} options - Additional options for the toast
   */
  loading: (message = "Loading...", options = {}) => {
    return toast.loading(message, options);
  },

  /**
   * Update an existing toast
   * @param {string} toastId - The ID of the toast to update
   * @param {string} message - The new message
   * @param {object} options - Additional options for the toast
   */
  update: (toastId, message, options = {}) => {
    return toast.loading(message, { id: toastId, ...options });
  },

  /**
   * Dismiss a toast
   * @param {string} toastId - The ID of the toast to dismiss
   */
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },
};

export default notification;
