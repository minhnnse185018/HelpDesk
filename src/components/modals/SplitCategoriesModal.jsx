import { useState, useEffect } from "react";
import { apiClient } from "../../api/client";
import { fontSize, fontWeight } from "../../utils/fontStyles";

function SplitCategoriesModal({ ticket, onClose, onSubmit }) {
  const [submitting, setSubmitting] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [groupAssignments, setGroupAssignments] = useState({});
  const [groupPriorities, setGroupPriorities] = useState({});
  const [categoriesWithDept, setCategoriesWithDept] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingCategories(true);
        
        // Load all categories
        const categoriesResponse = await apiClient.get("/api/v1/categories");
        let categoriesData = categoriesResponse?.data || {};
        const categoriesList = Array.isArray(categoriesData) 
          ? categoriesData 
          : Object.values(categoriesData).filter(Boolean);
        
        // Load all departments
        const departmentsResponse = await apiClient.get("/api/v1/departments");
        let departmentsData = departmentsResponse?.data || {};
        const departmentsList = Array.isArray(departmentsData) 
          ? departmentsData 
          : Object.values(departmentsData).filter(Boolean);
        
        // Load staff
        const usersResponse = await apiClient.get("/api/v1/users");
        let usersData = usersResponse?.data || usersResponse;
        
        // Convert to array if needed
        if (usersData && !Array.isArray(usersData)) {
          usersData = Object.values(usersData).filter(Boolean);
        }
        
        // Filter only staff role users
        const filteredStaff = (
          Array.isArray(usersData) ? usersData : []
        ).filter((user) => String(user.role || "").toLowerCase() === "staff");
        
        setStaffList(filteredStaff);

        // Enrich ticket categories with full department info
        const enrichedCategories = ticket.ticketCategories?.map((tc) => {
          const fullCategory = categoriesList.find(c => c.id === tc.category?.id);
          
          // If category has departmentId but no department object, map it
          if (fullCategory) {
            const categoryWithDept = { ...fullCategory };
            
            // If category has departmentId but no department object
            if (categoryWithDept.departmentId && !categoryWithDept.department) {
              const department = departmentsList.find(d => d.id === categoryWithDept.departmentId);
              if (department) {
                categoryWithDept.department = department;
              }
            }
            
            return {
              ...tc,
              category: categoryWithDept
            };
          }
          
          return tc;
        }) || [];
        
        setCategoriesWithDept(enrichedCategories);

        // Initialize assignments and priorities
        const initialAssignments = {};
        const initialPriorities = {};
        enrichedCategories.forEach((tc) => {
          const categoryId = tc.category?.id;
          if (categoryId) {
            initialAssignments[categoryId] = "";
            initialPriorities[categoryId] = "medium";
          }
        });
        setGroupAssignments(initialAssignments);
        setGroupPriorities(initialPriorities);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadData();
  }, [ticket]);

  const handleAssignmentChange = (categoryId, staffId) => {
    setGroupAssignments((prev) => ({
      ...prev,
      [categoryId]: staffId,
    }));
  };

  const handlePriorityChange = (categoryId, priority) => {
    setGroupPriorities((prev) => ({
      ...prev,
      [categoryId]: priority,
    }));
  };

  const handleSubmit = async () => {
    const splits =
      ticket.ticketCategories
        ?.map((tc) => {
          const categoryId = tc.category?.id;
          if (!categoryId) return null;
          return {
            categoryIds: [categoryId],
            priority: groupPriorities[categoryId] || "medium",
            ...(groupAssignments[categoryId] && { staffId: groupAssignments[categoryId] }),
          };
        })
        .filter(Boolean) || [];

    setSubmitting(true);
    await onSubmit(ticket.id, splits);
    setSubmitting(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          width: "100%",
          maxWidth: "650px",
          borderRadius: "12px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "1.5rem", borderBottom: "1px solid #e5e7eb" }}>
          <h3
            style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Split Categories & Assign Staff
          </h3>
        </div>

        <div style={{ padding: "1.5rem" }}>
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            <p
              style={{
                margin: "0 0 0.5rem 0",
                fontSize: "0.9rem",
                color: "#6b7280",
              }}
            >
              <strong style={{ color: "#374151" }}>Ticket:</strong>{" "}
              {ticket.title}
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>
              Each category will be split into a separate sub-ticket and sent to the corresponding department
            </p>
          </div>

          {loadingCategories ? (
            <div style={{ 
              padding: "2rem", 
              textAlign: "center", 
              color: "#6b7280",
              fontSize: "0.9rem"
            }}>
              Loading department information...
            </div>
          ) : (
            <div style={{ marginBottom: "1.5rem" }}>
              {categoriesWithDept.map((tc, index) => {
                const cat = tc.category;
                if (!cat) return null;
                return (
              <div
                key={cat.id}
                style={{
                  marginBottom: "1rem",
                  padding: "1rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                }}
              >
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        color: "#111827",
                      }}
                    >
                      Sub-ticket {index + 1}: {cat.name}
                    </span>
                  </div>
                  {cat.department && (
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "0.25rem 0.75rem",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                    }}>
                      <span style={{ color: "#6b7280", fontWeight: 500 }}>
                        Department:
                      </span>
                      <span style={{ 
                        color: "#111827", 
                        fontWeight: 600,
                        marginLeft: "0.5rem"
                      }}>
                        {cat.department.name}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label
                    htmlFor={`priority-${cat.id}`}
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: "#6b7280",
                    }}
                  >
                    Priority
                  </label>
                  <select
                    id={`priority-${cat.id}`}
                    value={groupPriorities[cat.id] || "medium"}
                    onChange={(e) =>
                      handlePriorityChange(cat.id, e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      fontSize: "0.9rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
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
                <div>
                  <label
                    htmlFor={`staff-${cat.id}`}
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: "#6b7280",
                    }}
                  >
                    Assign to Staff (Optional)
                  </label>
                  <select
                    id={`staff-${cat.id}`}
                    value={groupAssignments[cat.id] || ""}
                    onChange={(e) =>
                      handleAssignmentChange(cat.id, e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      fontSize: "0.9rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      backgroundColor: "white",
                      color: "#374151",
                    }}
                  >
                    <option value="">-- No Assignment (Assign Later) --</option>
                    {staffList
                      .filter((staff) => {
                        // Filter staff by category's department
                        const categoryDeptId = cat.department?.id;
                        const staffDeptId = staff.department?.id;
                        // If category has no department or staff has no department, show all
                        if (!categoryDeptId) return true;
                        return staffDeptId === categoryDeptId;
                      })
                      .map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.fullName || staff.username}
                          {staff.department?.name && ` (${staff.department.name})`}
                        </option>
                      ))}
                  </select>
                  {cat.department && (
                    <p style={{ 
                      margin: "0.5rem 0 0 0", 
                      fontSize: "0.75rem", 
                      color: "#9ca3af" 
                    }}>
                      Showing staff from: {cat.department.name}
                    </p>
                  )}
                  {!cat.department && (
                    <p style={{ 
                      margin: "0.5rem 0 0 0", 
                      fontSize: "0.75rem", 
                      color: "#dc2626",
                      fontWeight: 500
                    }}>
                      ⚠️ This category has no department assigned
                    </p>
                  )}
                </div>
              </div>
            );
            })}
          </div>
          )}
        </div>

        <div
          style={{
            padding: "1.5rem",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            gap: "0.75rem",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: "0.625rem 1.25rem",
              fontSize: "0.9rem",
              fontWeight: 500,
              backgroundColor: "rgba(0, 0, 0, 0.03)",
              color: "#6b7280",
              border: "1px solid rgba(0, 0, 0, 0.06)",
              borderRadius: "14px",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.5 : 1,
              backdropFilter: "blur(30px)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: "0.625rem 1.25rem",
              fontSize: "0.9rem",
              fontWeight: 500,
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              color: "#1d1d1f",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              borderRadius: "14px",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.5 : 1,
              backdropFilter: "blur(40px) saturate(200%)",
              boxShadow:
                "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(0, 0, 0, 0.05)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {submitting ? "Splitting..." : "Split Tickets"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SplitCategoriesModal;
