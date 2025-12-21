import { useState, useEffect } from "react";
import { apiClient } from "../../api/client";
import { ActionButton, WarningMessage } from "../templates";

function AssignTicketModal({ ticket, onClose, onSubmit }) {
  const [staffId, setStaffId] = useState("");
  const [priority, setPriority] = useState(ticket.priority || "medium");
  const [staffList, setStaffList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStaffWarning, setSelectedStaffWarning] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);

  // Fetch ticket details to get assignedTo and deniedReason
  useEffect(() => {
    const fetchTicketDetails = async () => {
      if (!ticket?.id) return;
      
      try {
        const ticketRes = await apiClient.get(`/api/v1/tickets/${ticket.id}`);
        const ticketData = ticketRes?.data || ticketRes;
        setTicketDetails(ticketData);
        console.log("Ticket details:", ticketData);
      } catch (err) {
        console.error("Failed to fetch ticket details:", err);
        // Fallback to use ticket prop if API fails
        setTicketDetails(ticket);
      }
    };

    fetchTicketDetails();
  }, [ticket]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get department IDs from ticket categories
        const ticketDepartmentIds = new Set();
        
        if (Array.isArray(ticket.ticketCategories) && ticket.ticketCategories.length > 0) {
          // Fetch full category details to get department info
          for (const tc of ticket.ticketCategories) {
            const categoryId = tc.categoryId || tc.category?.id;
            if (categoryId) {
              try {
                const categoryRes = await apiClient.get(`/api/v1/categories/${categoryId}`);
                const categoryData = categoryRes?.data || categoryRes;
                const departmentId = categoryData?.departmentId || categoryData?.department?.id;
                
                if (departmentId) {
                  ticketDepartmentIds.add(departmentId);
                }
              } catch (err) {
                console.error(`Failed to fetch category ${categoryId}:`, err);
              }
            }
          }
        }

        console.log("Ticket Department IDs:", Array.from(ticketDepartmentIds));

        // Fetch staff by department using new API
        let allStaff = [];
        
        if (ticketDepartmentIds.size > 0) {
          // Fetch staff for each department
          const staffPromises = Array.from(ticketDepartmentIds).map(async (departmentId) => {
            try {
              const staffRes = await apiClient.post("/api/v1/users/staff/by-department", {
                departmentId: departmentId
              });
              let staffData = staffRes?.data || staffRes;
              
              // Normalize response
              if (staffData && !Array.isArray(staffData)) {
                staffData = Object.values(staffData).filter(Boolean);
              }
              
              return Array.isArray(staffData) ? staffData : [];
            } catch (err) {
              console.error(`Failed to fetch staff for department ${departmentId}:`, err);
              return [];
            }
          });
          
          const staffArrays = await Promise.all(staffPromises);
          allStaff = staffArrays.flat();
        } else {
          // No department found, fetch all staff
          try {
            const staffRes = await apiClient.get("/api/v1/users");
            let staffData = staffRes?.data || staffRes;
            
            if (staffData && !Array.isArray(staffData)) {
              staffData = Object.values(staffData).filter(Boolean);
            }
            
            allStaff = (Array.isArray(staffData) ? staffData : []).filter(
              (user) => String(user.role || "").toLowerCase() === "staff"
            );
          } catch (err) {
            console.error("Failed to fetch all staff:", err);
          }
        }

        // Remove duplicates
        const uniqueStaff = Array.from(
          new Map(allStaff.map(staff => [staff.id, staff])).values()
        );

        console.log("Final staff list:", uniqueStaff);
        setStaffList(uniqueStaff);
      } catch (err) {
        console.error("Failed to load staff:", err);
      }
    };

    loadData();
  }, [ticket]);

  // Check if selected staff is the same as assignedTo in current ticket with deniedReason
  useEffect(() => {
    if (!staffId || !ticketDetails) {
      setSelectedStaffWarning(null);
      return;
    }

    // Check if the selected staff ID matches the assignedTo in the current ticket
    const assignedTo = ticketDetails.assignedTo || 
                      ticketDetails.assigneeId || 
                      ticketDetails.assignee?.id || 
                      ticketDetails.assignee?.userId;
    
    const deniedReason = ticketDetails.deniedReason;

    // If selected staff matches assignedTo AND ticket has deniedReason, show warning
    if (assignedTo && staffId === assignedTo && deniedReason) {
      setSelectedStaffWarning({
        message: `Warning: This staff member is already assigned to this ticket and it was denied. Deny reason: ${deniedReason}`,
        deniedReason: deniedReason
      });
    } else {
      setSelectedStaffWarning(null);
    }
  }, [staffId, ticketDetails]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!staffId) {
      return;
    }
    if (!priority) {
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(ticket.id, staffId, priority);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          width: "100%",
          maxWidth: "600px",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          backdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.18)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "1.5rem",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Assign Ticket to Staff
          </h3>
          <p
            style={{
              margin: "0.5rem 0 0 0",
              fontSize: "0.85rem",
              color: "#6b7280",
            }}
          >
            Ticket: <strong>{ticket.title}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ marginBottom: "0.25rem" }}>
                <span style={{ fontWeight: 600, color: "#374151" }}>
                  Room:{" "}
                </span>
                <span style={{ color: "#6b7280" }}>
                  {ticket.room?.name || "N/A"}
                </span>
              </div>
              <div style={{ marginBottom: "0.25rem" }}>
                <span style={{ fontWeight: 600, color: "#374151" }}>
                  Current Priority:{" "}
                </span>
                <span style={{ color: "#6b7280", marginLeft: "0.25rem" }}>
                  {ticket.priority ? ticket.priority.toUpperCase() : "N/A"}
                </span>
              </div>
              <div>
                <span style={{ fontWeight: 600, color: "#374151" }}>
                  Categories:{" "}
                </span>
                <span style={{ color: "#6b7280" }}>
                  {Array.isArray(ticket.ticketCategories) &&
                  ticket.ticketCategories.length > 0
                    ? ticket.ticketCategories
                        .map((tc) => tc.category?.name)
                        .filter(Boolean)
                        .join(", ")
                    : "N/A"}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="staff"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                Assign to Staff
                {staffList.length > 0 && (
                  <span
                    style={{
                      marginLeft: "0.5rem",
                      fontSize: "0.75rem",
                      color: "#9ca3af",
                      fontWeight: 400,
                    }}
                  >
                    ({staffList.length} available)
                  </span>
                )}
              </label>
              <select
                id="staff"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  fontSize: "0.9rem",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "white",
                  color: "#374151",
                }}
              >
                <option value="">-- Select staff --</option>
                {staffList.length === 0 && (
                  <option value="" disabled>
                    No staff available in ticket's department
                  </option>
                )}
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.fullName || staff.username}
                    {staff.department?.name && ` - ${staff.department.name}`}
                  </option>
                ))}
              </select>
            </div>

            {selectedStaffWarning && (
              <WarningMessage
                message={selectedStaffWarning.message}
                icon="⚠️"
              />
            )}

            <div>
              <label
                htmlFor="priority"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  fontSize: "0.9rem",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "white",
                  color: "#374151",
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div
            style={{
              padding: "1.5rem",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
            }}
          >
            <ActionButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </ActionButton>
            <ActionButton
              type="submit"
              variant="success"
              disabled={submitting || !!selectedStaffWarning}
            >
              {submitting ? "Assigning..." : "Assign Ticket"}
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssignTicketModal;
