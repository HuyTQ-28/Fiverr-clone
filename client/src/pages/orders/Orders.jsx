import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Orders.scss";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import newRequest from "../../utils/newRequest";
import moment from "moment";
import {
  FiMessageSquare,
  FiCheckCircle,
  FiPackage,
  FiClock,
  FiAlertCircle,
  FiFilter,
  FiSearch,
} from "react-icons/fi";

const Orders = () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  // Fetch orders from API
  const { isLoading, error, data } = useQuery({
    queryKey: ["orders"],
    queryFn: () =>
      newRequest.get(`/orders/my-orders`).then((res) => {
        return res.data;
      }),
  });

  // Mutation to update order status
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) => {
      return newRequest.patch(`/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["orders"]);
    },
  });

  // Handle contacting the other party
  const handleContact = async (order) => {
    try {
      // Get clean string IDs, validating they exist first
      const sellerId =
        order.sellerId?._id?.toString() || order.sellerId?.toString();
      const buyerId =
        order.buyerId?._id?.toString() || order.buyerId?.toString();

      if (!sellerId || !buyerId) {
        console.error("Invalid seller or buyer ID", { order });
        return;
      }

      console.log("Creating conversation between:", { sellerId, buyerId });

      // Simple approach: let the server handle checking for existing conversations
      const res = await newRequest.post(`/conversations`, {
        sellerId,
        buyerId,
      });

      // The server will either create a new conversation or return an existing one
      navigate(`/message/${res.data._id}`);
    } catch (err) {
      console.error("Error creating conversation:", err);
    }
  };

  // Handle marking as delivered (Seller)
  const handleMarkDelivered = (orderId) => {
    if (
      window.confirm("Are you sure you want to mark this order as delivered?")
    ) {
      updateOrderStatusMutation.mutate({
        orderId,
        status: "delivered",
      });
    }
  };

  // Handle completing order (Buyer)
  const handleCompleteOrder = (orderId) => {
    if (window.confirm("Are you sure you want to complete this order?")) {
      updateOrderStatusMutation.mutate({
        orderId,
        status: "completed",
      });
    }
  };

  // Filter orders by status and search
  const filteredOrders = data?.filter((order) => {
    // Always exclude pending_payment orders
    if (order.status === "pending_payment") {
      return false;
    }

    // Filter by status
    if (filterStatus !== "all" && order.status !== filterStatus) {
      return false;
    }

    // Filter by search
    if (search && !order.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Get status icon based on status
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending_payment":
        return <FiClock className="status-icon pending" />;
      case "processing":
        return <FiPackage className="status-icon processing" />;
      case "delivered":
        return <FiPackage className="status-icon delivered" />;
      case "completed":
        return <FiCheckCircle className="status-icon completed" />;
      case "cancelled":
      case "payment_failed":
        return <FiAlertCircle className="status-icon cancelled" />;
      default:
        return <FiClock className="status-icon" />;
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case "pending_payment":
        return "Pending Payment";
      case "processing":
        return "Processing";
      case "delivered":
        return "Delivered";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "payment_failed":
        return "Payment Failed";
      default:
        return status;
    }
  };

  // Get action button based on order status and user role
  const getActionButton = (order) => {
    const isSeller = currentUser.isSeller;
    const isOrderSeller =
      (order.sellerId._id && order.sellerId._id === currentUser._id) ||
      order.sellerId === currentUser._id;
    const isOrderBuyer =
      (order.buyerId._id && order.buyerId._id === currentUser._id) ||
      order.buyerId === currentUser._id;

    // If user is the seller of this order
    if (isOrderSeller && order.status === "processing") {
      return (
        <button
          onClick={() => handleMarkDelivered(order._id)}
          className="action-button deliver"
        >
          Mark As Delivered
        </button>
      );
    }

    // If user is the buyer of this order
    if (isOrderBuyer && order.status === "delivered") {
      return (
        <button
          onClick={() => handleCompleteOrder(order._id)}
          className="action-button complete"
        >
          Confirm Completion
        </button>
      );
    }

    return null;
  };

  return (
    <div className="orders">
      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      ) : error ? (
        <div className="error">
          <FiAlertCircle />
          <p>An error occurred while loading data. Please try again later.</p>
          {error.response?.status === 401 && (
            <button className="login-button" onClick={() => navigate("/login")}>
              Login
            </button>
          )}
        </div>
      ) : (
        <div className="container">
          <div className="title">
            <h1>Order Management</h1>
          </div>

          <div className="filters">
            <div className="search-box">
              <FiSearch />
              <input
                type="text"
                placeholder="Search by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-dropdown">
              <FiFilter />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="processing">Processing</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="payment_failed">Payment Failed</option>
              </select>
            </div>
          </div>

          {filteredOrders?.length === 0 ? (
            <div className="no-results">
              <p>No orders found.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders?.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <img className="image" src={order.img} alt="" />
                      </td>
                      <td className="title-cell">
                        <span className="order-title">{order.title}</span>
                        <span className="order-id">
                          Number of order: {order._id.substring(0, 8)}
                        </span>
                      </td>
                      <td>{moment(order.createdAt).format("DD/MM/YYYY")}</td>
                      <td className="price">${order.price}</td>
                      <td>
                        <div className="status">
                          {getStatusIcon(order.status)}
                          <span>{getStatusText(order.status)}</span>
                        </div>
                      </td>
                      <td className="actions">
                        <button
                          className="message-button"
                          onClick={() => handleContact(order)}
                          title="Messaging"
                        >
                          <FiMessageSquare />
                        </button>
                        {getActionButton(order)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;
