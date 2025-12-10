// ===============================
// API CLIENT WITH AUTO REFRESH JWT
// ===============================

const getBaseUrl = () => {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv && typeof fromEnv === "string") {
    return fromEnv.trim().replace(/\/$/, "");
  }
  console.warn("VITE_API_BASE_URL is not set; fallback http://localhost:3001");
  return "http://localhost:3001";
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

  if (!res.ok) throw new Error("Failed to refresh token");

  const data = await res.json();
  const newAccessToken = data?.accessToken;

  if (newAccessToken) saveAccessToken(newAccessToken);

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
    if (!refreshToken) {
      window.location.href = "/login";
      throw new Error("Unauthorized");
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
    const text = await response.text().catch(() => "");
    throw new Error(text || response.statusText);
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
