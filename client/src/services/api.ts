import axios, { InternalAxiosRequestConfig } from "axios";

// Function to get the current token
const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Create an Axios instance with a base URL for our backend
const api = axios.create({
  baseURL: "http://localhost:5001/api", // The base URL of your backend server
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
