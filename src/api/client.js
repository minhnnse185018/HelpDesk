// ===============================
// API CLIENT WITH AUTO REFRESH JWT
// ===============================

const getBaseUrl = () => {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv && typeof fromEnv === "string") {
    return fromEnv.trim().replace(/\/$/, "");
  }
  console.warn("VITE_API_BASE_URL is not set; fallback https://helpdesk-backend.onrender.com");
  return "https://helpdesk-backend.onrender.com";
};

const buildUrl = (path) => {
  const normalizedPath = String(path || "").replace(/^\//, "");
  return `${getBaseUrl()}/${normalizedPath}`;
};

const prepareBody = (body) => {
  if (!body) return undefined;
  if (body instanceof FormData) return body;
  if (typeof body === "string") return body;
  return JSON.stringify(body);
};

const getAccessToken = () => localStorage.getItem("accessToken");
const getRefreshToken = () => localStorage.getItem("refreshToken");

const saveAccessToken = (token) => localStorage.setItem("accessToken", token);
const saveRefreshToken = (token) => localStorage.setItem("refreshToken", token);

// ===============================
// JWT UTILITIES
// ===============================
/**
 * Decode JWT token without verification (client-side only)
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null if invalid
 */
function decodeJWT(token) {
  if (!token || typeof token !== 'string') return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if access token is expired or will expire soon
 * @param {number} bufferMinutes - Minutes before expiration to consider as "expiring soon" (default: 2)
 * @returns {boolean} True if token is expired or expiring soon
 */
function isTokenExpiringSoon(bufferMinutes = 2) {
  const token = getAccessToken();
  if (!token) return true;
  
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const expirationTime = decoded.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const bufferTime = bufferMinutes * 60 * 1000; // Convert buffer to milliseconds
  
  // Token is expired or will expire within buffer time
  return (expirationTime - currentTime) <= bufferTime;
}

/**
 * Get time until token expires in milliseconds
 * @returns {number|null} Milliseconds until expiration or null if invalid
 */
function getTimeUntilExpiration() {
  const token = getAccessToken();
  if (!token) return null;
  
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return null;
  
  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();
  const timeUntilExpiration = expirationTime - currentTime;
  
  return timeUntilExpiration > 0 ? timeUntilExpiration : 0;
}

// ===============================
// 🔥 REFRESH TOKEN FUNCTION
// ===============================
let isRefreshing = false;
let pendingRequests = [];

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  const url = buildUrl("/api/v1/auth/refresh");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData?.message || "Failed to refresh token");
    error.response = {
      data: errorData,
      status: res.status,
      statusText: res.statusText
    };
    throw error;
  }

  const data = await res.json();
  
  // Handle different response formats
  const newAccessToken = 
    data?.data?.accessToken || 
    data?.accessToken || 
    data?.data?.data?.accessToken;
    
  const newRefreshToken = 
    data?.data?.refreshToken || 
    data?.refreshToken || 
    data?.data?.data?.refreshToken;

  if (newAccessToken) {
    saveAccessToken(newAccessToken);
    console.log("✅ Access token refreshed successfully");
  } else {
    console.warn("⚠️ No access token in refresh response:", data);
  }
  
  // Update refresh token if provided
  if (newRefreshToken) {
    saveRefreshToken(newRefreshToken);
    console.log("✅ Refresh token updated");
  }

  return newAccessToken;
}

// ===============================
// CENTRAL REQUEST FUNCTION
// ===============================
async function request(path, options = {}) {
  const { method = "GET", headers, body, ...rest } = options;
  const payload = prepareBody(body);
  const url = buildUrl(path);
  const token = getAccessToken();

  let response = await fetch(url, {
    method,
    body: payload,
    headers: {
      ...(body instanceof FormData
        ? {}
        : { "Content-Type": "application/json", Accept: "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...rest,
  });

  // ===============================
  // 🔥 HANDLE TOKEN EXPIRED (401)
  // ===============================
  if (response.status === 401) {
    const refreshToken = getRefreshToken();
    
    // Skip auto-refresh if user is on auth pages (login, register, etc.)
    const currentPath = window.location.pathname;
    const isAuthPage = ['/login', '/register', '/verify-email', '/forgot-password'].some(p => currentPath.startsWith(p));
    
    // 🔥 Nếu đang ở trang auth (login, register...) → KHÔNG refresh, chỉ throw error
    // Điều này tránh việc reload trang khi login sai mật khẩu
    if (isAuthPage) {
      const contentType = response.headers.get("content-type") || "";
      let errorData = null;
      
      if (contentType.includes("application/json")) {
        errorData = await response.json().catch(() => null);
      }
      
      const error = new Error(errorData?.message || "Unauthorized");
      error.response = { 
        data: errorData,
        status: 401,
        statusText: "Unauthorized"
      };
      throw error;
    }
    
    // Không có refresh token → redirect về login
    if (!refreshToken) {
      localStorage.clear();
      window.location.href = "/login";
      throw new Error("No refresh token, redirecting to login");
    }

    // Nếu đang refresh → xếp request vào hàng đợi
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({ resolve, reject });
      })
        .then((newToken) => {
          return request(path, options); // chạy lại request cũ
        })
        .catch((err) => {
          throw err;
        });
    }

    // Bắt đầu refresh
    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();

      // wake pending requests
      pendingRequests.forEach((p) => p.resolve(newToken));
      pendingRequests = [];

      return request(path, options); // retry request
    } catch (refreshError) {
      // refresh thất bại → logout
      pendingRequests.forEach((p) => p.reject(refreshError));
      pendingRequests = [];

      localStorage.clear();
      window.location.href = "/login";
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  }

  // ===============================
  // NORMAL RESPONSE PROCESSING
  // ===============================
  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const errorData = await response.json().catch(() => null);
      const error = new Error(errorData?.message || errorData?.error || response.statusText);
      error.response = { 
        data: errorData,
        status: response.status,
        statusText: response.statusText
      };
      throw error;
    }
    const text = await response.text().catch(() => "");
    const error = new Error(text || response.statusText);
    error.response = {
      data: { message: text || response.statusText },
      status: response.status,
      statusText: response.statusText
    };
    throw error;
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) =>
    request(path, { ...options, method: "POST", body }),
  put: (path, body, options) =>
    request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) =>
    request(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};

export const API_BASE_URL = getBaseUrl();

// Export JWT utilities for use in other modules
export { decodeJWT, isTokenExpiringSoon, getTimeUntilExpiration };
