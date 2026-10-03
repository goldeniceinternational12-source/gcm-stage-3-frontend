import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import gcmLogo from "../../assets/images/gcm-logo.png";
import "./Assignments.css";

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/assignments/current");

        setAssignments(response.data.assignments || []);
      } catch (err) {
        console.error("Assignments error:", err);

        if (err.response?.status === 401) {
          localStorage.removeItem("gcm_student_token");
          localStorage.removeItem("gcm_student");
          window.location.href = "/student/login";
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load assignments."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, []);

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatus = (assignment) => {
    if (!assignment.dueDate) {
      return "No due date";
    }

    const now = new Date();
    const dueDate = new Date(assignment.dueDate);

    if (dueDate < now) {
      return "Past Due";
    }

    const difference =
      dueDate.getTime() - now.getTime();

    const daysRemaining = Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining <= 2) {
      return `${daysRemaining} day${
        daysRemaining === 1 ? "" : "s"
      } left`;
    }

    return `${daysRemaining} days left`;
  };

  const getStatusClass = (assignment) => {
    if (!assignment.dueDate) return "";

    const now = new Date();
    const dueDate = new Date(assignment.dueDate);

    if (dueDate < now) {
      return "past-due";
    }

    const difference =
      dueDate.getTime() - now.getTime();

    const daysRemaining = Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining <= 2) {
      return "urgent";
    }

    return "upcoming";
  };

  return (
    <div className="assignments-page">
      <header className="assignments-header">
        <div className="assignments-header-inner">
          <Link
            to="/student/dashboard"
            className="assignments-logo"
          >
            <img
              src={gcmLogo}
              alt="Global College of Missiology"
            />
          </Link>

          <div className="assignments-header-title">
            <span>GCM STUDENT PORTAL</span>
            <strong>Assignments</strong>
          </div>

          <Link
            to="/student/dashboard"
            className="assignments-dashboard-link"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="assignments-main">
        <section className="assignments-hero">
          <div>
            <span className="assignments-eyebrow">
              ACADEMIC WORK
            </span>

            <h1>Assignments</h1>

            <p>
              View assignments published for your current
              academic year and semester.
            </p>
          </div>

          <div className="assignments-count">
            <span>Published Assignments</span>
            <strong>{assignments.length}</strong>
          </div>
        </section>

        {loading && (
          <section className="assignments-state">
            <div className="assignments-spinner"></div>
            <p>Loading assignments...</p>
          </section>
        )}

        {!loading && error && (
          <section className="assignments-state assignments-error">
            <h2>Unable to Load Assignments</h2>
            <p>{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </section>
        )}

        {!loading &&
          !error &&
          assignments.length === 0 && (
            <section className="assignments-state">
              <div className="assignments-empty-icon">
                ✦
              </div>

              <h2>No Assignments Yet</h2>

              <p>
                No assignments have been published for your
                current courses yet.
              </p>
            </section>
          )}

        {!loading &&
          !error &&
          assignments.length > 0 && (
            <section className="assignments-list">
              {assignments.map((assignment) => (
                <article
                  className="assignment-card"
                  key={assignment._id}
                >
                  <div className="assignment-card-top">
                    <div className="assignment-course">
                      {assignment.course?.courseCode ||
                        "Course"}
                    </div>

                    <span
                      className={`assignment-status ${getStatusClass(
                        assignment
                      )}`}
                    >
                      {getStatus(assignment)}
                    </span>
                  </div>

                  <div className="assignment-card-content">
                    <h2>{assignment.title}</h2>

                    <h3>
                      {assignment.course?.title ||
                        "Course assignment"}
                    </h3>

                    <p>{assignment.instructions}</p>

                    <div className="assignment-details">
                      <div>
                        <span>Issued</span>
                        <strong>
                          {formatDate(
                            assignment.issueDate
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Due Date</span>
                        <strong>
                          {formatDate(
                            assignment.dueDate
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Total Marks</span>
                        <strong>
                          {assignment.totalMarks}
                        </strong>
                      </div>
                    </div>

                    {assignment.attachmentUrl && (
                      <a
                        href={assignment.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="assignment-attachment"
                      >
                        View Attachment
                      </a>
                    )}

                    {assignment.notes && (
                      <div className="assignment-notes">
                        <strong>Note:</strong>{" "}
                        {assignment.notes}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}
      </main>

      <footer className="assignments-footer">
        <p>
          © {new Date().getFullYear()} Global College of Missiology
        </p>
      </footer>
    </div>
  );
}

export default Assignments;