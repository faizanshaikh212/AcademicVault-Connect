import axios, { InternalAxiosRequestConfig } from "axios";

// Function to get the current token
const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Create an Axios instance with a base URL for our backend
const api = axios.create({
  baseURL: "http://localhost:5001/api", // The base URL of your backend server
  withCredentials: true,
});

// Add a request interceptor to include the auth token in every request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token) {
      // Ensure we're always sending the token with the Bearer prefix
      config.headers.set("Authorization", `Bearer ${token}`);

      // Only set Content-Type for non-FormData requests
      if (!(config.data instanceof FormData)) {
        config.headers.set("Content-Type", "application/json");
      }
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

export default api;

// Response interceptor to handle token expiration and automatic refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If there's no originalRequest or it's the refresh endpoint itself, don't try to refresh
    if (!originalRequest || originalRequest.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    // If not an auth error or already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Mark request as retried to prevent loops
    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.set("Authorization", `Bearer ${token}`);
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;
    // Add a small cooldown so we don't hammer the refresh endpoint if many
    // requests fail at once. This reduces multiple refresh network calls and
    // repeated 401 entries in the browser network tab.
    try {
      const REFRESH_COOLDOWN = 5000; // ms
      (api as any)._lastRefreshAttempt = (api as any)._lastRefreshAttempt || 0;
      const since = Date.now() - (api as any)._lastRefreshAttempt;
      if (since < REFRESH_COOLDOWN) {
        // Give up trying to refresh right now — reject queued requests so
        // callers can handle unauthenticated state without generating extra
        // refresh network traffic.
        const err = new Error("Refresh cooldown active");
        processQueue(err, null);
        return Promise.reject(err);
      }

      (api as any)._lastRefreshAttempt = Date.now();

      // Call refresh endpoint (cookie-based refresh) using a lightweight axios
      // call. This may return 401 if no refresh cookie is present/expired.
      const resp = await axios.post(
        "http://localhost:5001/api/auth/refresh",
        null,
        {
          withCredentials: true,
        }
      );

      const { token } = resp.data || {};
      if (!token) {
        const err = new Error("No token returned from refresh");
        processQueue(err, null);
        // Clear stored token but do not force a redirect here — let the app
        // handle unauthenticated state gracefully.
        localStorage.removeItem("token");
        return Promise.reject(err);
      }

      // Store new token
      localStorage.setItem("token", token);

      processQueue(null, token);
      originalRequest.headers.set("Authorization", `Bearer ${token}`);
      return api(originalRequest);
    } catch (err) {
      processQueue(err, null);
      // On refresh failure, clear local token and reject. Do not automatically
      // redirect the user — the app should decide how to handle unauthenticated state.
      localStorage.removeItem("token");
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);
