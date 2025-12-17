import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  forgotPassword,
  resetPassword,
  validateForgotPasswordPayload,
  validateResetPasswordPayload,
} from "../api/auth";
import { useCapsLockWarning } from "../hooks/useCapsLockWarning";

function ForgotPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resetting, setResetting] = useState(false);
  const {
    capsLockOn: capsLockNew,
    handlePasswordKeyEvent: handlePasswordKeyNew,
    resetCapsLock: resetCapsNew,
  } = useCapsLockWarning();
  const {
    capsLockOn: capsLockConfirm,
    handlePasswordKeyEvent: handlePasswordKeyConfirm,
    resetCapsLock: resetCapsConfirm,
  } = useCapsLockWarning();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    setServerError("");
    setStatusMessage("");

    const validationErrors = validateForgotPasswordPayload({
      email: form.email,
    });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setSendingOtp(true);
    try {
      await forgotPassword({ email: form.email.trim() });
      setStatusMessage("Đã gửi mã OTP tới email. Vui lòng kiểm tra hộp thư.");
    } catch (error) {
      setServerError(
        error.message || "Không gửi được mã OTP, vui lòng thử lại."
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setServerError("");
    setStatusMessage("");

    const validationErrors = validateResetPasswordPayload({
      email: form.email,
      otp: form.otp,
      newPassword: form.newPassword,
      confirmPassword: form.confirmPassword,
    });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setResetting(true);
    try {
      await resetPassword({
        email: form.email.trim(),
        otp: form.otp.trim(),
        newPassword: form.newPassword,
      });
      setStatusMessage(
        "Đặt lại mật khẩu thành công. Đang chuyển về trang đăng nhập..."
      );
      setTimeout(() => navigate("/login", { replace: true }), 1000);
    } catch (error) {
      setServerError(
        error.message || "Đặt lại mật khẩu thất bại, vui lòng thử lại."
      );
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-form-wrapper" style={{ gridColumn: "1 / -1" }}>
          <div className="login-header">
            <div className="app-logo">FH</div>
            <div>
              <h1 className="login-title">Quên mật khẩu</h1>
              <p className="login-subtitle">
                Nhập email để nhận mã OTP và đặt lại mật khẩu mới
              </p>
            </div>
          </div>

          {/* Form gửi OTP */}
          <form className="login-form" onSubmit={handleSendOtp}>
            <div className="form-field">
              <label htmlFor="forgot-email" className="form-label">
                Email
              </label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                className="input"
                value={form.email}
                onChange={handleChange}
                placeholder="example@domain.com"
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && (
                <span className="form-error">{errors.email}</span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary full-width"
              disabled={sendingOtp || resetting}
            >
              {sendingOtp ? "Đang gửi mã OTP..." : "Gửi mã OTP"}
            </button>
          </form>

          {/* Form đặt lại mật khẩu */}
          <form className="login-form" onSubmit={handleResetPassword}>
            <div className="form-field">
              <label
                htmlFor="otp"
                className="form-label"
                style={{ marginTop: "16px" }}
              >
                Mã OTP
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                className="input"
                value={form.otp}
                onChange={handleChange}
                placeholder="Nhập mã gồm 6 chữ số"
                aria-invalid={Boolean(errors.otp)}
              />
              {errors.otp && <span className="form-error">{errors.otp}</span>}
            </div>

            <div className="form-field" style={{ position: "relative" }}>
              <label htmlFor="newPassword" className="form-label">
                Mật khẩu mới
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                className="input"
                value={form.newPassword}
                onChange={handleChange}
                onKeyDown={handlePasswordKeyNew}
                onKeyUp={handlePasswordKeyNew}
                onBlur={resetCapsNew}
                placeholder="Nhập mật khẩu mới"
                aria-invalid={Boolean(errors.newPassword)}
              />
              {capsLockNew && !errors.newPassword && (
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
              {errors.newPassword && (
                <span className="form-error">{errors.newPassword}</span>
              )}
            </div>

            <div className="form-field" style={{ position: "relative" }}>
              <label htmlFor="confirmPassword" className="form-label">
                Xác nhận mật khẩu
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="input"
                value={form.confirmPassword}
                onChange={handleChange}
                onKeyDown={handlePasswordKeyConfirm}
                onKeyUp={handlePasswordKeyConfirm}
                onBlur={resetCapsConfirm}
                placeholder="Nhập lại mật khẩu mới"
                aria-invalid={Boolean(errors.confirmPassword)}
              />
              {capsLockConfirm && !errors.confirmPassword && (
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
                  CAPS
                </span>
              )}
              {errors.confirmPassword && (
                <span className="form-error">{errors.confirmPassword}</span>
              )}
            </div>

            {serverError && <div className="form-error">{serverError}</div>}
            {statusMessage && !serverError && (
              <div className="form-success">{statusMessage}</div>
            )}

            <button
              type="submit"
              className="btn btn-secondary full-width"
              disabled={resetting || sendingOtp}
            >
              {resetting ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
            </button>
          </form>

          <div className="login-footer-links">
            <button
              type="button"
              className="link-button small"
              onClick={() => navigate("/login")}
              disabled={sendingOtp || resetting}
            >
              Quay lại đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
