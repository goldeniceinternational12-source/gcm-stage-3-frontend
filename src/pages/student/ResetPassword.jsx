import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import gcmLogo from "../../assets/images/gcm-logo.png";
import "./ResetPassword.css";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";

  const [matricNumber, setMatricNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSuccess("");
    setError("");

    if (!token) {
      setError(
        "This password reset link is invalid or has expired. Please request a new reset link."
      );
      return;
    }

    const matric = matricNumber.trim().toUpperCase();

    if (!matric) {
      setError("Please enter your matric number.");
      return;
    }

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/reset-password", {
        token,
        matricNumber: matric,
        newPassword,
      });

      if (!response.data?.success) {
        setError(
          response.data?.message ||
            "Unable to reset your password. Please try again."
        );
        return;
      }

      setSuccess(
        response.data?.message ||
          "Your password has been reset successfully."
      );

      setMatricNumber("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/student/login", {
          replace: true,
        });
      }, 2500);
    } catch (err) {
      console.error("Password reset error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to reset your password. Please request a new reset link."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-card">

        <div className="reset-password-brand">
          <img
            src={gcmLogo}
            alt="Global College of Missiology"
            className="reset-password-logo"
          />

          <div className="reset-password-brand-text">
            <h1>Global College of Missiology</h1>
            <p>Student Academic Portal</p>
          </div>
        </div>

        <div className="reset-password-content">

          <span className="reset-password-eyebrow">
            ACCOUNT RECOVERY
          </span>

          <h2>Create New Password</h2>

          <p className="reset-password-intro">
            Enter your official matric number and create
            a new password for your student account.
          </p>

          {!token && (
            <div
              className="reset-password-message error"
              role="alert"
            >
              This password reset link is missing or invalid.
              Please request a new reset link.
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
          >

            <div className="reset-password-field">
              <label htmlFor="resetMatricNumber">
                Matric Number
              </label>

              <input
                id="resetMatricNumber"
                type="text"
                value={matricNumber}
                onChange={(event) =>
                  setMatricNumber(event.target.value)
                }
                placeholder="Enter your matric number"
                autoComplete="username"
                autoCapitalize="characters"
                disabled={loading || !token}
              />
            </div>

            <div className="reset-password-field">
              <label htmlFor="newPassword">
                New Password
              </label>

              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                placeholder="Enter your new password"
                autoComplete="new-password"
                disabled={loading || !token}
              />
            </div>

            <div className="reset-password-field">
              <label htmlFor="confirmPassword">
                Confirm New Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Confirm your new password"
                autoComplete="new-password"
                disabled={loading || !token}
              />
            </div>

            <div className="reset-password-requirements">
              <strong>Password requirements</strong>

              <ul>
                <li>Minimum 8 characters</li>
                <li>Must be different from your previous password</li>
                <li>Your matric number must match your student account</li>
              </ul>
            </div>

            {error && token && (
              <div
                className="reset-password-message error"
                role="alert"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="reset-password-message success"
                role="status"
              >
                {success}

                <div className="reset-password-redirect">
                  Redirecting you to student login...
                </div>
              </div>
            )}

            <button
              type="submit"
              className="reset-password-button"
              disabled={loading || !token}
            >
              {loading
                ? "Resetting Password..."
                : "Reset Password"}
            </button>
          </form>

          <div className="reset-password-security">
            <strong>Secure password recovery</strong>

            <p>
              This reset link is temporary and can only be
              used once. Your matric number is also required
              before the password can be changed.
            </p>
          </div>

          <Link
            to="/student/login"
            className="reset-password-back"
          >
            ← Back to Student Login
          </Link>

        </div>

        <div className="reset-password-footer">
          © {new Date().getFullYear()} Global College of Missiology
        </div>

      </div>
    </div>
  );
}

export default ResetPassword;