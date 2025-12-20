import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";
import { AlertModal } from "../../components/templates";
import { formatDate } from "../../utils/ticketHelpers.jsx";

function RateTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ratingModal, setRatingModal] = useState(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadResolvedTickets();
  }, []);

  const loadResolvedTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/api/v1/tickets/my-tickets");
      const ticketsData = response?.data || {};
      const ticketsList = Array.isArray(ticketsData)
        ? ticketsData
        : Object.values(ticketsData).filter(Boolean);

      // Filter only resolved tickets
      const resolvedTickets = ticketsList.filter(
        (ticket) => ticket.status === "resolved"
      );

      setTickets(resolvedTickets);
    } catch (err) {
      console.error("Failed to load tickets:", err);
      setError(err?.message || "Failed to load resolved tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRating = (ticket) => {
    setRatingModal(ticket);
    setRating(ticket.rating || 0);
    setRatingComment(ticket.ratingComment || "");
  };

  const handleCloseRating = () => {
    setRatingModal(null);
    setRating(0);
    setRatingComment("");
  };

  const handleSubmitRating = async () => {
    if (!rating || rating < 1 || rating > 5) {
      setNotification({
        type: "error",
        message: "Please select a rating from 1 to 5 stars",
      });
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post(`/api/v1/tickets/${ratingModal.id}/rate`, {
        rating,
        ratingComment: ratingComment.trim() || "",
      });

      setNotification({
        type: "success",
        message: "Your rating has been submitted successfully!",
      });

      // Update ticket in list
      setTickets(
        tickets.map((t) =>
          t.id === ratingModal.id
            ? { ...t, rating, ratingComment: ratingComment.trim() }
            : t
        )
      );

      handleCloseRating();
    } catch (err) {
      console.error("Failed to submit rating:", err);
      setNotification({
        type: "error",
        message:
          err?.response?.data?.message ||
          "Unable to submit your rating. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (currentRating, interactive = false, onStarClick = null) => {
    return (
      <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onStarClick && onStarClick(star)}
            disabled={!interactive || submitting}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: interactive ? "pointer" : "default",
              fontSize: "1.5rem",
              color: star <= currentRating ? "#fbbf24" : "#d1d5db",
              transition: "all 0.2s",
              opacity: submitting ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (interactive && !submitting) {
                e.currentTarget.style.transform = "scale(1.2)";
              }
            }}
            onMouseLeave={(e) => {
              if (interactive && !submitting) {
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f5f5f7",
          padding: "2rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "#6b7280" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "3px solid rgba(0,0,0,0.1)",
              borderTopColor: "#000",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <p style={{ margin: 0 }}>Loading tickets...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f5f5f7",
          padding: "2rem",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            backgroundColor: "#fee2e2",
            padding: "1rem",
            borderRadius: "0.5rem",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f7", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "0.5rem",
              margin: 0,
            }}
          >
            Rate Tickets
          </h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: 0 }}>
            Rate the service quality for tickets that have been resolved
          </p>
        </div>

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              padding: "3rem",
              textAlign: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}>
              You do not have any resolved tickets to rate yet
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                style={{
                  backgroundColor: "white",
                  borderRadius: "0.75rem",
                  padding: "1.5rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  border: ticket.rating
                    ? "2px solid #10b981"
                    : "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: 600,
                        color: "#111827",
                        margin: "0 0 0.5rem 0",
                      }}
                    >
                      {ticket.title}
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.75rem",
                        fontSize: "0.875rem",
                        color: "#6b7280",
                      }}
                    >
                      {ticket.room?.name && <span>📍 {ticket.room.name}</span>}
                      {ticket.ticketCategories?.[0]?.category?.name && (
                        <span>📁 {ticket.ticketCategories[0].category.name}</span>
                      )}
                      {ticket.resolvedAt && (
                        <span>✅ Resolved: {formatDate(ticket.resolvedAt)}</span>
                      )}
                    </div>
                    {ticket.resolutionNote && (
                      <div
                        style={{
                          marginTop: "0.75rem",
                          padding: "0.75rem",
                          backgroundColor: "#dcfce7",
                          borderRadius: "0.5rem",
                          fontSize: "0.875rem",
                          color: "#065f46",
                        }}
                      >
                        <strong>Resolution note:</strong> {ticket.resolutionNote}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating Section */}
                <div
                  style={{
                    borderTop: "1px solid #e5e7eb",
                    paddingTop: "1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: "#374151",
                        margin: "0 0 0.5rem 0",
                      }}
                    >
                      {ticket.rating ? "Your rating:" : "You have not rated this ticket yet"}
                    </p>
                    {ticket.rating ? (
                      <div>
                        {renderStars(ticket.rating)}
                        {ticket.ratingComment && (
                          <p
                            style={{
                              fontSize: "0.875rem",
                              color: "#6b7280",
                              margin: "0.5rem 0 0 0",
                              fontStyle: "italic",
                            }}
                          >
                            "{ticket.ratingComment}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: "0.875rem", color: "#9ca3af", margin: 0 }}>
                        Please rate to help us improve our service
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenRating(ticket)}
                    style={{
                      padding: "0.625rem 1.25rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      backgroundColor: ticket.rating
                        ? "rgba(59, 130, 246, 0.08)"
                        : "rgba(16, 185, 129, 0.08)",
                      color: ticket.rating ? "#2563eb" : "#10b981",
                      border: `1px solid ${
                        ticket.rating
                          ? "rgba(59, 130, 246, 0.2)"
                          : "rgba(16, 185, 129, 0.2)"
                      }`,
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = ticket.rating
                        ? "rgba(59, 130, 246, 0.15)"
                        : "rgba(16, 185, 129, 0.15)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = ticket.rating
                        ? "rgba(59, 130, 246, 0.08)"
                        : "rgba(16, 185, 129, 0.08)";
                    }}
                  >
                    {ticket.rating ? "Edit rating" : "Rate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rating Modal */}
        {ratingModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "1rem",
            }}
            onClick={handleCloseRating}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "0.75rem",
                padding: "2rem",
                maxWidth: "500px",
                width: "100%",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  color: "#111827",
                  margin: "0 0 0.5rem 0",
                }}
              >
                Rate ticket
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  margin: "0 0 1.5rem 0",
                }}
              >
                {ratingModal.title}
              </p>

              {/* Star Rating */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Rating (1–5 stars) *
                </label>
                {renderStars(rating, true, setRating)}
                {rating > 0 && (
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      margin: "0.5rem 0 0 0",
                    }}
                  >
                    You selected {rating} star{rating > 1 ? "s" : ""}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Comment (optional)
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Share your feedback about the service..."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    fontSize: "0.875rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    fontFamily: "inherit",
                    resize: "vertical",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseRating}
                  disabled={submitting}
                  style={{
                    padding: "0.625rem 1.25rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    cursor: submitting ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    opacity: submitting ? 0.5 : 1,
                  }}
                  onMouseOver={(e) => {
                    if (!submitting) e.currentTarget.style.backgroundColor = "#e5e7eb";
                  }}
                  onMouseOut={(e) => {
                    if (!submitting) e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitRating}
                  disabled={submitting || !rating}
                  style={{
                    padding: "0.625rem 1.25rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    backgroundColor: rating ? "#10b981" : "#d1d5db",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: submitting || !rating ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    opacity: submitting ? 0.5 : 1,
                  }}
                  onMouseOver={(e) => {
                    if (!submitting && rating) e.currentTarget.style.backgroundColor = "#059669";
                  }}
                  onMouseOut={(e) => {
                    if (!submitting && rating) e.currentTarget.style.backgroundColor = "#10b981";
                  }}
                >
                  {submitting ? "Submitting..." : "Submit rating"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        {notification && (
          <AlertModal
            isOpen={!!notification}
            message={notification.message}
            title={notification.type === 'success' ? 'Success' : notification.type === 'error' ? 'Error' : 'Notice'}
            type={notification.type || 'info'}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  );
}

export default RateTickets;
