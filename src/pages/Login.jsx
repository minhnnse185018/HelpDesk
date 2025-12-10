import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, validateLoginPayload } from "../api/auth";
import { getNormalizedRoleFromPayload } from "../utils/roles";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
    const rawMessage = error?.message || "";
    try {
      const jsonStart = rawMessage.indexOf("{");
      if (jsonStart !== -1) {
        const parsed = JSON.parse(rawMessage.slice(jsonStart));
        if (parsed?.message) return parsed.message;
      }
    } catch (err) {
      // ignore parse errors and fall back below
    }
    const parts = rawMessage.split(" - ");
    const lastPart = parts[parts.length - 1]?.trim();
    return lastPart || "Email ho?c m?t kh?u kh?ng ch?nh x?c";
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

      const accessToken =
        payload?.accessToken || raw?.accessToken || nested?.accessToken;

      const refreshToken =
        payload?.refreshToken || raw?.refreshToken || nested?.refreshToken;

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

      const destination =
        normalizedRole === "ADMIN" ? "/admin/dashboard" : "/student/dashboard";
      navigate(destination, { replace: true });
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
      const idToken = credentialResponse.credential;

      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
      const res = await axios.post(`${baseUrl}/api/v1/auth/google`, {
        idToken,
      });

      console.log("🔥 RES DATA:", res.data);

      const payload = res.data;

      // 🔥 LẤY TOKEN ĐÚNG DỮ LIỆU BACKEND TRẢ VỀ
      const accessToken = payload.data?.accessToken;
      const refreshToken = payload.data?.refreshToken;

      console.log("🔥 accessToken:", accessToken);
      console.log("🔥 refreshToken:", refreshToken);

      if (!accessToken) {
        setServerError("Backend không trả accessToken");
        return;
      }

      // 🔥 GIẢI MÃ JWT ĐỂ LẤY ROLE
      const decoded = jwtDecode(accessToken);
      console.log("🔥 decoded:", decoded);

      const normalizedRole =
        decoded.roles?.toUpperCase() ||
        decoded.role?.toUpperCase() ||
        "STUDENT";

      const username = decoded.email?.split("@")[0];

      // LƯU TOKEN
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

      localStorage.setItem("role", normalizedRole);
      if (username) localStorage.setItem("username", username);

      // DELAY 100ms để Google iframe giải phóng
      setTimeout(() => {
        navigate(
          normalizedRole === "ADMIN"
            ? "/admin/dashboard"
            : "/student/dashboard",
          { replace: true }
        );
      }, 100);
    } catch (err) {
      console.error(err);
      setServerError("Đăng nhập Google thất bại");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Hình minh hoạ */}
        <div className="login-illustration" aria-hidden="true">
          <div className="building-shape" />
          <div className="wifi-shape" />
          <div className="tools-shape" />
          <p className="login-illustration-text">
            Cơ sở vật chất hiện đại
            <br />
            Hạ tầng, WiFi, thiết bị và nhiều hơn nữa
          </p>
        </div>

        {/* Form đăng nhập */}
        <div className="login-form-wrapper">
          <div className="login-header">
            <div className="app-logo">FH</div>
            <div>
              <h1 className="login-title">
                Hệ thống Phản Ánh CSVC & Yêu Cầu Hỗ Trợ
              </h1>
              <p className="login-subtitle">
                Gửi yêu cầu về cơ sở vật chất, WiFi và thiết bị
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
            <div className="form-field">
              <label htmlFor="password" className="form-label">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                value={form.password}
                placeholder="********"
                onChange={handleChange}
                aria-invalid={Boolean(errors.password)}
              />
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
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
            <div className="login-footer-links">
              <button
                type="button"
                className="link-button"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                Quên mật khẩu?
              </button>

              <button
                type="button"
                className="link-button small"
                onClick={() => navigate("/register")}
              >
                Đăng ký tài khoản
              </button>

              <button
                type="button"
                className="link-button small"
                onClick={goToVerifyPage}
              >
                Nhập mã OTP
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
                onError={() => setServerError("Đăng nhập Google thất bại")}
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
