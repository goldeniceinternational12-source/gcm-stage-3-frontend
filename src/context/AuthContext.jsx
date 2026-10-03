import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";
import authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(
    authService.getStoredStudent()
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const token = authService.getToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setStudent(response.data.student);

        localStorage.setItem(
          "gcm_student",
          JSON.stringify(response.data.student)
        );
      } catch (error) {
        console.error("Session verification failed:", error);

        authService.logout();
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const logout = () => {
    authService.logout();
    setStudent(null);
  };

  const value = {
    student,
    setStudent,
    loading,
    isAuthenticated: !!student && !!authService.getToken(),
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}