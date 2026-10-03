import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import gcmLogo from "../../assets/images/gcm-logo.png";
import "./AcademicCalendar.css";

const formatDate = (date) => {
  if (!date) return "—";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "—";
  }

  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatLongDate = (date) => {
  if (!date) return "—";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "—";
  }

  return value.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const addDays = (date, days) => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
};

const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getStatus = (startDate, endDate) => {
  const today = getToday();

  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (today < start) return "UPCOMING";
  if (today > end) return "COMPLETED";

  return "CURRENT";
};

const getStatusLabel = (status) => {
  if (status === "CURRENT") return "Current";
  if (status === "COMPLETED") return "Completed";
  if (status === "UPCOMING") return "Upcoming";

  return status || "—";
};

const getStatusClass = (status) => {
  if (status === "CURRENT") return "current";
  if (status === "COMPLETED") return "completed";
  if (status === "UPCOMING") return "upcoming";

  return "";
};

function AcademicCalendar() {
  const navigate = useNavigate();

  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const student = useMemo(() => {
    try {
      const saved = localStorage.getItem("gcm_student");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("gcm_student_token");
    localStorage.removeItem("gcm_student");
    navigate("/student/login", { replace: true });
  };

  const loadCalendar = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("gcm_student_token");

      if (!token) {
        navigate("/student/login", { replace: true });
        return;
      }

      const response = await api.get(
        "/academic-enrollments/current"
      );

      const data = response?.data || {};

      if (!data.enrollment) {
        throw new Error(
          data.message ||
            "No active academic enrollment was found."
        );
      }

      setEnrollment(data.enrollment);
    } catch (err) {
      console.error("Academic calendar error:", err);

      if (
        err?.response?.status === 401 ||
        err?.response?.status === 403
      ) {
        logout();
        return;
      }

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load calendar."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, []);

  const calendar = useMemo(() => {
    if (!enrollment?.startDate) return null;

    const programmeStart = new Date(
      enrollment.startDate
    );

    if (Number.isNaN(programmeStart.getTime())) {
      return null;
    }

    programmeStart.setHours(0, 0, 0, 0);

    const semester1Start = programmeStart;
    const semester1End = addDays(semester1Start, 29);

    const semester2Start = addDays(semester1Start, 30);
    const semester2End = addDays(semester2Start, 29);

    const today = getToday();

    let programmeStatus = "UPCOMING";

    if (
      today >= semester1Start &&
      today <= semester2End
    ) {
      programmeStatus = "IN_PROGRESS";
    }

    if (today > semester2End) {
      programmeStatus = "COMPLETED";
    }

    const semester1Status = getStatus(
      semester1Start,
      semester1End
    );

    const semester2Status = getStatus(
      semester2Start,
      semester2End
    );

    let currentSemester = enrollment.semester || 1;

    if (semester1Status === "CURRENT") {
      currentSemester = 1;
    }

    if (semester2Status === "CURRENT") {
      currentSemester = 2;
    }

    const totalDays = 60;

    const elapsedDays = Math.max(
      0,
      Math.min(
        totalDays,
        Math.floor(
          (today.getTime() -
            semester1Start.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      )
    );

    const progress =
      programmeStatus === "COMPLETED"
        ? 100
        : Math.round(
            (elapsedDays / totalDays) * 100
          );

    const daysRemaining = Math.max(
      0,
      Math.ceil(
        (semester2End.getTime() -
          today.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    return {
      programmeStart: semester1Start,
      programmeEnd: semester2End,
      semester1Start,
      semester1End,
      semester2Start,
      semester2End,
      semester1Status,
      semester2Status,
      programmeStatus,
      currentSemester,
      elapsedDays,
      progress: Math.min(100, Math.max(0, progress)),
      daysRemaining,
    };
  }, [enrollment]);

  const programmeName =
    enrollment?.programme ||
    student?.programme ||
    "Global College of Missiology";

  const academicYear =
    enrollment?.academicYear || "—";

  const studentName =
    enrollment?.student?.fullName ||
    enrollment?.student?.name ||
    student?.fullName ||
    student?.name ||
    "Student";

  if (loading) {
    return (
      <div className="academic-calendar-page">
        <header className="academic-header">
          <div className="academic-brand">
            <img
              src={gcmLogo}
              alt="Global College of Missiology"
            />

            <div>
              <span>GLOBAL COLLEGE OF</span>
              <strong>MISSIOLOGY</strong>
            </div>
          </div>
        </header>

        <main className="calendar-loading">
          <div className="calendar-spinner" />

          <h2>Loading Academic Calendar</h2>

          <p>
            Preparing your academic calendar...
          </p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="academic-calendar-page">
        <header className="academic-header">
          <div className="academic-brand">
            <img
              src={gcmLogo}
              alt="Global College of Missiology"
            />

            <div>
              <span>GLOBAL COLLEGE OF</span>
              <strong>MISSIOLOGY</strong>
            </div>
          </div>

          <div className="header-user">
            <span>{studentName}</span>

            <button onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <main className="calendar-content">
          <Link
            to="/student/dashboard"
            className="calendar-back"
          >
            ← Back to Dashboard
          </Link>

          <section className="calendar-error">
            <div className="error-symbol">!</div>

            <h1>Unable to load calendar</h1>

            <p>{error}</p>

            <button
              className="gold-button"
              onClick={loadCalendar}
            >
              Try Again
            </button>
          </section>
        </main>
      </div>
    );
  }

  if (!enrollment || !calendar) {
    return (
      <div className="academic-calendar-page">
        <header className="academic-header">
          <div className="academic-brand">
            <img
              src={gcmLogo}
              alt="Global College of Missiology"
            />

            <div>
              <span>GLOBAL COLLEGE OF</span>
              <strong>MISSIOLOGY</strong>
            </div>
          </div>
        </header>

        <main className="calendar-content">
          <Link
            to="/student/dashboard"
            className="calendar-back"
          >
            ← Back to Dashboard
          </Link>

          <section className="calendar-empty">
            <div className="empty-symbol">◷</div>

            <h1>Academic Calendar</h1>

            <p>
              Your academic calendar will appear
              automatically when your academic
              enrollment begins.
            </p>

            <span>
              No active academic enrollment is
              currently available.
            </span>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="academic-calendar-page">
      <header className="academic-header">
        <div className="academic-brand">
          <img
            src={gcmLogo}
            alt="Global College of Missiology"
          />

          <div>
            <span>GLOBAL COLLEGE OF</span>
            <strong>MISSIOLOGY</strong>
          </div>
        </div>

        <div className="header-user">
          <div>
            <strong>{studentName}</strong>
            <small>Student Portal</small>
          </div>

          <button onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <div className="calendar-layout">
        <aside className="calendar-sidebar">
          <div className="sidebar-title">
            STUDENT PORTAL
          </div>

          <nav>
            <Link to="/student/dashboard">
              Dashboard
            </Link>

            <Link to="/student/programme">
              My Programme
            </Link>

            <Link
              to="/student/calendar"
              className="active"
            >
              Academic Calendar
            </Link>

            <Link to="/student/courses">
              Courses
            </Link>

            <Link to="/student/assignments">
              Assignments
            </Link>

            <Link to="/student/attendance">
              Attendance
            </Link>

            <Link to="/student/results">
              Results
            </Link>

            <Link to="/student/academic-history">
              Academic History
            </Link>

            <Link to="/student/announcements">
              Announcements
            </Link>
          </nav>
        </aside>

        <main className="calendar-main">
          <Link
            to="/student/dashboard"
            className="calendar-back"
          >
            ← Back to Dashboard
          </Link>

          <section className="calendar-title">
            <div>
              <span className="eyebrow">
                ACADEMIC MANAGEMENT
              </span>

              <h1>Academic Calendar</h1>

              <p>
                Your academic calendar is generated
                automatically from your academic
                enrollment.
              </p>
            </div>

            <div
              className={`programme-status ${getStatusClass(
                calendar.programmeStatus ===
                  "IN_PROGRESS"
                  ? "CURRENT"
                  : calendar.programmeStatus
              )}`}
            >
              {calendar.programmeStatus ===
              "IN_PROGRESS"
                ? "In Progress"
                : getStatusLabel(
                    calendar.programmeStatus
                  )}
            </div>
          </section>

          <section className="programme-card">
            <div className="programme-logo">
              <img
                src={gcmLogo}
                alt="GCM"
              />
            </div>

            <div className="programme-details">
              <span className="card-label">
                PROGRAMME
              </span>

              <h2>{programmeName}</h2>

              <div className="programme-meta">
                <div>
                  <span>Academic Year</span>
                  <strong>
                    {academicYear}
                  </strong>
                </div>

                <div>
                  <span>Programme Start</span>
                  <strong>
                    {formatDate(
                      calendar.programmeStart
                    )}
                  </strong>
                </div>

                <div>
                  <span>Programme End</span>
                  <strong>
                    {formatDate(
                      calendar.programmeEnd
                    )}
                  </strong>
                </div>

                <div>
                  <span>Current Semester</span>
                  <strong>
                    Semester{" "}
                    {calendar.currentSemester}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <section className="progress-card">
            <div className="progress-heading">
              <div>
                <span className="card-label">
                  PROGRAMME PROGRESS
                </span>

                <h3>
                  {calendar.elapsedDays} of 60
                  academic days
                </h3>
              </div>

              <strong>
                {calendar.progress}%
              </strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-bar"
                style={{
                  width: `${calendar.progress}%`,
                }}
              />
            </div>

            <div className="progress-dates">
              <span>
                Start:{" "}
                {formatDate(
                  calendar.programmeStart
                )}
              </span>

              <span>
                End:{" "}
                {formatDate(
                  calendar.programmeEnd
                )}
              </span>
            </div>
          </section>

          <section className="semester-grid">
            <article
              className={`semester-card ${
                calendar.semester1Status ===
                "CURRENT"
                  ? "semester-active"
                  : ""
              }`}
            >
              <div className="semester-top">
                <div className="semester-number">
                  01
                </div>

                <span
                  className={`semester-badge ${getStatusClass(
                    calendar.semester1Status
                  )}`}
                >
                  {getStatusLabel(
                    calendar.semester1Status
                  )}
                </span>
              </div>

              <span className="semester-label">
                FIRST SEMESTER
              </span>

              <h2>Semester 1</h2>

              <p>
                The first 30-day academic period of
                your annual programme.
              </p>

              <div className="semester-date-box">
                <div>
                  <span>Begins</span>

                  <strong>
                    {formatLongDate(
                      calendar.semester1Start
                    )}
                  </strong>
                </div>

                <div>
                  <span>Ends</span>

                  <strong>
                    {formatLongDate(
                      calendar.semester1End
                    )}
                  </strong>
                </div>
              </div>

              <div className="semester-duration">
                <span>Duration</span>
                <strong>30 Days</strong>
              </div>
            </article>

            <article
              className={`semester-card ${
                calendar.semester2Status ===
                "CURRENT"
                  ? "semester-active"
                  : ""
              }`}
            >
              <div className="semester-top">
                <div className="semester-number">
                  02
                </div>

                <span
                  className={`semester-badge ${getStatusClass(
                    calendar.semester2Status
                  )}`}
                >
                  {getStatusLabel(
                    calendar.semester2Status
                  )}
                </span>
              </div>

              <span className="semester-label">
                SECOND SEMESTER
              </span>

              <h2>Semester 2</h2>

              <p>
                The second 30-day academic period
                completes your one-year programme.
              </p>

              <div className="semester-date-box">
                <div>
                  <span>Begins</span>

                  <strong>
                    {formatLongDate(
                      calendar.semester2Start
                    )}
                  </strong>
                </div>

                <div>
                  <span>Ends</span>

                  <strong>
                    {formatLongDate(
                      calendar.semester2End
                    )}
                  </strong>
                </div>
              </div>

              <div className="semester-duration">
                <span>Duration</span>
                <strong>30 Days</strong>
              </div>
            </article>
          </section>

          <section className="timeline-card">
            <div className="timeline-heading">
              <div>
                <span className="card-label">
                  ACADEMIC YEAR TIMELINE
                </span>

                <h2>Programme Schedule</h2>
              </div>

              <span className="automatic-badge">
                Automatically Generated
              </span>
            </div>

            <div className="timeline">
              <div
                className={`timeline-item ${
                  calendar.programmeStatus !==
                  "UPCOMING"
                    ? "done"
                    : ""
                }`}
              >
                <div className="timeline-marker">
                  1
                </div>

                <div>
                  <span>PROGRAMME START</span>

                  <strong>
                    {formatLongDate(
                      calendar.programmeStart
                    )}
                  </strong>

                  <p>
                    Your annual academic programme
                    begins.
                  </p>
                </div>
              </div>

              <div
                className={`timeline-item ${
                  calendar.semester1Status ===
                  "COMPLETED"
                    ? "done"
                    : calendar.semester1Status ===
                      "CURRENT"
                    ? "now"
                    : ""
                }`}
              >
                <div className="timeline-marker">
                  2
                </div>

                <div>
                  <span>SEMESTER 1</span>

                  <strong>
                    {formatDate(
                      calendar.semester1Start
                    )}{" "}
                    —{" "}
                    {formatDate(
                      calendar.semester1End
                    )}
                  </strong>

                  <p>
                    First 30-day academic semester.
                  </p>
                </div>
              </div>

              <div
                className={`timeline-item ${
                  calendar.semester2Status ===
                  "COMPLETED"
                    ? "done"
                    : calendar.semester2Status ===
                      "CURRENT"
                    ? "now"
                    : ""
                }`}
              >
                <div className="timeline-marker">
                  3
                </div>

                <div>
                  <span>SEMESTER 2</span>

                  <strong>
                    {formatDate(
                      calendar.semester2Start
                    )}{" "}
                    —{" "}
                    {formatDate(
                      calendar.semester2End
                    )}
                  </strong>

                  <p>
                    Second 30-day academic semester.
                  </p>
                </div>
              </div>

              <div
                className={`timeline-item ${
                  calendar.programmeStatus ===
                  "COMPLETED"
                    ? "done"
                    : ""
                }`}
              >
                <div className="timeline-marker">
                  4
                </div>

                <div>
                  <span>
                    PROGRAMME COMPLETION
                  </span>

                  <strong>
                    {formatLongDate(
                      calendar.programmeEnd
                    )}
                  </strong>

                  <p>
                    Completion of the full academic
                    year.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="calendar-info-grid">
            <div className="info-card">
              <div className="info-icon">◷</div>

              <div>
                <span>DAYS REMAINING</span>

                <strong>
                  {calendar.daysRemaining}
                </strong>

                <p>
                  Days remaining in the annual
                  programme.
                </p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">✓</div>

              <div>
                <span>ACADEMIC STRUCTURE</span>

                <strong>
                  1 Year / 2 Semesters
                </strong>

                <p>
                  One annual enrollment containing
                  two 30-day semesters.
                </p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">$</div>

              <div>
                <span>ENROLLMENT</span>

                <strong>
                  One Academic Year
                </strong>

                <p>
                  Your enrollment covers the complete
                  academic year.
                </p>
              </div>
            </div>
          </section>

          <section className="calendar-note">
            <div className="note-icon">i</div>

            <div>
              <strong>
                Your academic calendar is automatic
              </strong>

              <p>
                The dates on this page are generated
                from your official academic enrollment
                start date. You do not need to manually
                configure or open your calendar.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default AcademicCalendar;