import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import newRequest from "../../utils/newRequest";
import "./Success.scss";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";

const Success = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const payment_intent =
    params.get("paymentIntentId") || params.get("payment_intent");
  const orderId =
    params.get("orderId") || localStorage.getItem("current_order_id");

  const [status, setStatus] = useState("processing"); // processing, success, error
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => {
    console.log("Success page loaded with:", {
      payment_intent,
      orderId,
      stored_order_id: localStorage.getItem("current_order_id"),
      stored_payment_intent: localStorage.getItem("payment_intent_id"),
    });

    if (!payment_intent) {
      // Try to get from localStorage if not in URL
      const stored_payment_intent = localStorage.getItem("payment_intent_id");
      if (stored_payment_intent) {
        console.log(
          "Using payment_intent from localStorage:",
          stored_payment_intent
        );
        // Continue with payment_intent from localStorage
        confirmPayment(stored_payment_intent, orderId);
        return;
      }

      setStatus("error");
      setErrorMessage(
        "Payment information not found. Please contact support if you believe this is an error."
      );
      return;
    }

    confirmPayment(payment_intent, orderId);
  }, [navigate, orderId]);

  // Separate payment confirmation logic into its own function
  const confirmPayment = async (paymentIntentId, orderId) => {
    // Use confirmation flag to prevent multiple requests
    if (confirmationSent) {
      console.log("Confirmation already sent, skipping duplicate request");
      return;
    }

    try {
      // Check if we have all necessary data
      if (!orderId) {
        console.log("Missing orderId, cannot confirm payment");
        setStatus("error");
        setErrorMessage("Order ID is missing. Please contact support.");
        return;
      }

      console.log("Sending confirmation with:", {
        paymentIntentId,
        orderId,
      });

      // Use orderId stored from localStorage if not in URL
      const requestData = {
        paymentIntentId,
        orderId,
      };

      console.log("Final request data:", requestData);
      setConfirmationSent(true);

      // Send confirmation to server if not already processed
      const response = await newRequest.post(
        "/orders/confirm-client-payment",
        requestData
      );
      console.log("Successful confirmation response:", response.data);

      setStatus("success");

      // Only remove localStorage after successful confirmation
      localStorage.removeItem("current_order_id");
      localStorage.removeItem("payment_intent_id");

      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/orders");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } catch (err) {
      console.error("Payment confirmation error:", err);
      console.log("Error details:", err.response?.data);
      setStatus("error");
      setErrorMessage(
        err.response?.data?.message ||
          "An error occurred while processing your order. Please contact support."
      );
    }
  };

  return (
    <div className="success-page">
      <div className="container">
        {status === "processing" && (
          <div className="processing">
            <div className="spinner"></div>
            <h2>Processing your payment...</h2>
            <p>Please wait while we confirm your payment.</p>
          </div>
        )}

        {status === "success" && (
          <div className="success-message">
            <FiCheckCircle className="icon success" />
            <h1>Payment Successful!</h1>
            <p>
              Thank you for your order. Your transaction has been completed
              successfully.
            </p>
            <p>
              You will be redirected to your orders in {countdown} seconds...
            </p>
            <button onClick={() => navigate("/orders")}>View My Orders</button>
          </div>
        )}

        {status === "error" && (
          <div className="error-message">
            <FiAlertCircle className="icon error" />
            <h1>Payment Issue</h1>
            <p>{errorMessage}</p>
            <div className="actions">
              <button onClick={() => navigate("/orders")}>Go to Orders</button>
              <button className="secondary" onClick={() => navigate("/")}>
                Return to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Success;
