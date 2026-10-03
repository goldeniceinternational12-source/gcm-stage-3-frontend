import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

function AdminLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !password) {
      setError(
        "Please enter your email address and password."
      );
      return;
    }

    try {
      setLoading(true);

      console.log(
        "Admin login request:",
        `${API_URL}/admin-auth/login`
      );

      const response = await fetch(
        `${API_URL}/admin-auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "Admin login response:",
        data
      );

      if (!response.ok) {
        setError(
          data?.message ||
            "Admin login failed."
        );

        return;
      }

      /*
       * Accept the common token response structures.
       */
      const token =
        data?.token ||
        data?.accessToken ||
        data?.admin?.token ||
        data?.admin?.accessToken ||
        data?.data?.token ||
        data?.data?.accessToken ||
        data?.data?.admin?.token ||
        data?.data?.admin?.accessToken;

      if (!token) {
        console.error(
          "Admin login succeeded but no token was found:",
          data
        );

        setError(
          "Login succeeded, but the authentication token was not returned by the server."
        );

        return;
      }

      /*
       * Save the admin token.
       */
      localStorage.setItem(
        "gcm_admin_token",
        token
      );

      /*
       * Save admin information.
       */
      const admin =
        data?.admin ||
        data?.data?.admin ||
        data?.user ||
        data?.data?.user ||
        null;

      if (admin) {
        localStorage.setItem(
          "gcm_admin",
          JSON.stringify(admin)
        );
      }

      console.log(
        "Admin token saved successfully."
      );

      console.log(
        "Redirecting to admin dashboard..."
      );

      /*
       * Redirect to dashboard.
       */
      navigate(
        "/admin/dashboard",
        {
          replace: true,
        }
      );
    } catch (loginError) {
      console.error(
        "Admin login request failed:",
        loginError
      );

      setError(
        loginError?.message ||
          "Unable to connect to the admin server."
      );
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate("/");
  };

  return (
    <main className="admin-login-page">

      <div className="admin-login-background">
        <div className="admin-login-glow admin-login-glow-one"></div>
        <div className="admin-login-glow admin-login-glow-two"></div>
        <div className="admin-login-rays"></div>
      </div>

      <section className="admin-login-container">

        {/* Logo */}
       

        {/* Heading */}
        <div className="admin-login-heading">

          <p className="admin-login-eyebrow">
            GLOBAL COLLEGE OF MISSIOLOGY
          </p>

          <h1>
            Administration Portal
          </h1>

          <div className="admin-login-divider">
            <span></span>

            <strong>
              ADMIN
            </strong>

            <span></span>
          </div>

          <p className="admin-login-description">
            Sign in to access the academic
            administration dashboard.
          </p>

        </div>

        {/* Login Card */}
        <div className="admin-login-card">

          <div className="admin-login-card-header">

            <div className="admin-login-icon">
              <span>
                AD
              </span>
            </div>

            <div>
              <p className="admin-login-card-label">
                SECURE ACCESS
              </p>

              <h2>
                Administrator Login
              </h2>
            </div>

          </div>

          {/* Error */}
          {error && (
            <div
              className="admin-login-error"
              role="alert"
            >
              <span className="admin-login-error-icon">
                !
              </span>

              <span>
                {error}
              </span>
            </div>
          )}

          <form
            className="admin-login-form"
            onSubmit={handleSubmit}
          >

            {/* Email */}
            <div className="admin-login-field">

              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter administrator email"
                autoComplete="username"
                disabled={loading}
                required
              />

            </div>

            {/* Password */}
            <div className="admin-login-field">

              <label htmlFor="password">
                Password
              </label>

              <div className="admin-password-wrapper">

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter administrator password"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  disabled={loading}
                >
                  {showPassword
                    ? "HIDE"
                    : "SHOW"}
                </button>

              </div>

            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="admin-login-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="admin-login-spinner"></span>

                  <span>
                    Signing in...
                  </span>
                </>
              ) : (
                <>
                  <span>
                    Sign In to Admin Portal
                  </span>

                  <span className="admin-login-arrow">
                    →
                  </span>
                </>
              )}

            </button>

          </form>

          {/* Back */}
          <button
            type="button"
            className="admin-login-back-button"
            onClick={goBack}
            disabled={loading}
          >
            <span>
              ←
            </span>

            <span>
              Back to Portal Selection
            </span>
          </button>

        </div>

        {/* Security */}
        <div className="admin-login-security">

          <span className="admin-security-icon">
            🔒
          </span>

          <div>

            <strong>
              Secure Administration Access
            </strong>

            <p>
              This area is restricted to authorized
              Global College of Missiology administrators.
            </p>

          </div>

        </div>

        {/* Footer */}
        <footer className="admin-login-footer">

          <div className="admin-footer-line"></div>

          <p>
            Secure Academic Management System
          </p>

          <span>
            © {new Date().getFullYear()} Global College of Missiology
          </span>

        </footer>

      </section>

    </main>
  );
}

export default AdminLogin;