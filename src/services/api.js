import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5001/api",

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 15000,
});

/*
|--------------------------------------------------------------------------
| Authentication Token Selection
|--------------------------------------------------------------------------
|
| STUDENT PORTAL
|   /student/...
|   -> gcm_student_token
|
| ADMIN PORTAL
|   /admin/...
|   -> gcm_admin_token
|
*/

api.interceptors.request.use(
  (config) => {
    const adminToken =
      localStorage.getItem("gcm_admin_token");

    const studentToken =
      localStorage.getItem("gcm_student_token");

    const currentPath =
      window.location.pathname.toLowerCase();

    const isAdminPortal =
      currentPath.startsWith("/admin");

    const isStudentPortal =
      currentPath.startsWith("/student");

    let token = null;

    if (isAdminPortal) {
      token = adminToken;
    } else if (isStudentPortal) {
      token = studentToken;
    } else {
      token =
        studentToken ||
        adminToken;
    }

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

/*
|--------------------------------------------------------------------------
| Authentication Error Handling
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      console.warn(
        "Authentication required or session expired."
      );
    }

    if (error.response?.status === 403) {
      console.warn(
        "Authenticated account does not have permission for this resource."
      );
    }

    return Promise.reject(error);
  }
);

export default api;