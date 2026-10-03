import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import "./AdminCourses.css";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";


const EMPTY_FORM = {
  courseCode: "",
  title: "",
  description: "",
  creditUnits: 1,
  semester: 1,
  academicYear: "",
  programme: "",
  lecturerName: "",
  status: "ACTIVE",
};


function AdminCourses() {

  const navigate = useNavigate();


  // ==========================================================
  // STATE
  // ==========================================================

  const [courses, setCourses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [semesterFilter, setSemesterFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");


  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);


  const [selectedCourse, setSelectedCourse] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);


  const token =
    localStorage.getItem(
      "gcm_admin_token"
    );


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    if (!token) {
      navigate(
        "/admin/login",
        {
          replace: true,
        }
      );

      return;
    }

    loadCourses();

  }, [navigate]);


  // ==========================================================
  // HEADERS
  // ==========================================================

  const getHeaders = () => ({
    Authorization:
      `Bearer ${token}`,

    "Content-Type":
      "application/json",
  });


  // ==========================================================
  // LOAD COURSES
  // ==========================================================

  const loadCourses = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await fetch(
          `${API_URL}/courses`,
          {
            method: "GET",
            headers: getHeaders(),
          }
        );


      const data =
        await response.json();


      // IMPORTANT:
      // Backend currently returns:
      // {
      //   count,
      //   courses
      // }
      //
      // It does not return success:true.
      // Therefore only response.ok is checked.

      if (!response.ok) {

        throw new Error(
          data.message ||
          "Unable to load courses."
        );

      }


      setCourses(
        Array.isArray(data.courses)
          ? data.courses
          : []
      );

    } catch (err) {

      console.error(
        "Load courses error:",
        err
      );

      setError(
        err.message ||
        "Unable to connect to the course management service."
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // FILTERED COURSES
  // ==========================================================

  const filteredCourses =
    useMemo(() => {

      const searchValue =
        search
          .trim()
          .toLowerCase();


      return courses.filter(
        (course) => {

          const matchesSearch =
            !searchValue ||
            String(
              course.courseCode || ""
            )
              .toLowerCase()
              .includes(searchValue) ||

            String(
              course.title || ""
            )
              .toLowerCase()
              .includes(searchValue) ||

            String(
              course.programme || ""
            )
              .toLowerCase()
              .includes(searchValue) ||

            String(
              course.lecturerName || ""
            )
              .toLowerCase()
              .includes(searchValue);


          const matchesSemester =
            !semesterFilter ||
            String(
              course.semester
            ) ===
              String(
                semesterFilter
              );


          const matchesStatus =
            !statusFilter ||
            course.status ===
              statusFilter;


          return (
            matchesSearch &&
            matchesSemester &&
            matchesStatus
          );

        }
      );

    }, [
      courses,
      search,
      semesterFilter,
      statusFilter,
    ]);


  // ==========================================================
  // STATISTICS
  // ==========================================================

  const statistics =
    useMemo(() => {

      return {

        total:
          courses.length,

        active:
          courses.filter(
            (course) =>
              course.status ===
              "ACTIVE"
          ).length,

        inactive:
          courses.filter(
            (course) =>
              course.status ===
              "INACTIVE"
          ).length,

        semesterOne:
          courses.filter(
            (course) =>
              Number(
                course.semester
              ) === 1
          ).length,

        semesterTwo:
          courses.filter(
            (course) =>
              Number(
                course.semester
              ) === 2
          ).length,

      };

    }, [courses]);


  // ==========================================================
  // FORM
  // ==========================================================

  const handleChange =
    (event) => {

      const {
        name,
        value,
      } = event.target;


      setForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );

    };


  const resetForm = () => {

    setForm(
      {
        ...EMPTY_FORM,
      }
    );

    setSelectedCourse(
      null
    );

  };


  // ==========================================================
  // CREATE MODAL
  // ==========================================================

  const openCreateModal = () => {

    resetForm();

    setError("");
    setSuccess("");

    setShowEditModal(false);
    setShowCreateModal(true);

  };


  // ==========================================================
  // EDIT MODAL
  // ==========================================================

  const openEditModal =
    (course) => {

      setSelectedCourse(
        course
      );


      setForm({

        courseCode:
          course.courseCode ||
          "",

        title:
          course.title ||
          "",

        description:
          course.description ||
          "",

        creditUnits:
          course.creditUnits ||
          1,

        semester:
          course.semester ||
          1,

        academicYear:
          course.academicYear ||
          "",

        programme:
          course.programme ||
          "",

        lecturerName:
          course.lecturerName ||
          "",

        status:
          course.status ||
          "ACTIVE",

      });


      setError("");
      setSuccess("");

      setShowCreateModal(false);
      setShowEditModal(true);

    };


  // ==========================================================
  // CLOSE MODALS
  // ==========================================================

  const closeModals = () => {

    if (saving) {
      return;
    }


    setShowCreateModal(false);
    setShowEditModal(false);

    resetForm();

    setError("");
    setSuccess("");

  };


  // ==========================================================
  // CREATE COURSE
  // ==========================================================

  const handleCreateCourse =
    async (event) => {

      event.preventDefault();

      setError("");
      setSuccess("");


      if (
        !form.courseCode.trim() ||
        !form.title.trim() ||
        !form.academicYear.trim() ||
        !form.programme.trim()
      ) {

        setError(
          "Please complete all required course fields."
        );

        return;

      }


      try {

        setSaving(true);


        const response =
          await fetch(
            `${API_URL}/courses`,
            {
              method: "POST",

              headers:
                getHeaders(),

              body:
                JSON.stringify({

                  courseCode:
                    form.courseCode.trim(),

                  title:
                    form.title.trim(),

                  description:
                    form.description.trim(),

                  creditUnits:
                    Number(
                      form.creditUnits
                    ),

                  semester:
                    Number(
                      form.semester
                    ),

                  academicYear:
                    form.academicYear.trim(),

                  programme:
                    form.programme.trim(),

                  lecturerName:
                    form.lecturerName.trim(),

                  status:
                    form.status,

                }),
            }
          );


        const data =
          await response.json();


        // Backend returns 201
        // without success:true.

        if (!response.ok) {

          throw new Error(
            data.message ||
            "Unable to create course."
          );

        }


        setSuccess(
          data.message ||
          "Course created successfully."
        );


        // Reload from MongoDB
        // so the new course appears
        // in the admin table.

        await loadCourses();


        setTimeout(
          () => {

            setShowCreateModal(
              false
            );

            resetForm();

            setSuccess("");

          },
          800
        );


      } catch (err) {

        console.error(
          "Create course error:",
          err
        );

        setError(
          err.message ||
          "Unable to create the course."
        );

      } finally {

        setSaving(false);

      }

    };


  // ==========================================================
  // EDIT COURSE
  // ==========================================================

  const handleEditCourse =
    async (event) => {

      event.preventDefault();


      if (!selectedCourse) {
        return;
      }


      setError("");
      setSuccess("");


      try {

        setSaving(true);


        const response =
          await fetch(
            `${API_URL}/courses/${selectedCourse._id}`,
            {
              method: "PATCH",

              headers:
                getHeaders(),

              body:
                JSON.stringify({

                  courseCode:
                    form.courseCode.trim(),

                  title:
                    form.title.trim(),

                  description:
                    form.description.trim(),

                  creditUnits:
                    Number(
                      form.creditUnits
                    ),

                  semester:
                    Number(
                      form.semester
                    ),

                  academicYear:
                    form.academicYear.trim(),

                  programme:
                    form.programme.trim(),

                  lecturerName:
                    form.lecturerName.trim(),

                  status:
                    form.status,

                }),
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Unable to update course."
          );

        }


        setSuccess(
          data.message ||
          "Course updated successfully."
        );


        await loadCourses();


        setTimeout(
          () => {

            setShowEditModal(
              false
            );

            resetForm();

            setSuccess("");

          },
          800
        );


      } catch (err) {

        console.error(
          "Update course error:",
          err
        );

        setError(
          err.message ||
          "Unable to update the course."
        );

      } finally {

        setSaving(false);

      }

    };


  // ==========================================================
  // ACTIVATE / DEACTIVATE
  // ==========================================================

  const toggleCourseStatus =
    async (course) => {

      const isActive =
        course.status ===
        "ACTIVE";


      const action =
        isActive
          ? "deactivate"
          : "activate";


      const confirmed =
        window.confirm(
          `${
            isActive
              ? "Deactivate"
              : "Activate"
          } "${course.courseCode} — ${course.title}"?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setError("");
        setSuccess("");


        if (isActive) {

          const response =
            await fetch(
              `${API_URL}/courses/${course._id}/deactivate`,
              {
                method: "PATCH",
                headers:
                  getHeaders(),
              }
            );


          const data =
            await response.json();


          if (!response.ok) {

            throw new Error(
              data.message ||
              "Unable to deactivate course."
            );

          }

        } else {

          const response =
            await fetch(
              `${API_URL}/courses/${course._id}`,
              {
                method: "PATCH",

                headers:
                  getHeaders(),

                body:
                  JSON.stringify({
                    status:
                      "ACTIVE",
                  }),
              }
            );


          const data =
            await response.json();


          if (!response.ok) {

            throw new Error(
              data.message ||
              "Unable to activate course."
            );

          }

        }


        setSuccess(
          `Course ${action}d successfully.`
        );


        await loadCourses();


        setTimeout(
          () => {
            setSuccess("");
          },
          1600
        );


      } catch (err) {

        console.error(
          "Course status error:",
          err
        );

        setError(
          err.message ||
          `Unable to ${action} the course.`
        );

      }

    };


  // ==========================================================
  // OPEN LESSONS
  // ==========================================================

  const openLessons =
    (course) => {

      if (!course?._id) {
        return;
      }


      navigate(
        `/admin/courses/${course._id}/lessons`
      );

    };


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {

    localStorage.removeItem(
      "gcm_admin_token"
    );

    localStorage.removeItem(
      "gcm_admin"
    );


    navigate(
      "/admin/login",
      {
        replace: true,
      }
    );

  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <main className="admin-courses-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="admin-courses-header">

        <div className="admin-courses-header-brand">

          <span className="admin-courses-header-line"></span>

          <div>

            <p className="admin-courses-overline">
              GLOBAL COLLEGE OF MISSIOLOGY
            </p>

            <h1>
              Course Management
            </h1>

            <p className="admin-courses-header-description">
              Create and manage the courses delivered
              through the GCM academic portal.
            </p>

          </div>

        </div>


        <div className="admin-courses-header-actions">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/admin/dashboard"
              )
            }
          >
            Dashboard
          </button>


          <button
            type="button"
            className="admin-courses-logout"
            onClick={handleLogout}
          >
            Sign Out
          </button>

        </div>

      </header>


      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <section className="admin-course-statistics">

        <div className="admin-course-stat-card">

          <span>
            Total Courses
          </span>

          <strong>
            {statistics.total}
          </strong>

        </div>


        <div className="admin-course-stat-card">

          <span>
            Active
          </span>

          <strong>
            {statistics.active}
          </strong>

        </div>


        <div className="admin-course-stat-card">

          <span>
            Inactive
          </span>

          <strong>
            {statistics.inactive}
          </strong>

        </div>


        <div className="admin-course-stat-card">

          <span>
            Semester 1
          </span>

          <strong>
            {statistics.semesterOne}
          </strong>

        </div>


        <div className="admin-course-stat-card">

          <span>
            Semester 2
          </span>

          <strong>
            {statistics.semesterTwo}
          </strong>

        </div>

      </section>


      {/* =====================================================
          MAIN COURSE CARD
      ===================================================== */}

      <section className="admin-course-card">

        <div className="admin-course-toolbar">

          <div>

            <span className="admin-course-section-label">
              ACADEMIC MANAGEMENT
            </span>

            <h2>
              Courses
            </h2>

            <p>
              Manage course information,
              academic placement and availability.
            </p>

          </div>


          <button
            type="button"
            className="admin-course-add-button"
            onClick={
              openCreateModal
            }
          >
            <span>
              +
            </span>

            Add Course
          </button>

        </div>


        {/* ===================================================
            FILTERS
        =================================================== */}

        <div className="admin-course-filters">

          <div className="admin-course-filter-field">

            <label
              htmlFor="course-search"
            >
              Search
            </label>

            <input
              id="course-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Code, title, programme or lecturer"
            />

          </div>


          <div className="admin-course-filter-field">

            <label
              htmlFor="course-semester"
            >
              Semester
            </label>

            <select
              id="course-semester"
              value={
                semesterFilter
              }
              onChange={(event) =>
                setSemesterFilter(
                  event.target.value
                )
              }
            >

              <option value="">
                All Semesters
              </option>

              <option value="1">
                Semester 1
              </option>

              <option value="2">
                Semester 2
              </option>

            </select>

          </div>


          <div className="admin-course-filter-field">

            <label
              htmlFor="course-status"
            >
              Status
            </label>

            <select
              id="course-status"
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >

              <option value="">
                All Statuses
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>

            </select>

          </div>

        </div>


        {/* ===================================================
            ALERTS
        =================================================== */}

        {error && (

          <div className="admin-course-error">

            <strong>
              Attention
            </strong>

            <span>
              {error}
            </span>

          </div>

        )}


        {success && (

          <div className="admin-course-success">

            <span className="admin-course-success-icon">
              ✓
            </span>

            <span>
              {success}
            </span>

          </div>

        )}


        {/* ===================================================
            LOADING
        =================================================== */}

        {loading ? (

          <div className="admin-course-loading">

            <div className="admin-course-loader"></div>

            <p>
              Loading courses...
            </p>

          </div>

        ) : filteredCourses.length === 0 ? (

          /* =================================================
             EMPTY
          ================================================= */

          <div className="admin-course-empty">

            <div className="admin-course-empty-icon">
              ◇
            </div>

            <h3>
              No courses found
            </h3>

            <p>
              Create your first course or change
              the current filters.
            </p>

            <button
              type="button"
              onClick={
                openCreateModal
              }
            >
              + Create Course
            </button>

          </div>

        ) : (

          /* =================================================
             TABLE
          ================================================= */

          <div className="admin-course-table-wrapper">

            <table className="admin-course-table">

              <thead>

                <tr>

                  <th>
                    Course
                  </th>

                  <th>
                    Programme
                  </th>

                  <th>
                    Semester
                  </th>

                  <th>
                    Academic Year
                  </th>

                  <th>
                    Units
                  </th>

                  <th>
                    Lecturer
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredCourses.map(
                  (course) => (

                    <tr
                      key={
                        course._id
                      }
                    >

                      <td>

                        <div className="admin-course-name">

                          <strong>
                            {course.courseCode}
                          </strong>

                          <span>
                            {course.title}
                          </span>

                        </div>

                      </td>


                      <td>
                        {course.programme}
                      </td>


                      <td>

                        <span className="admin-course-semester">

                          Semester{" "}
                          {course.semester}

                        </span>

                      </td>


                      <td>
                        {course.academicYear}
                      </td>


                      <td>
                        {course.creditUnits}
                      </td>


                      <td>
                        {course.lecturerName ||
                          "Not assigned"}
                      </td>


                      <td>

                        <span
                          className={
                            `admin-course-status ${
                              String(
                                course.status ||
                                ""
                              ).toLowerCase()
                            }`
                          }
                        >
                          {course.status}
                        </span>

                      </td>


                      <td>

                        <div className="admin-course-actions">

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                course
                              )
                            }
                          >
                            Edit
                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              toggleCourseStatus(
                                course
                              )
                            }
                          >
                            {course.status ===
                            "ACTIVE"
                              ? "Deactivate"
                              : "Activate"}
                          </button>


                          <button
                            type="button"
                            className="admin-course-lessons-button"
                            onClick={() =>
                              openLessons(
                                course
                              )
                            }
                          >
                            Lessons
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* =====================================================
          CREATE COURSE MODAL
      ===================================================== */}

      {showCreateModal && (

        <div
          className="admin-course-modal-overlay"
          onClick={closeModals}
        >

          <section
            className="admin-course-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="admin-course-modal-header">

              <div>

                <span>
                  ACADEMIC COURSE
                </span>

                <h2>
                  Create Course
                </h2>

              </div>


              <button
                type="button"
                onClick={
                  closeModals
                }
                disabled={saving}
              >
                ×
              </button>

            </div>


            <form
              className="admin-course-form"
              onSubmit={
                handleCreateCourse
              }
            >

              <div className="admin-course-form-grid">

                <div>

                  <label
                    htmlFor="create-course-code"
                  >
                    Course Code
                  </label>

                  <input
                    id="create-course-code"
                    name="courseCode"
                    value={
                      form.courseCode
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="GCM 101"
                    required
                    disabled={saving}
                  />

                </div>


                <div>

                  <label
                    htmlFor="create-course-title"
                  >
                    Course Title
                  </label>

                  <input
                    id="create-course-title"
                    name="title"
                    value={
                      form.title
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Introduction to Missiology"
                    required
                    disabled={saving}
                  />

                </div>


                <div>

                  <label
                    htmlFor="create-programme"
                  >
                    Programme
                  </label>

                  <input
                    id="create-programme"
                    name="programme"
                    value={
                      form.programme
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Diploma in Missiology"
                    required
                    disabled={saving}
                  />

                </div>


                <div>

                  <label
                    htmlFor="create-academic-year"
                  >
                    Academic Year
                  </label>

                  <input
                    id="create-academic-year"
                    name="academicYear"
                    value={
                      form.academicYear
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="2026/2027"
                    required
                    disabled={saving}
                  />

                </div>


                <div>

                  <label
                    htmlFor="create-semester"
                  >
                    Semester
                  </label>

                  <select
                    id="create-semester"
                    name="semester"
                    value={
                      form.semester
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  >

                    <option value="1">
                      Semester 1
                    </option>

                    <option value="2">
                      Semester 2
                    </option>

                  </select>

                </div>


                <div>

                  <label
                    htmlFor="create-units"
                  >
                    Credit Units
                  </label>

                  <input
                    id="create-units"
                    name="creditUnits"
                    type="number"
                    min="1"
                    max="10"
                    value={
                      form.creditUnits
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={saving}
                  />

                </div>


                <div className="admin-course-form-full">

                  <label
                    htmlFor="create-lecturer"
                  >
                    Lecturer
                  </label>

                  <input
                    id="create-lecturer"
                    name="lecturerName"
                    value={
                      form.lecturerName
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Lecturer name"
                    disabled={saving}
                  />

                </div>


                <div className="admin-course-form-full">

                  <label
                    htmlFor="create-description"
                  >
                    Description
                  </label>

                  <textarea
                    id="create-description"
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    rows="5"
                    placeholder="Describe this course..."
                    disabled={saving}
                  />

                </div>

              </div>


              <div className="admin-course-modal-actions">

                <button
                  type="button"
                  onClick={
                    closeModals
                  }
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="admin-course-primary-button"
                  disabled={saving}
                >

                  {saving
                    ? "Creating..."
                    : "Create Course"}

                </button>

              </div>

            </form>

          </section>

        </div>

      )}


      {/* =====================================================
          EDIT COURSE MODAL
      ===================================================== */}

      {showEditModal &&
        selectedCourse && (

          <div
            className="admin-course-modal-overlay"
            onClick={closeModals}
          >

            <section
              className="admin-course-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="admin-course-modal-header">

                <div>

                  <span>
                    ACADEMIC COURSE
                  </span>

                  <h2>
                    Edit Course
                  </h2>

                </div>


                <button
                  type="button"
                  onClick={
                    closeModals
                  }
                  disabled={saving}
                >
                  ×
                </button>

              </div>


              <form
                className="admin-course-form"
                onSubmit={
                  handleEditCourse
                }
              >

                <div className="admin-course-form-grid">

                  <div>

                    <label>
                      Course Code
                    </label>

                    <input
                      name="courseCode"
                      value={
                        form.courseCode
                      }
                      onChange={
                        handleChange
                      }
                      required
                      disabled={saving}
                    />

                  </div>


                  <div>

                    <label>
                      Course Title
                    </label>

                    <input
                      name="title"
                      value={
                        form.title
                      }
                      onChange={
                        handleChange
                      }
                      required
                      disabled={saving}
                    />

                  </div>


                  <div>

                    <label>
                      Programme
                    </label>

                    <input
                      name="programme"
                      value={
                        form.programme
                      }
                      onChange={
                        handleChange
                      }
                      required
                      disabled={saving}
                    />

                  </div>


                  <div>

                    <label>
                      Academic Year
                    </label>

                    <input
                      name="academicYear"
                      value={
                        form.academicYear
                      }
                      onChange={
                        handleChange
                      }
                      required
                      disabled={saving}
                    />

                  </div>


                  <div>

                    <label>
                      Semester
                    </label>

                    <select
                      name="semester"
                      value={
                        form.semester
                      }
                      onChange={
                        handleChange
                      }
                      disabled={saving}
                    >

                      <option value="1">
                        Semester 1
                      </option>

                      <option value="2">
                        Semester 2
                      </option>

                    </select>

                  </div>


                  <div>

                    <label>
                      Credit Units
                    </label>

                    <input
                      name="creditUnits"
                      type="number"
                      min="1"
                      max="10"
                      value={
                        form.creditUnits
                      }
                      onChange={
                        handleChange
                      }
                      required
                      disabled={saving}
                    />

                  </div>


                  <div className="admin-course-form-full">

                    <label>
                      Lecturer
                    </label>

                    <input
                      name="lecturerName"
                      value={
                        form.lecturerName
                      }
                      onChange={
                        handleChange
                      }
                      disabled={saving}
                    />

                  </div>


                  <div className="admin-course-form-full">

                    <label>
                      Status
                    </label>

                    <select
                      name="status"
                      value={
                        form.status
                      }
                      onChange={
                        handleChange
                      }
                      disabled={saving}
                    >

                      <option value="ACTIVE">
                        Active
                      </option>

                      <option value="INACTIVE">
                        Inactive
                      </option>

                    </select>

                  </div>


                  <div className="admin-course-form-full">

                    <label>
                      Description
                    </label>

                    <textarea
                      name="description"
                      value={
                        form.description
                      }
                      onChange={
                        handleChange
                      }
                      rows="5"
                      disabled={saving}
                    />

                  </div>

                </div>


                <div className="admin-course-modal-actions">

                  <button
                    type="button"
                    onClick={
                      closeModals
                    }
                    disabled={saving}
                  >
                    Cancel
                  </button>


                  <button
                    type="submit"
                    className="admin-course-primary-button"
                    disabled={saving}
                  >

                    {saving
                      ? "Saving..."
                      : "Save Changes"}

                  </button>

                </div>

              </form>

            </section>

          </div>

        )}

    </main>

  );
}


export default AdminCourses;