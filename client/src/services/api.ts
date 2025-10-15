import axios, { InternalAxiosRequestConfig } from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const getAuthToken = () => localStorage.getItem("token");

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    if (!(config.data instanceof FormData)) {
      config.headers.set("Content-Type", "application/json");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || originalRequest.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.set("Authorization", `Bearer ${token}`);
          return api(originalRequest);
        })
        .catch((refreshError) => Promise.reject(refreshError));
    }

    isRefreshing = true;
    try {
      const response = await axios.post<{ token?: string }>(
        `${API_BASE_URL}/auth/refresh`,
        null,
        { withCredentials: true }
      );
      const token = response.data?.token;

      if (!token) {
        const refreshError = new Error("No token returned from refresh");
        processQueue(refreshError);
        localStorage.removeItem("token");
        return Promise.reject(refreshError);
      }

      localStorage.setItem("token", token);
      processQueue(null, token);
      originalRequest.headers.set("Authorization", `Bearer ${token}`);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      localStorage.removeItem("token");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
