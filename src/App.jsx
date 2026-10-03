import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import "./App.css";


// ============================================================
// WELCOME PAGE
// ============================================================

import Welcome
  from "./pages/Welcome";


// ============================================================
// STUDENT PAGES
// ============================================================

import StudentLogin
  from "./pages/student/StudentLogin";

import ForgotPassword
  from "./pages/student/ForgotPassword";

import ResetPassword
  from "./pages/student/ResetPassword";

import StudentDashboard
  from "./pages/student/StudentDashboard";

import MyProgramme
  from "./pages/student/MyProgramme";

import AcademicCalendar
  from "./pages/student/AcademicCalendar";

import Courses
  from "./pages/student/Courses";

import Assignments
  from "./pages/student/Assignments";

import Attendance
  from "./pages/student/Attendance";

import Results
  from "./pages/student/Results";

import AcademicHistory
  from "./pages/student/AcademicHistory";

import Announcements
  from "./pages/student/Announcements";


// ============================================================
// ADMIN PAGES
// ============================================================

import AdminLogin
  from "./pages/admin/AdminLogin";

import AdminDashboard
  from "./pages/admin/AdminDashboard";

import StudentManagement
  from "./pages/admin/StudentManagement";

import AdminAttendance
  from "./pages/admin/AdminAttendance";

import AdminCourses
  from "./pages/admin/AdminCourses";

import AdminCourseLessons
  from "./pages/admin/AdminCourseLessons";

import AdminResults
  from "./pages/admin/AdminResults";

import AdminAcademic
  from "./pages/admin/AdminAcademic";

import AdminAnnouncements
  from "./pages/admin/AdminAnnouncements";


// ============================================================
// APP
// ============================================================

function App() {
  return (
    <Routes>

      {/* =====================================================
          WELCOME PAGE

          Main Stage 3 entry point.

          http://localhost:5173/
      ===================================================== */}

      <Route
        path="/"
        element={<Welcome />}
      />


      {/* =====================================================
          STUDENT
      ===================================================== */}

      <Route
        path="/student/login"
        element={<StudentLogin />}
      />

      <Route
        path="/student/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/student/reset-password"
        element={<ResetPassword />}
      />

      <Route
        path="/student/dashboard"
        element={<StudentDashboard />}
      />

      <Route
        path="/student/programme"
        element={<MyProgramme />}
      />

      <Route
        path="/student/calendar"
        element={<AcademicCalendar />}
      />

      {/* Calendar route alias */}
      <Route
        path="/student/academic-calendar"
        element={
          <Navigate
            to="/student/calendar"
            replace
          />
        }
      />

      <Route
        path="/student/courses"
        element={<Courses />}
      />

      <Route
        path="/student/assignments"
        element={<Assignments />}
      />

      <Route
        path="/student/attendance"
        element={<Attendance />}
      />

      <Route
        path="/student/results"
        element={<Results />}
      />

      <Route
        path="/student/academic-history"
        element={<AcademicHistory />}
      />

      <Route
        path="/student/announcements"
        element={<Announcements />}
      />


      {/* =====================================================
          ADMIN
      ===================================================== */}

      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />

      <Route
        path="/admin/dashboard"
        element={<AdminDashboard />}
      />

      <Route
        path="/admin/students"
        element={<StudentManagement />}
      />

      <Route
        path="/admin/courses"
        element={<AdminCourses />}
      />


      {/* =====================================================
          ADMIN COURSE LESSONS

          Example:
          /admin/courses/COURSE_ID/lessons
      ===================================================== */}

      <Route
        path="/admin/courses/:courseId/lessons"
        element={<AdminCourseLessons />}
      />

      <Route
        path="/admin/attendance"
        element={<AdminAttendance />}
      />

      <Route
        path="/admin/academic"
        element={<AdminAcademic />}
      />

      <Route
        path="/admin/results"
        element={<AdminResults />}
      />

      <Route
        path="/admin/announcements"
        element={<AdminAnnouncements />}
      />


      {/* =====================================================
          UNKNOWN ROUTES

          Send visitors back to the GCM Welcome Page.
      ===================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}


export default App;