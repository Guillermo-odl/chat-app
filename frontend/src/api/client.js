import axios from "axios";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

const apiClient = axios.create({
  baseURL: SERVER_URL,
  withCredentials: true,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

export { SERVER_URL };
export default apiClient;
