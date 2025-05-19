import React, { useEffect, useRef, useState } from "react";
import "./Gigs.scss";
import GigCard from "../../components/gigCard/GigCard";
import { useQuery } from "@tanstack/react-query";
import newRequest from "../../utils/newRequest";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/loadingSpinner/LoadingSpinner";

function Gigs() {
  const [sort, setSort] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [open, setOpen] = useState(false);
  const minRef = useRef();
  const maxRef = useRef();
  const navigate = useNavigate();

  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const categoryId = queryParams.get("categoryId");
  const searchQuery = queryParams.get("search");

  // Fetch category data if categoryId is present
  const { data: categoryData, isLoading: categoryLoading } = useQuery({
    queryKey: ["category", categoryId],
    queryFn: () =>
      categoryId
        ? newRequest.get(`/categories/${categoryId}`).then((res) => res.data)
        : null,
    enabled: !!categoryId,
  });

  // Construct query parameters
  const getQueryParams = () => {
    const params = new URLSearchParams();

    if (categoryId) params.append("categoryId", categoryId);
    if (searchQuery) params.append("search", searchQuery);
    if (minRef.current?.value) params.append("minPrice", minRef.current.value);
    if (maxRef.current?.value) params.append("maxPrice", maxRef.current.value);
    params.append("sort", sort);
    params.append("order", sortOrder);

    return params.toString();
  };

  // Fetch gigs with filters
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: ["gigs", categoryId, searchQuery, sort, sortOrder],
    queryFn: () =>
      newRequest.get(`/gigs?${getQueryParams()}`).then((res) => res.data),
  });

  const handleSort = (type) => {
    if (sort === type) {
      // Toggle order if same sort type
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSort(type);
      setSortOrder("desc"); // Default to descending for new sort
    }
    setOpen(false);
  };

  const handleApplyFilters = () => {
    refetch();
  };

  const getSortLabel = () => {
    switch (sort) {
      case "createdAt":
        return "Newest";
      case "price":
        return sortOrder === "asc"
          ? "Price: Low to High"
          : "Price: High to Low";
      case "sales":
        return "Best Selling";
      default:
        return "Relevant";
    }
  };

  return (
    <div className="gigs">
      <div className="container">
        <div className="breadcrumbs-category">
          <div className="breadcrumbs">
            <img src="/img/home.png" alt="" />
            <span>&gt; {categoryData?.name || "All Categories"}</span>
          </div>
          <h1>
            {categoryData?.name ||
              (searchQuery ? `Results for "${searchQuery}"` : "All Gigs")}
          </h1>
        </div>

        <div className="filter-sort-container">
          <div className="filters">
            <h3>Filter By</h3>
            <div className="price-range">
              <span>Budget ($)</span>
              <div className="inputs">
                <input ref={minRef} type="number" placeholder="Min" />
                <span className="separator">-</span>
                <input ref={maxRef} type="number" placeholder="Max" />
                <button onClick={handleApplyFilters}>Apply</button>
              </div>
            </div>
          </div>

          <div className="sort-options">
            <div className="sort-dropdown">
              <span className="label">Sort by:</span>
              <div className="selected-sort" onClick={() => setOpen(!open)}>
                {getSortLabel()}
                <img
                  src="/img/down.png"
                  alt="dropdown"
                  className={open ? "rotate" : ""}
                />
              </div>

              {open && (
                <div className="sort-menu">
                  <div
                    className="sort-item"
                    onClick={() => handleSort("createdAt")}
                  >
                    Newest
                  </div>
                  <div
                    className="sort-item"
                    onClick={() => handleSort("sales")}
                  >
                    Best Selling
                  </div>
                  <div
                    className="sort-item"
                    onClick={() => handleSort("price")}
                  >
                    {sortOrder === "asc"
                      ? "Price: High to Low"
                      : "Price: Low to High"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="loading">
            <LoadingSpinner size="large" text="Loading gigs..." />
          </div>
        ) : error ? (
          <div className="error">
            <p>Something went wrong! Please try again later.</p>
          </div>
        ) : (
          <>
            <div className="results-count">
              <p>{data.pagination.total} services available</p>
            </div>

            <div className="cards">
              {data.gigs.length === 0 ? (
                <div className="no-results">
                  <h3>No gigs found for your search</h3>
                  <p>Try adjusting your filters or search term</p>
                </div>
              ) : (
                data.gigs.map((gig) => <GigCard key={gig._id} item={gig} />)
              )}
            </div>

            {data.pagination.pages > 1 && (
              <div className="pagination">
                {/* Pagination implementation */}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Gigs;
