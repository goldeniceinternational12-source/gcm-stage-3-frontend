import api from "./api";

const login = async (matricNumber, password) => {
  const response = await api.post("/auth/login", {
    matricNumber,
    password,
  });

  if (response.data.token) {
    localStorage.setItem("gcm_student_token", response.data.token);
    localStorage.setItem(
      "gcm_student",
      JSON.stringify(response.data.student)
    );
  }

  return response.data;
};

const logout = () => {
  localStorage.removeItem("gcm_student_token");
  localStorage.removeItem("gcm_student");
};

const getStoredStudent = () => {
  const student = localStorage.getItem("gcm_student");

  if (!student) {
    return null;
  }

  try {
    return JSON.parse(student);
  } catch {
    return null;
  }
};

const getToken = () => {
  return localStorage.getItem("gcm_student_token");
};

export default {
  login,
  logout,
  getStoredStudent,
  getToken,
};