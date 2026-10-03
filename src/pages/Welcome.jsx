import { useNavigate } from "react-router-dom";
import "./Welcome.css";

import gcmLogo from "../assets/images/gcm-logo.png";

function Welcome() {
  const navigate = useNavigate();

  return (
    <main className="gcm-welcome">
      <div className="gcm-welcome-overlay"></div>

      <div className="gcm-welcome-content">
        <div className="gcm-welcome-logo">
          <img
            src={gcmLogo}
            alt="Global College of Missiology"
          />
        </div>

        <p className="gcm-welcome-label">
          GLOBAL COLLEGE OF MISSIOLOGY
        </p>

        <h1>
          Welcome to the
          <span> Academic Portal</span>
        </h1>

        <p className="gcm-welcome-description">
          Access the official academic platform of Global
          College of Missiology. Students can access their
          academic programmes, courses, lessons, assignments,
          attendance and results, while authorized administrators
          can manage the academic system.
        </p>

        <div className="gcm-portal-options">
          <button
            className="gcm-portal-card student"
            onClick={() => navigate("/student/login")}
          >
            <div className="gcm-portal-icon">
              🎓
            </div>

            <div className="gcm-portal-text">
              <span className="gcm-portal-small">
                STUDENT
              </span>

              <h2>Student Portal</h2>

              <p>
                Access your programme, courses, lessons,
                assignments, attendance, results and
                academic history.
              </p>
            </div>

            <span className="gcm-portal-arrow">
              →
            </span>
          </button>

          <button
            className="gcm-portal-card admin"
            onClick={() => navigate("/admin/login")}
          >
            <div className="gcm-portal-icon">
              🔐
            </div>

            <div className="gcm-portal-text">
              <span className="gcm-portal-small">
                AUTHORIZED ACCESS
              </span>

              <h2>Admin Portal</h2>

              <p>
                Authorized administrators can manage students,
                courses, lessons, attendance, results and
                academic operations.
              </p>
            </div>

            <span className="gcm-portal-arrow">
              →
            </span>
          </button>
        </div>

        <div className="gcm-welcome-footer">
          <span>
            Global College of Missiology
          </span>

          <span className="gcm-footer-dot">
            •
          </span>

          <span>
            Academic Year Portal
          </span>
        </div>
      </div>
    </main>
  );
}

export default Welcome;