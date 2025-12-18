import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../api/auth";
import { useAuthProfile } from "../hooks/useAuthProfile";
import ProfileModal from "../components/ProfileModal";
import NotificationBell from "../components/notifications/NotificationBell";

function StaffLayout() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuthProfile();
  const [showNav, setShowNav] = useState(true);

  useEffect(() => {
    let lastY = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;

      if (currentY > lastY + 10) {
        setShowNav(false);      // scroll xuống → ẩn nav
      } else if (currentY < lastY - 10) {
        setShowNav(true);       // scroll lên → hiện nav
      }

      lastY = currentY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const displayName = profile.name || "Staff";
  const displayRole = profile.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1).toLowerCase()
    : "Staff";
  const displayAvatar = displayName.charAt(0).toUpperCase() || "S";
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      if (refreshToken) await logout({ refreshToken });
    } catch (_) {}

    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      {/* HEADER */}
      <header className="top-bar">
        <div className="top-bar-left" onClick={() => navigate("/staff/dashboard")}>
          <img src="/helpdesk.png" alt="HelpDesk" className="app-logo" style={{ width: '36px', height: '36px', borderRadius: '999px', objectFit: 'contain' }} />
          <div className="app-title-group">
            <span className="app-title">Facility Feedback & Helpdesk</span>
            <span className="app-subtitle">Staff Portal - Ticket management and processing</span>
          </div>
        </div>

        <div className="top-bar-right">
          <NotificationBell />
          <div className="user-info" onClick={() => setShowProfileModal(true)}>
            <div className="user-avatar">{displayAvatar}</div>
            <div className="user-meta">
              <span className="user-name">{displayName}</span>
              <span className="user-role">{displayRole}</span>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* FLOATING NAV */}
      <nav className={`top-nav-links ${showNav ? "top-nav-show" : "top-nav-hide"}`}>
        <NavLink to="/staff/dashboard" className={({ isActive }) =>
          `top-nav-link ${isActive ? "top-nav-link-active" : ""}`}>Dashboard</NavLink>

        <NavLink to="/staff/tickets" className={({ isActive }) =>
          `top-nav-link ${isActive ? "top-nav-link-active" : ""}`}>Assigned Tickets</NavLink>

        <NavLink to="/staff/sub-tickets" className={({ isActive }) =>
          `top-nav-link ${isActive ? "top-nav-link-active" : ""}`}>Sub-Tickets</NavLink>
      </nav>

      <main className="app-content">
        <Outlet context={{ profile }} />
      </main>

      <ProfileModal open={showProfileModal} onClose={() => setShowProfileModal(false)} onUpdated={refreshProfile} />
    </div>
  );
}

export default StaffLayout;
