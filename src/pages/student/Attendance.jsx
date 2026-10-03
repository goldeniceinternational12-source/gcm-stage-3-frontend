import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import gcmLogo from "../../assets/images/gcm-logo.png";
import "./Attendance.css";

function Attendance() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendancePercentage: 0,
  });

  const [academicYear, setAcademicYear] = useState("");
  const [programme, setProgramme] = useState("");
  const [semester, setSemester] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem(
      "gcm_student_token"
    );

    if (!token) {
      navigate("/student/login", {
        replace: true,
      });

      return;
    }

    loadAttendance();
  }, [navigate]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError("");

      const [studentResponse, attendanceResponse] =
        await Promise.all([
          api.get("/auth/me"),
          api.get("/attendance/current"),
        ]);

      const studentData =
        studentResponse.data?.student ||
        studentResponse.data?.data?.student ||
        studentResponse.data?.data ||
        null;

      const attendanceData =
        attendanceResponse.data || {};

      setStudent(studentData);

      setAcademicYear(
        attendanceData.academicYear || ""
      );

      setProgramme(
        attendanceData.programme || ""
      );

      setSemester(
        attendanceData.semester || ""
      );

      setAttendance(
        Array.isArray(
          attendanceData.attendance
        )
          ? attendanceData.attendance
          : []
      );

      setSummary(
        attendanceData.summary || {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          attendancePercentage: 0,
        }
      );
    } catch (err) {
      console.error(
        "Attendance loading error:",
        err
      );

      if (err.response?.status === 401) {
        localStorage.removeItem(
          "gcm_student_token"
        );

        localStorage.removeItem(
          "gcm_student"
        );

        navigate("/student/login", {
          replace: true,
        });

        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load your attendance."
      );
    } finally {
      setLoading(false);
    }
  };

  const courseSummary = useMemo(() => {
    const map = {};

    attendance.forEach((record) => {
      const courseId =
        record.course?._id ||
        record.course?.id ||
        record.course ||
        "unknown";

      if (!map[courseId]) {
        map[courseId] = {
          courseCode:
            record.course?.courseCode ||
            "Course",
          title:
            record.course?.title ||
            "Course",
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        };
      }

      map[courseId].total += 1;

      if (record.status === "PRESENT") {
        map[courseId].present += 1;
      }

      if (record.status === "ABSENT") {
        map[courseId].absent += 1;
      }

      if (record.status === "LATE") {
        map[courseId].late += 1;
      }

      if (record.status === "EXCUSED") {
        map[courseId].excused += 1;
      }
    });

    return Object.values(map).map(
      (course) => ({
        ...course,
        percentage:
          course.total > 0
            ? (
                ((course.present +
                  course.late) /
                  course.total) *
                100
              ).toFixed(1)
            : "0.0",
      })
    );
  }, [attendance]);

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "PRESENT":
        return "Present";

      case "ABSENT":
        return "Absent";

      case "LATE":
        return "Late";

      case "EXCUSED":
        return "Excused";

      default:
        return status || "Unknown";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "PRESENT":
        return "attendance-status-present";

      case "ABSENT":
        return "attendance-status-absent";

      case "LATE":
        return "attendance-status-late";

      case "EXCUSED":
        return "attendance-status-excused";

      default:
        return "";
    }
  };

  const percentage =
    Number(summary.attendancePercentage) || 0;

  return (
    <div className="attendance-page">
      <header className="attendance-header">
        <div className="attendance-header-inner">
          <Link
            to="/student/dashboard"
            className="attendance-brand"
          >
            <img
              src={gcmLogo}
              alt="Global College of Missiology"
              className="attendance-logo"
            />

            <div className="attendance-brand-text">
              <span>
                GLOBAL COLLEGE OF MISSIOLOGY
              </span>

              <strong>
                Student Portal
              </strong>
            </div>
          </Link>

          <div className="attendance-header-actions">
            <span className="attendance-student-name">
              {student?.fullName ||
                "Student"}
            </span>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(
                  "gcm_student_token"
                );

                localStorage.removeItem(
                  "gcm_student"
                );

                navigate("/student/login", {
                  replace: true,
                });
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="attendance-main">
        <div className="attendance-container">
          <div className="attendance-top">
            <div>
              <span className="attendance-eyebrow">
                ACADEMIC RECORD
              </span>

              <h1>
                Attendance
              </h1>

              <p>
                View your attendance record for
                the current academic session.
              </p>
            </div>

            <Link
              to="/student/dashboard"
              className="attendance-back"
            >
              ← Dashboard
            </Link>
          </div>

          {error && (
            <div
              className="attendance-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="attendance-loading">
              <div className="attendance-spinner"></div>

              <p>
                Loading attendance...
              </p>
            </div>
          ) : (
            <>
              <section className="attendance-session-card">
                <div>
                  <span>
                    Academic Year
                  </span>

                  <strong>
                    {academicYear ||
                      "Not available"}
                  </strong>
                </div>

                <div>
                  <span>
                    Programme
                  </span>

                  <strong>
                    {programme ||
                      "Not available"}
                  </strong>
                </div>

                <div>
                  <span>
                    Semester
                  </span>

                  <strong>
                    {semester
                      ? `Semester ${semester}`
                      : "Not available"}
                  </strong>
                </div>
              </section>

              <section className="attendance-summary">
                <div className="attendance-summary-card attendance-summary-main">
                  <div className="attendance-circle">
                    <span>
                      {percentage}%
                    </span>
                  </div>

                  <div>
                    <small>
                      Overall Attendance
                    </small>

                    <h2>
                      {percentage}%
                    </h2>

                    <p>
                      Based on recorded attendance
                      for the current semester.
                    </p>
                  </div>
                </div>

                <div className="attendance-summary-card">
                  <span className="attendance-summary-label">
                    Total Classes
                  </span>

                  <strong>
                    {summary.total}
                  </strong>
                </div>

                <div className="attendance-summary-card">
                  <span className="attendance-summary-label">
                    Present
                  </span>

                  <strong>
                    {summary.present}
                  </strong>
                </div>

                <div className="attendance-summary-card">
                  <span className="attendance-summary-label">
                    Absent
                  </span>

                  <strong>
                    {summary.absent}
                  </strong>
                </div>

                <div className="attendance-summary-card">
                  <span className="attendance-summary-label">
                    Late
                  </span>

                  <strong>
                    {summary.late}
                  </strong>
                </div>

                <div className="attendance-summary-card">
                  <span className="attendance-summary-label">
                    Excused
                  </span>

                  <strong>
                    {summary.excused}
                  </strong>
                </div>
              </section>

              <section className="attendance-course-section">
                <div className="attendance-section-heading">
                  <div>
                    <span>
                      COURSE SUMMARY
                    </span>

                    <h2>
                      Attendance by Course
                    </h2>
                  </div>
                </div>

                {courseSummary.length === 0 ? (
                  <div className="attendance-empty">
                    <div className="attendance-empty-icon">
                      A
                    </div>

                    <h3>
                      No Attendance Records Yet
                    </h3>

                    <p>
                      Attendance records will
                      appear here after the
                      administrator records your
                      class attendance.
                    </p>
                  </div>
                ) : (
                  <div className="attendance-course-grid">
                    {courseSummary.map(
                      (course) => (
                        <article
                          className="attendance-course-card"
                          key={
                            course.courseCode
                          }
                        >
                          <div className="attendance-course-top">
                            <span>
                              {
                                course.courseCode
                              }
                            </span>

                            <strong>
                              {
                                course.percentage
                              }
                              %
                            </strong>
                          </div>

                          <h3>
                            {course.title}
                          </h3>

                          <div className="attendance-progress">
                            <div
                              style={{
                                width: `${Math.min(
                                  100,
                                  Number(
                                    course.percentage
                                  )
                                )}%`,
                              }}
                            ></div>
                          </div>

                          <div className="attendance-course-stats">
                            <span>
                              Present{" "}
                              <b>
                                {
                                  course.present
                                }
                              </b>
                            </span>

                            <span>
                              Absent{" "}
                              <b>
                                {
                                  course.absent
                                }
                              </b>
                            </span>

                            <span>
                              Late{" "}
                              <b>
                                {
                                  course.late
                                }
                              </b>
                            </span>

                            <span>
                              Excused{" "}
                              <b>
                                {
                                  course.excused
                                }
                              </b>
                            </span>
                          </div>
                        </article>
                      )
                    )}
                  </div>
                )}
              </section>

              <section className="attendance-records-section">
                <div className="attendance-section-heading">
                  <div>
                    <span>
                      ATTENDANCE LOG
                    </span>

                    <h2>
                      Class Attendance
                    </h2>
                  </div>

                  <span className="attendance-record-count">
                    {attendance.length}{" "}
                    record
                    {attendance.length === 1
                      ? ""
                      : "s"}
                  </span>
                </div>

                {attendance.length ===
                0 ? (
                  <div className="attendance-empty attendance-empty-small">
                    <h3>
                      No Class Records
                    </h3>

                    <p>
                      Your detailed attendance
                      records will appear here
                      once classes have been
                      recorded.
                    </p>
                  </div>
                ) : (
                  <div className="attendance-table-wrapper">
                    <table className="attendance-table">
                      <thead>
                        <tr>
                          <th>
                            Date
                          </th>

                          <th>
                            Course
                          </th>

                          <th>
                            Status
                          </th>

                          <th>
                            Remarks
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {attendance.map(
                          (record) => (
                            <tr
                              key={
                                record._id
                              }
                            >
                              <td>
                                {formatDate(
                                  record.attendanceDate
                                )}
                              </td>

                              <td>
                                <strong>
                                  {
                                    record
                                      .course
                                      ?.courseCode
                                  }
                                </strong>

                                <span>
                                  {
                                    record
                                      .course
                                      ?.title
                                  }
                                </span>
                              </td>

                              <td>
                                <span
                                  className={`attendance-status ${getStatusClass(
                                    record.status
                                  )}`}
                                >
                                  {getStatusLabel(
                                    record.status
                                  )}
                                </span>
                              </td>

                              <td>
                                {record.remarks ||
                                  "—"}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <div className="attendance-footer-links">
                <Link to="/student/courses">
                  View Courses
                </Link>

                <Link to="/student/results">
                  View Results
                </Link>

                <Link to="/student/academic-history">
                  Academic History
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="attendance-footer">
        © {new Date().getFullYear()} Global
        College of Missiology
      </footer>
    </div>
  );
}

export default Attendance;