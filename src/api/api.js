// import axios from "axios";

// const API_BASE =
//   import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// const api = axios.create({
//   baseURL: `${API_BASE}/api`,
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     if (err.response?.status === 401) {
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");
//       window.location.href = "/login";
//     }
//     return Promise.reject(err);
//   }
// );

// export default api;

// src/api/api.ts
import axios from "axios";

/* ================= BASE CONFIG ================= */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/* ================= AXIOS INSTANCE ================= */
const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

/* ================= TOKEN INTERCEPTOR ================= */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ================= 401 HANDLING ================= */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;