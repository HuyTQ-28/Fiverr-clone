import React, { useEffect, useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import "./CheckoutForm.scss";
import newRequest from "../../utils/newRequest";
import { useNavigate } from "react-router-dom";

const CheckoutForm = ({ orderId, gigId, paymentIntentId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Check if we have payment intent client secret and successfully paid
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent.status) {
        case "succeeded":
          setMessage("Payment successful!");
          break;
        case "processing":
          setMessage("Payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Payment failed, please try again.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      // Make sure we store the payment intent ID in localStorage as well
      if (paymentIntentId) {
        localStorage.setItem("payment_intent_id", paymentIntentId);
      }
      if (orderId) {
        localStorage.setItem("current_order_id", orderId);
      }

      // Confirm the payment on Stripe servers
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success?orderId=${orderId}&paymentIntentId=${paymentIntentId}`,
        },
        redirect: "if_required",
      });

      if (error) {
        setMessage(error.message || "An error occurred during payment");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // If payment is successful without redirect (e.g., using PM like Google Pay)
        setMessage("Payment successful!");
        setPaymentConfirmed(true);

        // Confirm the order on our server
        try {
          await newRequest.post("/orders/confirm-client-payment", {
            orderId,
            paymentIntentId,
          });

          // Navigate to success page with the same parameters as the Stripe redirect
          navigate(
            `/success?orderId=${orderId}&paymentIntentId=${paymentIntentId}`
          );
        } catch (confirmError) {
          console.error("Error confirming payment on server:", confirmError);
          setMessage(
            "Payment successful but order update failed. Please contact support."
          );
        }
      }
    } catch (err) {
      console.error("Payment error:", err);
      setMessage(err.message || "An error occurred during payment");
    }

    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: "tabs",
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" options={paymentElementOptions} />

      <button
        disabled={isLoading || !stripe || !elements || paymentConfirmed}
        id="submit"
      >
        <span id="button-text">
          {isLoading ? <div className="spinner" id="spinner"></div> : "Pay Now"}
        </span>
      </button>

      {message && <div id="payment-message">{message}</div>}
    </form>
  );
};

export default CheckoutForm;
