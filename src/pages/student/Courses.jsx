import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../../services/api";

import gcmLogo
  from "../../assets/images/gcm-logo.png";

import "./Courses.css";


function Courses() {

  const navigate = useNavigate();


  // ==========================================================
  // STATE
  // ==========================================================

  const [student, setStudent] =
    useState(null);

  const [enrollment, setEnrollment] =
    useState(null);

  const [courses, setCourses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {

    let mounted = true;


    const loadCourses = async () => {

      try {

        setLoading(true);
        setError("");


        // ------------------------------------------------------
        // STUDENT PROFILE
        // ------------------------------------------------------

        const studentResponse =
          await api.get(
            "/auth/me"
          );


        if (!mounted) {
          return;
        }


        const studentData =
          studentResponse.data?.student ||
          studentResponse.data?.data ||
          studentResponse.data;


        setStudent(
          studentData || null
        );


        // ------------------------------------------------------
        // CURRENT ACADEMIC ENROLLMENT
        // ------------------------------------------------------

        const enrollmentResponse =
          await api.get(
            "/academic-enrollments/current"
          );


        if (!mounted) {
          return;
        }


        const enrollmentData =
          enrollmentResponse.data?.enrollment ||
          enrollmentResponse.data?.data ||
          enrollmentResponse.data;


        setEnrollment(
          enrollmentData || null
        );


        // ------------------------------------------------------
        // CURRENT COURSES
        // ------------------------------------------------------

        const coursesResponse =
          await api.get(
            "/courses/current"
          );


        if (!mounted) {
          return;
        }


        const coursesData =
          coursesResponse.data?.courses ||
          coursesResponse.data?.data ||
          [];


        setCourses(
          Array.isArray(coursesData)
            ? coursesData
            : []
        );

      } catch (err) {

        console.error(
          "Unable to load courses:",
          err
        );


        if (!mounted) {
          return;
        }


        if (
          err.response?.status === 401
        ) {

          localStorage.removeItem(
            "gcm_student_token"
          );

          navigate(
            "/student/login",
            {
              replace: true,
            }
          );

          return;
        }


        if (
          err.response?.status === 403
        ) {

          const message =
            err.response?.data?.message ||
            "Your academic portal access is currently restricted.";

          setError(
            message
          );

          return;
        }


        setError(
          err.response?.data?.message ||
          "Unable to load your courses. Please try again."
        );

      } finally {

        if (mounted) {
          setLoading(false);
        }

      }

    };


    loadCourses();


    return () => {
      mounted = false;
    };

  }, [navigate]);


  // ==========================================================
  // CURRENT SEMESTER
  // ==========================================================

  const currentSemester =
    Number(
      enrollment?.semester || 1
    );


  // ==========================================================
  // CURRENT SEMESTER COURSES
  // ==========================================================

  const currentSemesterCourses =
    useMemo(() => {

      return courses.filter(
        (course) =>
          Number(course.semester) ===
          currentSemester
      );

    }, [
      courses,
      currentSemester,
    ]);


  // ==========================================================
  // OTHER SEMESTER COURSES
  // ==========================================================

  const otherSemesterCourses =
    useMemo(() => {

      return courses.filter(
        (course) =>
          Number(course.semester) !==
          currentSemester
      );

    }, [
      courses,
      currentSemester,
    ]);


  // ==========================================================
  // OPEN COURSE LESSONS
  // ==========================================================

  const openCourseLessons = (
    courseId
  ) => {

    if (!courseId) {
      return;
    }


    navigate(
      `/student/courses/${courseId}/lessons`
    );

  };


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {

    localStorage.removeItem(
      "gcm_student_token"
    );

    localStorage.removeItem(
      "gcm_student"
    );

    navigate(
      "/student/login",
      {
        replace: true,
      }
    );

  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <div className="courses-page">

        <div className="courses-loading">

          <div className="courses-loader" />

          <p>
            Loading your courses...
          </p>

        </div>

      </div>
    );

  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div className="courses-page">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="courses-header">

        <div className="courses-header-inner">


          <button
            type="button"
            className="courses-brand"
            onClick={() =>
              navigate(
                "/student/dashboard"
              )
            }
          >

            <img
              src={gcmLogo}
              alt="Global College of Missiology"
              className="courses-logo"
            />

            <div className="courses-brand-text">

              <span className="courses-brand-title">
                GLOBAL COLLEGE
              </span>

              <span className="courses-brand-subtitle">
                OF MISSIOLOGY
              </span>

            </div>

          </button>


          <div className="courses-header-actions">

            <button
              type="button"
              className="courses-dashboard-button"
              onClick={() =>
                navigate(
                  "/student/dashboard"
                )
              }
            >
              Dashboard
            </button>

            <button
              type="button"
              className="courses-logout-button"
              onClick={handleLogout}
            >
              Sign Out
            </button>

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="courses-main">


        {/* ===================================================
            PAGE INTRO
        =================================================== */}

        <section className="courses-hero">

          <div>

            <span className="courses-eyebrow">
              ACADEMIC PROGRAMME
            </span>

            <h1>
              My Courses
            </h1>

            <p>
              Access the courses assigned to your
              current academic programme and semester.
            </p>

          </div>


          <div className="courses-student-card">

            <span>
              STUDENT
            </span>

            <strong>
              {student?.fullName ||
                student?.name ||
                "Student"}
            </strong>

            {student?.matricNumber && (
              <small>
                {student.matricNumber}
              </small>
            )}

          </div>

        </section>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (

          <div className="courses-alert">

            <strong>
              Academic Access
            </strong>

            <p>
              {error}
            </p>

          </div>

        )}


        {/* ===================================================
            ENROLLMENT SUMMARY
        =================================================== */}

        {enrollment && (

          <section className="courses-enrollment">

            <div className="courses-enrollment-item">

              <span>
                ACADEMIC YEAR
              </span>

              <strong>
                {enrollment.academicYear ||
                  "—"}
              </strong>

            </div>


            <div className="courses-enrollment-item">

              <span>
                PROGRAMME
              </span>

              <strong>
                {enrollment.programme ||
                  "—"}
              </strong>

            </div>


            <div className="courses-enrollment-item">

              <span>
                CURRENT SEMESTER
              </span>

              <strong>
                Semester{" "}
                {currentSemester}
              </strong>

            </div>


            <div className="courses-enrollment-item">

              <span>
                ENROLLMENT
              </span>

              <strong>
                {enrollment.enrollmentStatus ||
                  "ACTIVE"}
              </strong>

            </div>

          </section>

        )}


        {/* ===================================================
            CURRENT SEMESTER
        =================================================== */}

        <section className="courses-section">

          <div className="courses-section-heading">

            <div>

              <span>
                SEMESTER {currentSemester}
              </span>

              <h2>
                Current Courses
              </h2>

            </div>

            <div className="courses-count">
              {currentSemesterCourses.length}
            </div>

          </div>


          {currentSemesterCourses.length === 0 ? (

            <div className="courses-empty">

              <div className="courses-empty-icon">
                ∅
              </div>

              <h3>
                No courses available
              </h3>

              <p>
                Courses for your current semester
                have not been assigned yet.
              </p>

            </div>

          ) : (

            <div className="courses-grid">

              {currentSemesterCourses.map(
                (course) => (

                  <article
                    key={
                      course._id ||
                      course.id
                    }
                    className="course-card"
                  >


                    {/* =====================================
                        COURSE TOP
                    ===================================== */}

                    <div className="course-card-top">

                      <span className="course-code">

                        {course.courseCode ||
                          "COURSE"}

                      </span>


                      <span
                        className={
                          `course-status ${
                            String(
                              course.status ||
                              "ACTIVE"
                            ).toLowerCase()
                          }`
                        }
                      >
                        {course.status ||
                          "ACTIVE"}
                      </span>

                    </div>


                    {/* =====================================
                        COURSE BODY
                    ===================================== */}

                    <div className="course-card-body">

                      <h3>
                        {course.title ||
                          "Untitled Course"}
                      </h3>


                      {course.description && (

                        <p>
                          {course.description}
                        </p>

                      )}


                      <div className="course-meta">

                        <div>

                          <span>
                            CREDIT UNITS
                          </span>

                          <strong>
                            {course.creditUnits ??
                              "—"}
                          </strong>

                        </div>


                        <div>

                          <span>
                            SEMESTER
                          </span>

                          <strong>
                            {course.semester ??
                              "—"}
                          </strong>

                        </div>


                        <div>

                          <span>
                            ACADEMIC YEAR
                          </span>

                          <strong>
                            {course.academicYear ||
                              enrollment?.academicYear ||
                              "—"}
                          </strong>

                        </div>

                      </div>


                      {course.lecturerName && (

                        <div className="course-lecturer">

                          <span>
                            LECTURER
                          </span>

                          <strong>
                            {course.lecturerName}
                          </strong>

                        </div>

                      )}

                    </div>


                    {/* =====================================
                        LESSON BUTTON
                    ===================================== */}

                    <div className="course-card-footer">

                      <button
                        type="button"
                        className="course-lessons-button"
                        onClick={() =>
                          openCourseLessons(
                            course._id ||
                            course.id
                          )
                        }
                      >
                        <span>
                          View Lessons
                        </span>

                        <span>
                          →
                        </span>

                      </button>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

        </section>


        {/* ===================================================
            OTHER SEMESTER
        =================================================== */}

        {otherSemesterCourses.length > 0 && (

          <section className="courses-section courses-other-section">

            <div className="courses-section-heading">

              <div>

                <span>
                  OTHER SEMESTER
                </span>

                <h2>
                  Additional Courses
                </h2>

              </div>

              <div className="courses-count">
                {otherSemesterCourses.length}
              </div>

            </div>


            <div className="courses-grid">

              {otherSemesterCourses.map(
                (course) => (

                  <article
                    key={
                      course._id ||
                      course.id
                    }
                    className="course-card course-card-secondary"
                  >

                    <div className="course-card-top">

                      <span className="course-code">

                        {course.courseCode ||
                          "COURSE"}

                      </span>

                      <span className="course-status">

                        Semester{" "}
                        {course.semester}

                      </span>

                    </div>


                    <div className="course-card-body">

                      <h3>
                        {course.title ||
                          "Untitled Course"}
                      </h3>


                      {course.description && (

                        <p>
                          {course.description}
                        </p>

                      )}


                      <div className="course-meta">

                        <div>

                          <span>
                            CREDIT UNITS
                          </span>

                          <strong>
                            {course.creditUnits ??
                              "—"}
                          </strong>

                        </div>


                        <div>

                          <span>
                            SEMESTER
                          </span>

                          <strong>
                            {course.semester ??
                              "—"}
                          </strong>

                        </div>

                      </div>

                    </div>


                    <div className="course-card-footer">

                      <button
                        type="button"
                        className="course-lessons-button"
                        onClick={() =>
                          openCourseLessons(
                            course._id ||
                            course.id
                          )
                        }
                      >

                        <span>
                          View Lessons
                        </span>

                        <span>
                          →
                        </span>

                      </button>

                    </div>

                  </article>

                )
              )}

            </div>

          </section>

        )}


        {/* ===================================================
            ANNUAL PROGRAMME NOTE
        =================================================== */}

        <section className="courses-annual-note">

          <div className="courses-annual-icon">
            ✦
          </div>

          <div>

            <h3>
              One-Year Academic Programme
            </h3>

            <p>
              Your academic enrollment covers the
              complete academic year, consisting of
              Semester 1 and Semester 2. Your academic
              calendar, courses, lessons, assignments,
              attendance and results are managed within
              your annual enrollment.
            </p>

          </div>

        </section>


      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="courses-footer">

        <div className="courses-footer-inner">

          <div>

            <strong>
              GLOBAL COLLEGE OF MISSIOLOGY
            </strong>

            <p>
              Equipping saints for the harvest
              fields of the world.
            </p>

          </div>


          <div className="courses-footer-right">

            <span>
              Student Portal
            </span>

            <span>
              © {new Date().getFullYear()}
            </span>

          </div>

        </div>

      </footer>

    </div>

  );
}


export default Courses;