import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8087",
});

// Attach API key from localStorage on every request
api.interceptors.request.use((config) => {
  const key =
    typeof window !== "undefined"
      ? localStorage.getItem("api_key") || process.env.NEXT_PUBLIC_API_KEY || ""
      : process.env.NEXT_PUBLIC_API_KEY || "";

  config.headers["X-API-Key"] = key;

  // Only set JSON content-type if not FormData
  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

export default api;