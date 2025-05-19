import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./MyGigs.scss";
import getCurrentUser from "../../utils/getCurrentUser";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import newRequest from "../../utils/newRequest";

function MyGigs() {
  const currentUser = getCurrentUser();
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const { isLoading, error, data } = useQuery({
    queryKey: ["myGigs", statusFilter],
    queryFn: () => {
      const endpoint = `/gigs/seller/mygigs${
        statusFilter !== "all" ? `?status=${statusFilter}` : ""
      }`;
      return newRequest.get(endpoint).then((res) => {
        return res.data;
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => {
      return newRequest.delete(`/gigs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["myGigs"]);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => {
      return newRequest.patch(`/gigs/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["myGigs"]);
    },
  });

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this gig?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    statusMutation.mutate({ id, status: newStatus });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "active":
        return "status-badge active";
      case "paused":
        return "status-badge paused";
      case "draft":
        return "status-badge draft";
      case "pending_approval":
        return "status-badge pending";
      case "denied":
        return "status-badge denied";
      default:
        return "status-badge";
    }
  };

  return (
    <div className="myGigs">
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="error">Error loading gigs: {error.message}</div>
      ) : (
        <div className="container">
          <div className="title">
            <h1>My Gigs</h1>
            <Link to="/add">
              <button>Add New Gig</button>
            </Link>
          </div>

          <div className="filters">
            <span>Filter by status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Gigs</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="denied">Denied</option>
            </select>
          </div>

          {data?.gigs?.length === 0 ? (
            <div className="no-gigs">
              <p>You don't have any gigs yet. Create your first gig!</p>
              <Link to="/add">
                <button>Create a Gig</button>
              </Link>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Price</th>
                  <th>Sales</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.gigs?.map((gig) => (
                  <tr key={gig._id}>
                    <td>
                      <img className="image" src={gig.cover} alt="" />
                    </td>
                    <td>{gig.title}</td>
                    <td>${gig.price}</td>
                    <td>{gig.sales || 0}</td>
                    <td>
                      <span className={getStatusBadgeClass(gig.status)}>
                        {gig.status}
                      </span>
                    </td>
                    <td className="actions">
                      <Link to={`/edit/${gig._id}`}>
                        <button className="edit">Edit</button>
                      </Link>

                      {gig.status === "active" && (
                        <button
                          className="pause"
                          onClick={() => handleStatusChange(gig._id, "paused")}
                        >
                          Pause
                        </button>
                      )}

                      {gig.status === "paused" && (
                        <button
                          className="activate"
                          onClick={() => handleStatusChange(gig._id, "active")}
                        >
                          Activate
                        </button>
                      )}

                      {gig.status === "draft" && (
                        <button
                          className="publish"
                          onClick={() => handleStatusChange(gig._id, "active")}
                        >
                          Publish
                        </button>
                      )}

                      <button
                        className="delete"
                        onClick={() => handleDelete(gig._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default MyGigs;
