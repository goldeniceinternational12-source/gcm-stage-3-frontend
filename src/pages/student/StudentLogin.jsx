import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import gcmLogo from "../../assets/images/gcm-logo.png";
import "./StudentLogin.css";

function StudentLogin() {
  const navigate = useNavigate();

  const [matricNumber, setMatricNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const matric = matricNumber.trim();
    const pass = password;

    if (!matric || !pass) {
      setError("Please enter your matric number and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        matricNumber: matric,
        password: pass,
      });

      const data = response.data;

      if (!data?.success || !data?.token) {
        setError(
          data?.message || "Unable to sign in. Please try again."
        );
        return;
      }

      localStorage.setItem("gcm_student_token", data.token);

      if (data.student) {
        localStorage.setItem(
          "gcm_student",
          JSON.stringify(data.student)
        );
      }

      navigate("/student/dashboard", { replace: true });
    } catch (err) {
      console.error("Student login error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to sign in. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-login-page">

      <div className="student-login-glow student-login-glow-one"></div>
      <div className="student-login-glow student-login-glow-two"></div>

      <div className="student-login-card">

        {/* Brand */}
        <div className="student-login-brand">

          <div className="student-login-logo-wrapper">
            <img
              src={gcmLogo}
              alt="Global College of Missiology"
              className="student-login-logo"
            />
          </div>

          <div className="student-login-brand-text">
            <h1>Global College of Missiology</h1>
            <p>Student Academic Portal</p>
          </div>

        </div>


        {/* Login Content */}
        <div className="student-login-content">

          <span className="student-login-eyebrow">
            STUDENT ACCESS
          </span>

          <h2>
            Welcome Back
          </h2>

          <p className="student-login-intro">
            Sign in using your official matric number and
            student portal password.
          </p>


          <form onSubmit={handleSubmit} noValidate>

            {/* Matric Number */}
            <div className="student-login-field">

              <label htmlFor="matricNumber">
                Matric Number
              </label>

              <input
                id="matricNumber"
                type="text"
                value={matricNumber}
                onChange={(event) =>
                  setMatricNumber(event.target.value)
                }
                placeholder="Enter your matric number"
                autoComplete="username"
                autoCapitalize="characters"
                disabled={loading}
              />

            </div>


            {/* Password */}
            <div className="student-login-field">

              <label htmlFor="studentPassword">
                Password
              </label>

              <input
                id="studentPassword"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />

            </div>


            {/* Forgot Password */}
            <div className="student-login-forgot-wrapper">

              <Link
                to="/student/forgot-password"
                className="student-login-forgot"
              >
                Forgot Password?
              </Link>

            </div>


            {/* Error */}
            {error && (
              <div
                className="student-login-error"
                role="alert"
              >
                {error}
              </div>
            )}


            {/* Submit */}
            <button
              type="submit"
              className="student-login-button"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

          </form>


          {/* Account Information */}
          <div className="student-login-info">

            <strong>
              Student account access
            </strong>

            <p>
              Your student account and matric number are
              issued by Global College of Missiology. If
              you have not received your login details,
              please contact the administrator.
            </p>

          </div>

        </div>


        {/* Footer */}
        <div className="student-login-footer">
          © {new Date().getFullYear()} Global College of Missiology
        </div>

      </div>

    </div>
  );
}

export default StudentLogin;

