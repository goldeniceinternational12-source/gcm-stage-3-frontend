import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import gcmLogo from "../../assets/images/gcm-logo.png";
import "./StudentDashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [compliance, setCompliance] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("gcm_student_token");

    if (!token) {
      navigate("/student/login", {
        replace: true,
      });
      return;
    }

    loadDashboard();
  }, [navigate]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        studentResponse,
        enrollmentResponse,
        complianceResponse,
      ] = await Promise.all([
        api.get("/auth/me"),
        api.get("/academic-enrollments/current"),
        api.get("/academic-compliance/me"),
      ]);

      const studentData =
        studentResponse?.data?.student ||
        studentResponse?.data?.data ||
        studentResponse?.data;

      const enrollmentData =
        enrollmentResponse?.data?.enrollment ||
        enrollmentResponse?.data?.data ||
        enrollmentResponse?.data;

      const complianceData =
        complianceResponse?.data?.academicStatus ||
        complianceResponse?.data?.status ||
        complianceResponse?.data?.data ||
        complianceResponse?.data;

      setStudent(studentData || null);
      setEnrollment(enrollmentData || null);
      setCompliance(complianceData || null);

      if (studentData) {
        localStorage.setItem(
          "gcm_student",
          JSON.stringify(studentData)
        );
      }
    } catch (err) {
      console.error(
        "Dashboard loading error:",
        err
      );

      console.error(
        "Dashboard error response:",
        err.response?.data
      );

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
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
          "Unable to load your student dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(
      "gcm_student_token"
    );

    localStorage.removeItem(
      "gcm_student"
    );

    navigate("/student/login", {
      replace: true,
    });
  };

  const getInitials = (name = "") => {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!parts.length) {
      return "G";
    }

    if (parts.length === 1) {
      return parts[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const goTo = (path) => {
    navigate(path);
  };

  const studentName =
    student?.fullName ||
    `${student?.firstName || ""} ${
      student?.lastName || ""
    }`.trim() ||
    "Student";

  const firstName =
    studentName.split(" ")[0] ||
    "Student";

  const matricNumber =
    student?.matricNumber ||
    student?.matricNo ||
    student?.matric ||
    "—";

  const academicYear =
    enrollment?.academicYear ||
    enrollment?.academicYearName ||
    student?.academicYear ||
    "—";

  const programme =
    enrollment?.programme ||
    enrollment?.programmeName ||
    student?.programme ||
    "—";

  const semester =
    enrollment?.semester !== undefined &&
    enrollment?.semester !== null
      ? `Semester ${enrollment.semester}`
      : "—";

  const enrollmentStatus =
    enrollment?.enrollmentStatus ||
    compliance?.status ||
    student?.accountStatus ||
    "—";

  const portalRestricted =
    compliance?.portalRestricted === true;

  const attendancePercentage =
    Number(
      compliance?.attendancePercentage ?? 100
    );

  const academicPerformancePercentage =
    Number(
      compliance?.academicPerformancePercentage ??
        100
    );

  const attendanceWarningCount =
    Number(
      compliance?.attendanceWarningCount ?? 0
    );

  const courses =
    Array.isArray(enrollment?.courses)
      ? enrollment.courses
      : [];

  if (loading) {
    return (
      <div className="student-dashboard-loading">
        <div className="student-dashboard-loading-card">

          <div className="student-dashboard-loading-logo">
            <img
              src={gcmLogo}
              alt="Global College of Missiology"
            />
          </div>

          <div className="student-dashboard-spinner"></div>

          <h2>
            Loading Academic Portal
          </h2>

          <p>
            Please wait while your academic
            information is being loaded.
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard-page">

      {/* =====================================================
          HEADER
         ===================================================== */}

      <header className="student-dashboard-header">

        <div className="student-dashboard-brand">

          <img
            src={gcmLogo}
            alt="Global College of Missiology"
            className="student-dashboard-logo"
          />

          <div>
            <h1>
              Global College of Missiology
            </h1>

            <span>
              Academic Portal
            </span>
          </div>

        </div>


        <div className="student-dashboard-header-actions">

          <div className="student-dashboard-user-mini">

            <div className="student-dashboard-user-avatar">
              {getInitials(studentName)}
            </div>

            <div className="student-dashboard-user-mini-text">

              <strong>
                {studentName}
              </strong>

              <span>
                {matricNumber}
              </span>

            </div>

          </div>

          <button
            type="button"
            className="student-dashboard-logout"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </header>


      {/* =====================================================
          MAIN
         ===================================================== */}

      <main className="student-dashboard-main">

        {/* ===================================================
            WELCOME HERO
           =================================================== */}

        <section className="student-dashboard-welcome">

          <div className="student-dashboard-welcome-content">

            <span className="student-dashboard-eyebrow">
              STUDENT DASHBOARD
            </span>

            <h2>
              Welcome, {firstName}.
            </h2>

            <p>
              This is your central academic portal.
              From here you can access your programme,
              courses, assignments, attendance, results,
              academic history, academic calendar and
              official college announcements.
            </p>

          </div>


          <div className="student-dashboard-welcome-year">

            <span>
              Current Academic Year
            </span>

            <strong>
              {academicYear}
            </strong>

            <small>
              {semester}
            </small>

          </div>

        </section>


        {/* ===================================================
            ERROR
           =================================================== */}

        {error && (
          <div
            className="student-dashboard-error"
            role="alert"
          >
            <div>
              <strong>
                Dashboard Notice
              </strong>

              <span>
                {error}
              </span>
            </div>

            <button
              type="button"
              onClick={loadDashboard}
            >
              Try Again
            </button>
          </div>
        )}


        {/* ===================================================
            RESTRICTION
           =================================================== */}

        {portalRestricted && (
          <div
            className="student-dashboard-restriction"
            role="alert"
          >

            <div className="restriction-icon">
              !
            </div>

            <div className="restriction-content">

              <strong>
                Academic Portal Restricted
              </strong>

              <p>
                {compliance?.restrictionMessage ||
                  "Your academic portal has been restricted. Please contact the administration."}
              </p>

              <div className="restriction-details">

                <span>
                  Attendance:{" "}
                  {attendancePercentage.toFixed(1)}%
                </span>

                <span>
                  Academic Performance:{" "}
                  {academicPerformancePercentage.toFixed(1)}%
                </span>

                <span>
                  Attendance Warnings:{" "}
                  {attendanceWarningCount}
                </span>

              </div>

            </div>

          </div>
        )}


        {/* ===================================================
            STUDENT INFORMATION
           =================================================== */}

        <section className="student-dashboard-summary">

          <div className="student-dashboard-summary-card">

            <span>
              Matric Number
            </span>

            <strong>
              {matricNumber}
            </strong>

          </div>


          <div className="student-dashboard-summary-card">

            <span>
              Programme
            </span>

            <strong>
              {programme}
            </strong>

          </div>


          <div className="student-dashboard-summary-card">

            <span>
              Semester
            </span>

            <strong>
              {semester}
            </strong>

          </div>


          <div className="student-dashboard-summary-card">

            <span>
              Enrollment Status
            </span>

            <strong className="status">
              {enrollmentStatus}
            </strong>

          </div>

        </section>


        {/* ===================================================
            MAIN PORTAL NAVIGATION
           =================================================== */}

        <section className="student-dashboard-section">

          <div className="student-dashboard-section-heading">

            <div>
              <span>
                ACADEMIC PORTAL
              </span>

              <h3>
                Student Services
              </h3>
            </div>

          </div>


          <div className="student-dashboard-quick-grid">

            {/* PROGRAMME */}

            <button
              type="button"
              onClick={() =>
                goTo("/student/programme")
              }
              className="dashboard-service-card"
            >
              <div className="quick-icon">
                P
              </div>

              <strong>
                My Programme
              </strong>

              <span>
                View your programme,
                academic year and enrollment.
              </span>

              <small>
                Open Programme →
              </small>
            </button>


            {/* COURSES */}

            <button
              type="button"
              onClick={() =>
                goTo("/student/courses")
              }
              className="dashboard-service-card"
            >
              <div className="quick-icon">
                C
              </div>

              <strong>
                Courses
              </strong>

              <span>
                Access your current academic
                courses and course information.
              </span>

              <small>
                Open Courses →
              </small>
            </button>


            {/* ASSIGNMENTS */}

            <button
              type="button"
              onClick={() =>
                goTo("/student/assignments")
              }
              className="dashboard-service-card"
            >
              <div className="quick-icon">
                A
              </div>

              <strong>
                Assignments
              </strong>

              <span>
                View academic assignments
                and submission information.
              </span>

              <small>
                Open Assignments →
              </small>
            </button>


            {/* ATTENDANCE */}

            <button
              type="button"
              onClick={() =>
                goTo("/student/attendance")
              }
              className="dashboard-service-card"
            >
              <div className="quick-icon">
                T
              </div>

              <strong>
                Attendance
              </strong>

              <span>
                Review your attendance
                records and academic standing.
              </span>

              <small>
                Open Attendance →
              </small>
            </button>


            {/* RESULTS */}

            <button
              type="button"
              onClick={() =>
                goTo("/student/results")
              }
              className="dashboard-service-card"
            >
              <div className="quick-icon">
                R
              </div>

              <strong>
                Results
              </strong>

              <span>
                View published academic
                results and performance.
              </span>

              <small>
                Open Results →
              </small>
            </button>


            {/* HISTORY */}

            <button
              type="button"
              onClick={() =>
                goTo("/student/academic-history")
              }
              className="dashboard-service-card"
            >
              <div className="quick-icon">
                H
              </div>

              <strong>
                Academic History
              </strong>

              <span>
                Review your previous academic
                enrollment and records.
              </span>

              <small>
                Open History →
              </small>
            </button>


            {/* CALENDAR */}

            <button
              type="button"
              onClick={() =>
                goTo("/student/calendar")
              }
              className="dashboard-service-card"
            >
              <div className="quick-icon">
                K
              </div>

              <strong>
                Academic Calendar
              </strong>

              <span>
                View your academic schedule,
                semesters and important dates.
              </span>

              <small>
                Open Calendar →
              </small>
            </button>


            {/* ANNOUNCEMENTS */}

            <button
              type="button"
              onClick={() =>
                goTo("/student/announcements")
              }
              className="dashboard-service-card dashboard-announcement-card"
            >
              <div className="quick-icon">
                N
              </div>

              <strong>
                Announcements
              </strong>

              <span>
                Read official announcements
                and important college notices.
              </span>

              <small>
                Open Announcements →
              </small>
            </button>


            {/* ACCOUNT SECURITY */}

            <button
              type="button"
              onClick={() =>
                goTo("/student/forgot-password")
              }
              className="dashboard-service-card"
            >
              <div className="quick-icon">
                S
              </div>

              <strong>
                Account Security
              </strong>

              <span>
                Manage your student password
                and account security.
              </span>

              <small>
                Account Security →
              </small>
            </button>

          </div>

        </section>


        {/* ===================================================
            PROGRAMME OVERVIEW
           =================================================== */}

        <section className="student-dashboard-section">

          <div className="student-dashboard-section-heading">

            <div>
              <span>
                ACADEMIC PROGRAMME
              </span>

              <h3>
                My Programme
              </h3>
            </div>

            <button
              type="button"
              onClick={() =>
                goTo("/student/programme")
              }
            >
              View Programme →
            </button>

          </div>


          <div className="student-dashboard-programme-card">

            <div className="student-dashboard-programme-icon">
              GCM
            </div>

            <div className="student-dashboard-programme-details">

              <span>
                CURRENT PROGRAMME
              </span>

              <h4>
                {programme}
              </h4>

              <p>
                Your current academic programme
                for the {academicYear} academic year.
              </p>

            </div>


            <div className="student-dashboard-programme-semester">

              <span>
                Current Semester
              </span>

              <strong>
                {semester}
              </strong>

            </div>

          </div>

        </section>


        {/* ===================================================
            ACADEMIC STANDING
           =================================================== */}

        <section className="student-dashboard-section">

          <div className="student-dashboard-section-heading">

            <div>
              <span>
                ACADEMIC COMPLIANCE
              </span>

              <h3>
                Academic Standing
              </h3>
            </div>

          </div>


          <div className="student-dashboard-standing-grid">

            <div className="standing-card">

              <span>
                Attendance
              </span>

              <strong>
                {attendancePercentage.toFixed(1)}%
              </strong>

              <div className="standing-progress">
                <div
                  style={{
                    width: `${Math.min(
                      Math.max(
                        attendancePercentage,
                        0
                      ),
                      100
                    )}%`,
                  }}
                ></div>
              </div>

            </div>


            <div className="standing-card">

              <span>
                Academic Performance
              </span>

              <strong>
                {academicPerformancePercentage.toFixed(
                  1
                )}%
              </strong>

              <div className="standing-progress">
                <div
                  style={{
                    width: `${Math.min(
                      Math.max(
                        academicPerformancePercentage,
                        0
                      ),
                      100
                    )}%`,
                  }}
                ></div>
              </div>

            </div>


            <div className="standing-card">

              <span>
                Attendance Warnings
              </span>

              <strong>
                {attendanceWarningCount}
              </strong>

              <small>
                Recorded warnings
              </small>

            </div>


            <div className="standing-card">

              <span>
                Portal Access
              </span>

              <strong
                className={
                  portalRestricted
                    ? "restricted-status"
                    : "active-status"
                }
              >
                {portalRestricted
                  ? "RESTRICTED"
                  : "ACTIVE"}
              </strong>

              <small>
                Academic portal status
              </small>

            </div>

          </div>

        </section>


        {/* ===================================================
            CURRENT COURSES
           =================================================== */}

        <section className="student-dashboard-section">

          <div className="student-dashboard-section-heading">

            <div>
              <span>
                CURRENT ACADEMICS
              </span>

              <h3>
                Current Courses
              </h3>
            </div>

            <button
              type="button"
              onClick={() =>
                goTo("/student/courses")
              }
            >
              View All →
            </button>

          </div>


          {courses.length > 0 ? (

            <div className="student-dashboard-courses">

              {courses
                .slice(0, 4)
                .map((course, index) => (

                  <button
                    type="button"
                    className="student-dashboard-course-card"
                    key={
                      course?._id ||
                      course?.courseCode ||
                      index
                    }
                    onClick={() =>
                      goTo("/student/courses")
                    }
                  >

                    <span>
                      {course?.courseCode ||
                        "COURSE"}
                    </span>

                    <h4>
                      {course?.title ||
                        course?.courseName ||
                        "Course"}
                    </h4>

                    <p>
                      {course?.creditUnits
                        ? `${course.creditUnits} Credit Units`
                        : "Academic course"}
                    </p>

                    <small>
                      View Course →
                    </small>

                  </button>

                ))}

            </div>

          ) : (

            <div className="student-dashboard-empty">

              <strong>
                No courses assigned yet
              </strong>

              <p>
                Your courses will appear here
                when they are assigned to your
                current academic enrollment.
              </p>

              <button
                type="button"
                onClick={() =>
                  goTo("/student/courses")
                }
              >
                Open Courses
              </button>

            </div>

          )}

        </section>


        {/* ===================================================
            BOTTOM NAVIGATION
           =================================================== */}

        <section className="student-dashboard-bottom-nav">

          <button
            type="button"
            onClick={() =>
              goTo("/student/academic-history")
            }
          >
            Academic History
          </button>

          <button
            type="button"
            onClick={() =>
              goTo("/student/calendar")
            }
          >
            Academic Calendar
          </button>

          <button
            type="button"
            onClick={() =>
              goTo("/student/announcements")
            }
          >
            Announcements
          </button>

          <button
            type="button"
            onClick={() =>
              goTo("/student/forgot-password")
            }
          >
            Account Security
          </button>

        </section>

      </main>


      {/* =====================================================
          FOOTER
         ===================================================== */}

      <footer className="student-dashboard-footer">

        <span>
          © {new Date().getFullYear()}{" "}
          Global College of Missiology
        </span>

        <span>
          Academic Portal
        </span>

      </footer>

    </div>
  );
}

export default StudentDashboard;