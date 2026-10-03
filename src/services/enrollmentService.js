import api from "./api";

const enrollmentService = {
  // Get the student's current academic enrollment
  getCurrentEnrollment: async () => {
    const response = await api.get(
      "/academic-enrollments/current"
    );

    return response.data;
  },

  // Get the student's complete academic history
  getAcademicHistory: async () => {
    const response = await api.get(
      "/academic-enrollments/history"
    );

    return response.data;
  },
};

export default enrollmentService;

