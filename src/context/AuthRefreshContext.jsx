import { createContext, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, isTokenExpiringSoon, getTimeUntilExpiration } from "../api/client";

const AuthRefreshContext = createContext(null);

export const useAuthRefresh = () => {
  const context = useContext(AuthRefreshContext);
  if (!context) {
    throw new Error("useAuthRefresh must be used within AuthRefreshProvider");
  }
  return context;
};

export function AuthRefreshProvider({ children }) {
  const navigate = useNavigate();
  const refreshIntervalRef = useRef(null);
  const isRefreshingRef = useRef(false);

  const refreshAccessToken = async () => {
    // Tránh refresh đồng thời
    if (isRefreshingRef.current) {
      console.log("⏳ Already refreshing token...");
      return;
    }

    const refreshToken = localStorage.getItem("refreshToken");
    const accessToken = localStorage.getItem("accessToken");

    // Nếu không có token thì không cần refresh
    if (!refreshToken || !accessToken) {
      console.log("⚠️ No tokens found, skipping refresh");
      return;
    }

    // Check if token is actually expiring soon
    if (!isTokenExpiringSoon(2)) {
      const timeLeft = getTimeUntilExpiration();
      const minutesLeft = timeLeft ? Math.floor(timeLeft / 60000) : 0;
      console.log(`⏰ Token still valid for ${minutesLeft} minutes, skipping refresh`);
      return;
    }

    try {
      isRefreshingRef.current = true;
      const timeLeft = getTimeUntilExpiration();
      const minutesLeft = timeLeft ? Math.floor(timeLeft / 60000) : 0;
      console.log(`🔄 Refreshing access token (expires in ${minutesLeft} minutes)...`);

      const response = await apiClient.post("/api/v1/auth/refresh", {
        refreshToken,
      });

      console.log("📦 Refresh response:", response);

      // Handle different response formats
      const newAccessToken = 
        response?.data?.accessToken || 
        response?.data?.data?.accessToken ||
        response?.accessToken;
        
      const newRefreshToken = 
        response?.data?.refreshToken || 
        response?.data?.data?.refreshToken ||
        response?.refreshToken;

      if (newAccessToken) {
        localStorage.setItem("accessToken", newAccessToken);
        console.log("✅ Access token refreshed successfully");
        
        // Cập nhật refresh token nếu backend trả về token mới
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
          console.log("✅ Refresh token also updated");
        }
      } else {
        console.warn("⚠️ No new access token received");
        console.warn("⚠️ Response data:", response?.data || response);
      }
    } catch (error) {
      console.error("❌ Failed to refresh token:", error);
      console.error("❌ Error response:", error?.response?.data);
      console.error("❌ Error status:", error?.response?.status);
      
      // Chỉ logout nếu token thực sự hết hạn (401/403)
      // Với các lỗi khác (network, 500, etc.) thì giữ nguyên để retry sau
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.log("🚪 Token expired, logging out...");
        handleLogout();
      } else {
        console.log("⚠️ Refresh failed but keeping session (will retry next time)");
      }
    } finally {
      isRefreshingRef.current = false;
    }
  };

  const handleLogout = () => {
    // Dừng interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    // Xóa tokens
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("username");

    // Redirect về login
    navigate("/login", { replace: true });
  };

  const startAutoRefresh = () => {
    // Dừng interval cũ nếu có
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    console.log("🚀 Starting smart auto-refresh system");

    // Check và refresh ngay lập tức nếu cần
    refreshAccessToken();

    // Smart refresh: Check every minute and refresh if token expires in < 2 minutes
    // Token hết hạn sau 20 phút, nên check mỗi 1 phút là đủ
    refreshIntervalRef.current = setInterval(() => {
      refreshAccessToken();
    }, 60 * 1000); // Check every 1 minute
  };

  const stopAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      console.log("⏹️ Stopping auto-refresh");
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    // Chỉ start auto-refresh nếu user đã login
    if (accessToken && refreshToken) {
      startAutoRefresh();
    }

    // Listen for login success event
    const handleLoginSuccess = () => {
      console.log("🎉 Login success detected, starting auto-refresh");
      startAutoRefresh();
    };

    window.addEventListener("auth-login-success", handleLoginSuccess);

    // Cleanup khi unmount
    return () => {
      stopAutoRefresh();
      window.removeEventListener("auth-login-success", handleLoginSuccess);
    };
  }, []);

  const value = {
    refreshAccessToken,
    startAutoRefresh,
    stopAutoRefresh,
    handleLogout,
  };

  return (
    <AuthRefreshContext.Provider value={value}>
      {children}
    </AuthRefreshContext.Provider>
  );
}
