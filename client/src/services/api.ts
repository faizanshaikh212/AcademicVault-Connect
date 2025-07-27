import axios from "axios";

// Create an Axios instance with a base URL for our backend
const api = axios.create({
  baseURL: "http://localhost:5001/api", // The base URL of your backend server
});

// Add a request interceptor to include the auth token in every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
