import React, { useEffect, useState } from "react";
import "./Pay.scss";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import newRequest from "../../utils/newRequest";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import CheckoutForm from "../../components/checkoutForm/CheckoutForm";

// Make sure to replace with your Stripe key
const stripePromise = loadStripe(
  "pk_test_51RJygg4NgQrvQqIKQbcBeQo6PoPEDQ94YlAaTE5JkRogkh1dIXmgp3S0Uh7bXmcWBCujLsOIPYfWVeYGfwHGT7vN00PlZL14bI"
);

const Pay = () => {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  useEffect(() => {
    const makeRequest = async () => {
      try {
        setLoading(true);
        const res = await newRequest.post(
          `/orders/create-payment-intent/gig/${id}`
        );

        setClientSecret(res.data.clientSecret);
        setOrderId(res.data.orderId);
        setPaymentIntentId(res.data.paymentIntentId);

        // Store order ID and payment ID
        localStorage.setItem("current_order_id", res.data.orderId);
        localStorage.setItem("payment_intent_id", res.data.paymentIntentId);

        setLoading(false);
      } catch (err) {
        console.error("Payment error:", err);
        setError(
          err.response?.data?.message ||
            "An error occurred while setting up the payment"
        );
        setLoading(false);
      }
    };
    makeRequest();
  }, [id]);

  const appearance = {
    theme: "stripe",
    variables: {
      colorPrimary: "#1dbf73",
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  if (loading) {
    return (
      <div className="pay loading">
        <div className="container">
          <div className="spinner"></div>
          <p>Setting up your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pay error">
        <div className="container">
          <h2>Payment Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(`/gig/${id}`)}>Back to gig</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pay">
      <div className="container">
        {clientSecret && (
          <Elements options={options} stripe={stripePromise}>
            <CheckoutForm
              orderId={orderId}
              gigId={id}
              paymentIntentId={paymentIntentId}
            />
          </Elements>
        )}
      </div>
    </div>
  );
};

export default Pay;
