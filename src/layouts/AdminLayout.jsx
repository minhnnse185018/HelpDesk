import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../api/auth";
import { useAuthProfile } from "../hooks/useAuthProfile";
import ProfileModal from "../components/ProfileModal";
import NotificationBell from "../components/notifications/NotificationBell";

function AdminLayout() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuthProfile();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const displayName = profile.name || profile.username || "Admin";
  const displayRole = profile.role
    ? profile.role.charAt(0) + profile.role.slice(1).toLowerCase()
    : "Admin";
  const displayAvatar = displayName.charAt(0).toUpperCase() || "A";
  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      if (refreshToken) await logout({ refreshToken });
    } catch (error) {
      // Ignore logout API errors; still clear client state.
      console.error("Logout failed:", error?.message || error);
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/login", { replace: true });
  };
  return (
    <div className="app-shell app-shell-admin">
      <aside className="sidebar">
        <div
          className="sidebar-header"
          onClick={() => navigate("/admin/dashboard")}
        >
          <div className="app-logo">FH</div>
          <div className="app-title-group">
            <span className="app-title-short">Facility Helpdesk</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/tickets"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
            }
          >
            Tickets
          </NavLink>
          <NavLink
            to="/admin/categories"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
            }
          >
            Categories
          </NavLink>
          <NavLink
            to="/admin/departments"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
            }
          >
            Departments
          </NavLink>
          <NavLink
            to="/admin/rooms"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
            }
          >
            Rooms
          </NavLink>
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
            }
          >
            Users
          </NavLink>
          <NavLink
            to="/admin/reports"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
            }
          >
            Sla Polices
          </NavLink>
        </nav>
      </aside>

      <div className="app-main">
        <header className="top-bar top-bar-admin">
          <div className="top-bar-left">
            <span className="page-title-prefix">Admin</span>
          </div>
          <div className="top-bar-right">
            <NotificationBell />
            <div
              className="user-info"
              onClick={() => setShowProfileModal(true)}
              style={{ cursor: "pointer" }}
            >
              <div className="user-avatar">{displayAvatar}</div>
              <div className="user-meta">
                <span className="user-name">{displayName}</span>
                <span className="user-role">{displayRole}</span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="app-content">
          <Outlet context={{ profile }} />
        </main>

        <ProfileModal
          open={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onUpdated={refreshProfile}
        />
      </div>
    </div>
  );
}

export default AdminLayout;
