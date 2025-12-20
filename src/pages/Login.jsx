import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, validateLoginPayload } from "../api/auth";
import { getNormalizedRoleFromPayload } from "../utils/roles";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import Snowfall from "react-snowfall";
import { useCapsLockWarning } from "../hooks/useCapsLockWarning";
import RobotFace from "../components/RobotFace";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { capsLockOn, handlePasswordKeyEvent, resetCapsLock } =
    useCapsLockWarning();

  const goToVerifyPage = () => {
    navigate("/verify-email", {
      state: { email: form.email.trim() || undefined },
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const extractErrorMessage = (error) => {
    // Try to get message from error response
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    if (error?.response?.data?.error) {
      return error.response.data.error;
    }

    // Fallback to error.message
    if (error?.message) {
      return error.message;
    }

    return "Email or password is incorrect";
  };

  const handleStudentLogin = async (event) => {
    event.preventDefault();
    setServerError("");
    setStatusMessage("");

    const validationErrors = validateLoginPayload(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const response = await login({
        email: form.email.trim(),
        password: form.password,
      });

      const raw = response || {};
      const payload = raw?.data || raw;
      const nested = payload?.data || {};

      // Handle different response formats
      const accessToken =
        nested?.accessToken ||
        payload?.accessToken || 
        raw?.accessToken ||
        nested?.data?.accessToken;

      const refreshToken =
        nested?.refreshToken ||
        payload?.refreshToken || 
        raw?.refreshToken ||
        nested?.data?.refreshToken;

      const normalizedRole = getNormalizedRoleFromPayload(raw, "STUDENT");
      const usernameFromPayload =
        payload?.user?.username ||
        nested?.user?.username ||
        payload?.username ||
        nested?.username ||
        payload?.user?.email?.split?.("@")?.[0] ||
        nested?.user?.email?.split?.("@")?.[0] ||
        payload?.email ||
        nested?.email ||
        form.email.trim();

      console.log("Login response:", {
        accessToken,
        refreshToken,
        normalizedRole,
        usernameFromPayload,
      });

      if (accessToken) localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("role", normalizedRole);
      if (usernameFromPayload)
        localStorage.setItem("username", usernameFromPayload);

      let destination = "/student/dashboard";
      if (normalizedRole === "ADMIN") {
        destination = "/admin/dashboard";
      } else if (normalizedRole === "STAFF") {
        destination = "/staff/dashboard";
      }
      navigate(destination, { replace: true });

      // Start auto-refresh after successful login
      window.dispatchEvent(new Event("auth-login-success"));
    } catch (error) {
      setServerError(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setServerError("");
      setLoading(true);

      if (!credentialResponse?.credential) {
        setServerError("Google authentication failed. Please try again.");
        setLoading(false);
        return;
      }

      const idToken = credentialResponse.credential;

      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
      
      const res = await axios.post(`${baseUrl}/api/v1/auth/google`, {
        idToken,
      });

      console.log("🔥 RES DATA:", res.data);

      const payload = res.data;

      // Get tokens from backend response
      const accessToken = payload.data?.accessToken;
      const refreshToken = payload.data?.refreshToken;

      console.log("🔥 accessToken:", accessToken);
      console.log("🔥 refreshToken:", refreshToken);

      if (!accessToken) {
        setServerError("Backend did not return an accessToken");
        setLoading(false);
        return;
      }

      // Decode JWT to get role
      const decoded = jwtDecode(accessToken);
      console.log("🔥 decoded:", decoded);

      const normalizedRole =
        decoded.roles?.toUpperCase() ||
        decoded.role?.toUpperCase() ||
        "STUDENT";

      const username = decoded.email?.split("@")[0];

      // Store tokens - đảm bảo lưu trước khi navigate
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("role", normalizedRole);
      if (username) localStorage.setItem("username", username);

      // Verify tokens are saved before navigating
      const savedToken = localStorage.getItem("accessToken");
      if (!savedToken) {
        console.error("❌ Token was not saved properly");
        setServerError("Failed to save authentication token");
        setLoading(false);
        return;
      }

      // Delay để đảm bảo token được lưu và Google iframe được release
      // Tăng delay lên 200ms để đảm bảo mọi thứ được lưu đúng
      setTimeout(() => {
        // Double check token trước khi navigate
        const verifyToken = localStorage.getItem("accessToken");
        if (!verifyToken) {
          console.error("❌ Token lost before navigation");
          setServerError("Authentication token was lost. Please try again.");
          setLoading(false);
          return;
        }

        let destination = "/student/dashboard";
        if (normalizedRole === "ADMIN") {
          destination = "/admin/dashboard";
        } else if (normalizedRole === "STAFF") {
          destination = "/staff/dashboard";
        }
        
        console.log("✅ Navigating to:", destination);
        navigate(destination, { replace: true });

        // Start auto-refresh after successful login
        window.dispatchEvent(new Event("auth-login-success"));
      }, 200);
    } catch (err) {
      console.error("Google login error:", err);
      
      // Better error handling
      let errorMessage = "Google login failed";
      
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.status === 401) {
        errorMessage = "Authentication failed. Please try again.";
      } else if (err?.response?.status === 403) {
        errorMessage = "Access denied. Please contact administrator.";
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.code === "ERR_NETWORK") {
        errorMessage = "Network error. Please check your connection.";
      }
      
      setServerError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Snowfall color='#82C3D9' />
      {/* Robot Face theo dõi chuột */}
      <RobotFace size={140} position="right" />
      
      <div className="login-card">
        {/* Illustration */}
        <div className="login-illustration" aria-hidden="true">
          <div className="building-shape" />
          <div className="wifi-shape" />
          <div className="tools-shape" />
          <p className="login-illustration-text">
            Modern Facilities
            <br />
            Infrastructure, WiFi, Equipment and More
          </p>
        </div>

        {/* Login form */}
        <div className="login-form-wrapper">
          <div className="login-header">
            <img
              src="/helpdesk.png"
              alt="HelpDesk"
              className="app-logo"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "999px",
                objectFit: "contain",
              }}
            />
            <div>
              <h1 className="login-title">
                Infrastructure Feedback & Support Request System
              </h1>
              <p className="login-subtitle">
                Submit a request regarding facilities, WiFi, and equipment.
              </p>
            </div>
          </div>

          <form className="login-form" onSubmit={handleStudentLogin}>
            <div className="form-field">
              <label htmlFor="identifier" className="form-label">
                Email
              </label>
              <input
                id="identifier"
                name="email"
                type="email"
                className="input"
                value={form.email}
                placeholder="minh123@university.edu"
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && (
                <span className="form-error">{errors.email}</span>
              )}
            </div>

            <div className="form-field" style={{ position: "relative" }}>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                value={form.password}
                placeholder="********"
                onChange={handleChange}
                onKeyDown={handlePasswordKeyEvent}
                onKeyUp={handlePasswordKeyEvent}
                onBlur={resetCapsLock}
                aria-invalid={Boolean(errors.password)}
              />
              {capsLockOn && !errors.password && (
                <span
                  className="form-error"
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "58%",
                    transform: "translateY(-50%)",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    backgroundColor: "#f97316",
                    color: "white",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    pointerEvents: "none",
                  }}
                >
                  CAPS LOCK ON
                </span>
              )}
              {errors.password && (
                <span className="form-error">{errors.password}</span>
              )}
            </div>

            {serverError && <div className="form-error">{serverError}</div>}
            {statusMessage && !serverError && (
              <div className="form-success">{statusMessage}</div>
            )}

            <button
              type="submit"
              className="btn btn-primary full-width"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="login-footer-links">
              <button
                type="button"
                className="link-button"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                Forgot password?
              </button>

              <button
                type="button"
                className="link-button small"
                onClick={() => navigate("/register")}
              >
                Create account
              </button>

              <button
                type="button"
                className="link-button small"
                onClick={goToVerifyPage}
              >
                Enter OTP code
              </button>
            </div>

            {/* GOOGLE LOGIN BUTTON */}
            <div
              className="google-login-wrapper"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginRight: "60px",
              }}
            >
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={(error) => {
                  console.error("Google OAuth error:", error);
                  // Suppress the runtime.lastError - it's a known Chrome extension issue
                  if (error?.error !== "popup_closed_by_user") {
                    setServerError("Google authentication failed. Please make sure your origin is authorized in Google Cloud Console.");
                  }
                }}
                size="large"
                width="280"
                useOneTap={false}
                type="standard"
                theme="outline"
                shape="pill"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
