import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import gcmLogo from "../../assets/images/gcm-logo.png";

import api from "../../services/api";

import "./AdminDashboard.css";


function AdminDashboard() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    students: 0,
    courses: 0,
    attendance: 0,
    results: 0,
    academic: 0,
    announcements: 0,
  });


  useEffect(() => {
    const token =
      localStorage.getItem("gcm_admin_token");

    if (!token) {
      navigate("/admin/login", {
        replace: true,
      });

      return;
    }

    loadDashboard();
  }, [navigate]);


  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const adminResponse =
        await api.get("/admin-auth/me");

      setAdmin(
        adminResponse.data?.admin ||
        adminResponse.data?.data ||
        null
      );


      const results = await Promise.allSettled([
        api.get("/students?limit=100"),
        api.get("/courses"),
        api.get("/attendance"),
        api.get("/results"),
        api.get("/academic-enrollments"),
        api.get("/announcements"),
      ]);


      const [
        studentsResponse,
        coursesResponse,
        attendanceResponse,
        resultsResponse,
        academicResponse,
        announcementsResponse,
      ] = results;


      setStats({
        students:
          studentsResponse.status === "fulfilled"
            ? getCount(
                studentsResponse.value.data
              )
            : 0,

        courses:
          coursesResponse.status === "fulfilled"
            ? getCount(
                coursesResponse.value.data
              )
            : 0,

        attendance:
          attendanceResponse.status === "fulfilled"
            ? getCount(
                attendanceResponse.value.data
              )
            : 0,

        results:
          resultsResponse.status === "fulfilled"
            ? getCount(
                resultsResponse.value.data
              )
            : 0,

        academic:
          academicResponse.status === "fulfilled"
            ? getCount(
                academicResponse.value.data
              )
            : 0,

        announcements:
          announcementsResponse.status ===
          "fulfilled"
            ? getCount(
                announcementsResponse.value.data
              )
            : 0,
      });

    } catch (err) {
      console.error(
        "Admin dashboard error:",
        err
      );

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.removeItem(
          "gcm_admin_token"
        );

        localStorage.removeItem(
          "gcm_admin"
        );

        navigate("/admin/login", {
          replace: true,
        });

        return;
      }

      setError(
        err.response?.data?.message ||
        "Unable to load administration dashboard."
      );
    } finally {
      setLoading(false);
    }
  };


  const getCount = (data) => {
    if (!data) {
      return 0;
    }

    if (Array.isArray(data)) {
      return data.length;
    }

    if (Array.isArray(data.students)) {
      return data.students.length;
    }

    if (Array.isArray(data.courses)) {
      return data.courses.length;
    }

    if (Array.isArray(data.attendance)) {
      return data.attendance.length;
    }

    if (Array.isArray(data.results)) {
      return data.results.length;
    }

    if (Array.isArray(data.enrollments)) {
      return data.enrollments.length;
    }

    if (Array.isArray(data.announcements)) {
      return data.announcements.length;
    }

    if (Array.isArray(data.data)) {
      return data.data.length;
    }

    if (
      typeof data.total === "number"
    ) {
      return data.total;
    }

    return 0;
  };


  const handleLogout = () => {
    localStorage.removeItem(
      "gcm_admin_token"
    );

    localStorage.removeItem(
      "gcm_admin"
    );

    navigate("/admin/login", {
      replace: true,
    });
  };


  const openStudents = () => {
    navigate("/admin/students");
  };


  const openCourses = () => {
    navigate("/admin/courses");
  };


  const openAttendance = () => {
    navigate("/admin/attendance");
  };


  const openResults = () => {
    navigate("/admin/results");
  };


  const openAcademicManagement = () => {
    navigate("/admin/academic");
  };


  const openAnnouncements = () => {
    navigate("/admin/announcements");
  };


  const adminName =
    admin?.fullName ||
    admin?.name ||
    "Administrator";


  return (
    <div className="admin-dashboard">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">

        <div className="admin-sidebar-brand">

          <div className="admin-logo-wrap">
            <img
              src={gcmLogo}
              alt="Global College of Missiology"
            />
          </div>

          <div className="admin-brand-text">
            <span>
              GLOBAL COLLEGE
            </span>

            <strong>
              OF MISSIOLOGY
            </strong>
          </div>

        </div>


        <div className="admin-sidebar-label">
          ADMINISTRATION
        </div>


        <nav className="admin-nav">

          <button
            type="button"
            className="admin-nav-item active"
          >
            <span className="admin-nav-icon">
              ◈
            </span>

            <span>
              Dashboard
            </span>
          </button>


          <button
            type="button"
            className="admin-nav-item"
            onClick={openStudents}
          >
            <span className="admin-nav-icon">
              ♙
            </span>

            <span>
              Students
            </span>
          </button>


          <button
            type="button"
            className="admin-nav-item"
            onClick={openCourses}
          >
            <span className="admin-nav-icon">
              ▣
            </span>

            <span>
              Courses
            </span>
          </button>


          <button
            type="button"
            className="admin-nav-item"
            onClick={openAcademicManagement}
          >
            <span className="admin-nav-icon">
              ◫
            </span>

            <span>
              Academic
            </span>
          </button>


          <button
            type="button"
            className="admin-nav-item"
            onClick={openAttendance}
          >
            <span className="admin-nav-icon">
              ✓
            </span>

            <span>
              Attendance
            </span>
          </button>


          <button
            type="button"
            className="admin-nav-item"
            onClick={openResults}
          >
            <span className="admin-nav-icon">
              ◉
            </span>

            <span>
              Results
            </span>
          </button>


          <button
            type="button"
            className="admin-nav-item"
            onClick={openAnnouncements}
          >
            <span className="admin-nav-icon">
              ✦
            </span>

            <span>
              Announcements
            </span>
          </button>

        </nav>


        <div className="admin-sidebar-bottom">

          <div className="admin-sidebar-note">
            <span className="admin-sidebar-note-dot"></span>

            <div>
              <strong>
                System Online
              </strong>

              <small>
                GCM administration portal
              </small>
            </div>
          </div>


          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
          >
            <span>
              ↪
            </span>

            Sign Out
          </button>

        </div>

      </aside>


      {/* MAIN */}
      <main className="admin-main">

        {/* TOPBAR */}
        <header className="admin-topbar">

          <div className="admin-topbar-left">

            <span className="admin-topbar-label">
              GCM ADMINISTRATION
            </span>

            <h1>
              Administration Dashboard
            </h1>

          </div>


          <div className="admin-topbar-right">

            <div className="admin-user-info">

              <div className="admin-user-avatar">
                {adminName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {adminName}
                </strong>

                <span>
                  Administrator
                </span>
              </div>

            </div>

          </div>

        </header>


        {/* CONTENT */}
        <section className="admin-content">

          {/* WELCOME */}
          <div className="admin-welcome-banner">

            <div className="admin-welcome-content">

              <span className="admin-eyebrow">
                GLOBAL COLLEGE OF MISSIOLOGY
              </span>

              <h2>
                Welcome to the
                Administration Portal
              </h2>

              <p>
                Manage students, academic
                programmes, courses, attendance,
                results and official college
                announcements from one place.
              </p>

            </div>


            <div className="admin-welcome-mark">
              GCM
            </div>

          </div>


          {error && (
            <div className="admin-dashboard-error">
              <strong>
                Dashboard Notice
              </strong>

              <span>
                {error}
              </span>
            </div>
          )}


          {/* STATISTICS */}
          <section className="admin-section">

            <div className="admin-section-heading">

              <div>
                <span>
                  OVERVIEW
                </span>

                <h3>
                  Academic Administration
                </h3>
              </div>

            </div>


            <div className="admin-stat-grid">

              <button
                type="button"
                className="admin-stat-card"
                onClick={openStudents}
              >
                <div className="admin-stat-icon">
                  ♙
                </div>

                <div className="admin-stat-content">
                  <span>
                    STUDENTS
                  </span>

                  <strong>
                    {loading
                      ? "—"
                      : stats.students}
                  </strong>

                  <small>
                    Student records
                  </small>
                </div>
              </button>


              <button
                type="button"
                className="admin-stat-card"
                onClick={openCourses}
              >
                <div className="admin-stat-icon">
                  ▣
                </div>

                <div className="admin-stat-content">
                  <span>
                    COURSES
                  </span>

                  <strong>
                    {loading
                      ? "—"
                      : stats.courses}
                  </strong>

                  <small>
                    Academic courses
                  </small>
                </div>
              </button>


              <button
                type="button"
                className="admin-stat-card"
                onClick={openAttendance}
              >
                <div className="admin-stat-icon">
                  ✓
                </div>

                <div className="admin-stat-content">
                  <span>
                    ATTENDANCE
                  </span>

                  <strong>
                    {loading
                      ? "—"
                      : stats.attendance}
                  </strong>

                  <small>
                    Attendance records
                  </small>
                </div>
              </button>


              <button
                type="button"
                className="admin-stat-card"
                onClick={openResults}
              >
                <div className="admin-stat-icon">
                  ◉
                </div>

                <div className="admin-stat-content">
                  <span>
                    RESULTS
                  </span>

                  <strong>
                    {loading
                      ? "—"
                      : stats.results}
                  </strong>

                  <small>
                    Academic results
                  </small>
                </div>
              </button>

            </div>

          </section>


          {/* MANAGEMENT */}
          <section className="admin-section">

            <div className="admin-section-heading">

              <div>
                <span>
                  MANAGEMENT
                </span>

                <h3>
                  College Operations
                </h3>
              </div>

              <p>
                Select an area to manage
                the academic system.
              </p>

            </div>


            <div className="admin-management-grid">

              {/* STUDENTS */}
              <button
                type="button"
                className="admin-management-card"
                onClick={openStudents}
              >

                <div className="admin-management-icon">
                  ♙
                </div>

                <div className="admin-management-body">

                  <span>
                    STUDENT MANAGEMENT
                  </span>

                  <h4>
                    Students
                  </h4>

                  <p>
                    View and manage registered
                    student records and academic
                    information.
                  </p>

                </div>

                <span className="admin-card-arrow">
                  →
                </span>

              </button>


              {/* COURSES */}
              <button
                type="button"
                className="admin-management-card"
                onClick={openCourses}
              >

                <div className="admin-management-icon">
                  ▣
                </div>

                <div className="admin-management-body">

                  <span>
                    ACADEMIC CONTENT
                  </span>

                  <h4>
                    Courses
                  </h4>

                  <p>
                    Create, edit and manage
                    courses for each programme
                    and semester.
                  </p>

                </div>

                <span className="admin-card-arrow">
                  →
                </span>

              </button>


              {/* ACADEMIC */}
              <button
                type="button"
                className="admin-management-card"
                onClick={openAcademicManagement}
              >

                <div className="admin-management-icon">
                  ◫
                </div>

                <div className="admin-management-body">

                  <span>
                    ACADEMIC MANAGEMENT
                  </span>

                  <h4>
                    Academic Enrollments
                  </h4>

                  <p>
                    Manage annual student
                    enrollments, programmes,
                    semesters and completion.
                  </p>

                </div>

                <span className="admin-card-arrow">
                  →
                </span>

              </button>


              {/* ATTENDANCE */}
              <button
                type="button"
                className="admin-management-card"
                onClick={openAttendance}
              >

                <div className="admin-management-icon">
                  ✓
                </div>

                <div className="admin-management-body">

                  <span>
                    ACADEMIC MONITORING
                  </span>

                  <h4>
                    Attendance
                  </h4>

                  <p>
                    Record and monitor student
                    attendance across courses
                    and semesters.
                  </p>

                </div>

                <span className="admin-card-arrow">
                  →
                </span>

              </button>


              {/* RESULTS */}
              <button
                type="button"
                className="admin-management-card"
                onClick={openResults}
              >

                <div className="admin-management-icon">
                  ◉
                </div>

                <div className="admin-management-body">

                  <span>
                    ACADEMIC PERFORMANCE
                  </span>

                  <h4>
                    Results
                  </h4>

                  <p>
                    Enter, review, publish and
                    withhold student academic
                    results.
                  </p>

                </div>

                <span className="admin-card-arrow">
                  →
                </span>

              </button>


              {/* ANNOUNCEMENTS */}
              <button
                type="button"
                className="admin-management-card admin-management-card-featured"
                onClick={openAnnouncements}
              >

                <div className="admin-management-icon">
                  ✦
                </div>

                <div className="admin-management-body">

                  <span>
                    OFFICIAL COMMUNICATION
                  </span>

                  <h4>
                    Announcements
                  </h4>

                  <p>
                    Create, publish and manage
                    official announcements for
                    students.
                  </p>

                  <div className="admin-live-label">
                    <span></span>
                    Management Available
                  </div>

                </div>

                <span className="admin-card-arrow">
                  →
                </span>

              </button>

            </div>

          </section>


          {/* SECURITY */}
          <section className="admin-security-panel">

            <div className="admin-security-icon">
              ✓
            </div>

            <div className="admin-security-content">

              <span>
                ADMINISTRATIVE ACCESS
              </span>

              <h3>
                Secure Administration Environment
              </h3>

              <p>
                Your administration session is
                protected by authenticated access.
                Keep your administrator credentials
                private and sign out when you finish.
              </p>

            </div>

            <div className="admin-security-status">
              <span></span>
              Secure
            </div>

          </section>


          {/* FOOTER */}
          <footer className="admin-footer">

            <span>
              © {new Date().getFullYear()}
              {" "}
              Global College of Missiology
            </span>

            <span>
              Administration Portal
            </span>

          </footer>

        </section>

      </main>

    </div>
  );
}


export default AdminDashboard;