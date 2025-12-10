import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../api/auth";
import { useAuthProfile } from "../hooks/useAuthProfile";
import ProfileModal from "../components/ProfileModal";

function StudentLayout() {
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

  const displayName = profile.name || "User";
  const displayRole = profile.role
    ? profile.role.charAt(0) + profile.role.slice(1).toLowerCase()
    : "Student";
  const displayAvatar = displayName.charAt(0).toUpperCase() || "U";
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
        <div className="top-bar-left" onClick={() => navigate("/student/dashboard")}>
          <div className="app-logo">FH</div>
          <div className="app-title-group">
            <span className="app-title">Facility Feedback & Helpdesk</span>
            <span className="app-subtitle">Hệ thống phản ánh CSVC, WiFi, thiết bị</span>
          </div>
        </div>

        <div className="top-bar-right">
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
        <NavLink to="/student/dashboard" className={({ isActive }) =>
          `top-nav-link ${isActive ? "top-nav-link-active" : ""}`}>Dashboard</NavLink>

        <NavLink to="/student/my-tickets" className={({ isActive }) =>
          `top-nav-link ${isActive ? "top-nav-link-active" : ""}`}>My Tickets</NavLink>

        <NavLink to="/student/create-ticket" className={({ isActive }) =>
          `top-nav-link ${isActive ? "top-nav-link-active" : ""}`}>Create Ticket</NavLink>
      </nav>

      <main className="app-content">
        <Outlet context={{ profile }} />
      </main>

      <ProfileModal open={showProfileModal} onClose={() => setShowProfileModal(false)} onUpdated={refreshProfile} />
    </div>
  );
}

export default StudentLayout;
