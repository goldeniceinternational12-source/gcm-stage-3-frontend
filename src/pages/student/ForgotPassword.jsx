import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import gcmLogo from "../../assets/images/gcm-logo.png";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSuccess("");
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your registered student email.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/forgot-password", {
        email: normalizedEmail,
      });

      if (!response.data?.success) {
        setError(
          response.data?.message ||
            "Unable to process your request. Please try again."
        );
        return;
      }

      setSuccess(
        response.data?.message ||
          "If a student account exists for that email, a password reset link has been sent."
      );

      setEmail("");
    } catch (err) {
      console.error("Forgot password error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to process your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">

        <div className="forgot-password-brand">
          <img
            src={gcmLogo}
            alt="Global College of Missiology"
            className="forgot-password-logo"
          />

          <div className="forgot-password-brand-text">
            <h1>Global College of Missiology</h1>
            <p>Student Academic Portal</p>
          </div>
        </div>

        <div className="forgot-password-content">

          <span className="forgot-password-eyebrow">
            ACCOUNT RECOVERY
          </span>

          <h2>Forgot Password?</h2>

          <p className="forgot-password-intro">
            Enter the email address registered to your
            student account. If the account exists, a
            temporary password reset link will be sent.
          </p>

          <form
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="forgot-password-field">
              <label htmlFor="forgotPasswordEmail">
                Registered Email
              </label>

              <input
                id="forgotPasswordEmail"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your registered email"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {error && (
              <div
                className="forgot-password-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="forgot-password-success"
                role="status"
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              className="forgot-password-button"
              disabled={loading}
            >
              {loading
                ? "Sending Reset Link..."
                : "Send Reset Link"}
            </button>
          </form>

          <div className="forgot-password-info">
            <strong>Secure password recovery</strong>

            <p>
              For security, the system does not reveal
              whether an email belongs to a student account.
              Reset links are temporary and can only be used
              once.
            </p>
          </div>

          <Link
            to="/student/login"
            className="forgot-password-back"
          >
            ← Back to Student Login
          </Link>

        </div>

        <div className="forgot-password-footer">
          © {new Date().getFullYear()} Global College of Missiology
        </div>

      </div>
    </div>
  );
}

export default ForgotPassword;