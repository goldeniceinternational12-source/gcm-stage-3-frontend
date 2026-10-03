import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import gcmLogo from "../../assets/images/gcm-logo.png";
import "./AdminResults.css";

const emptyForm = {
  student: "",
  academicYear: "",
  programme: "",
  semester: "1",
  course: "",
  assessmentScore: "",
  examinationScore: "",
  notes: "",
};

const AdminResults = () => {
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingResult, setEditingResult] =
    useState(null);

  const [form, setForm] =
    useState(emptyForm);

  const [filters, setFilters] = useState({
    search: "",
    academicYear: "",
    programme: "",
    semester: "",
    status: "",
  });

  const token =
    localStorage.getItem(
      "gcm_admin_token"
    );

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    loadData();
  }, [token, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        resultsResponse,
        studentsResponse,
        coursesResponse,
      ] = await Promise.all([
        api.get("/results"),
        api.get("/students?limit=100"),
        api.get("/courses"),
      ]);

      setResults(
        resultsResponse.data?.results ||
          []
      );

      setStudents(
        studentsResponse.data?.students ||
          []
      );

      setCourses(
        coursesResponse.data?.courses ||
          []
      );
    } catch (err) {
      console.error(
        "Load results data error:",
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

        navigate("/admin/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load academic results."
      );
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingResult(null);

    setForm({
      ...emptyForm,
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  const openEditModal = (result) => {
    setEditingResult(result);

    setForm({
      student:
        result.student?._id ||
        result.student ||
        "",

      academicYear:
        result.academicYear || "",

      programme:
        result.programme || "",

      semester:
        String(result.semester || 1),

      course:
        result.course?._id ||
        result.course ||
        "",

      assessmentScore:
        result.assessmentScore ?? "",

      examinationScore:
        result.examinationScore ?? "",

      notes:
        result.notes || "",
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingResult(null);
    setForm({
      ...emptyForm,
    });
  };

  const handleFormChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "student") {
      const selectedStudent =
        students.find(
          (student) =>
            String(student._id) ===
            String(value)
        );

      if (
        selectedStudent?.programme
      ) {
        setForm((previous) => ({
          ...previous,
          student: value,
          programme:
            selectedStudent.programme,
        }));
      }
    }
  };

  const submitResult = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (
        !form.student ||
        !form.academicYear ||
        !form.programme ||
        !form.semester ||
        !form.course
      ) {
        setError(
          "Please complete all required fields."
        );

        setSaving(false);
        return;
      }

      const payload = {
        student: form.student,
        academicYear:
          form.academicYear.trim(),
        programme:
          form.programme.trim(),
        semester:
          Number(form.semester),
        course: form.course,
        assessmentScore:
          Number(
            form.assessmentScore || 0
          ),
        examinationScore:
          Number(
            form.examinationScore || 0
          ),
        notes:
          form.notes.trim(),
      };

      if (editingResult) {
        const response =
          await api.patch(
            `/results/${editingResult._id}`,
            {
              assessmentScore:
                payload.assessmentScore,
              examinationScore:
                payload.examinationScore,
              notes:
                payload.notes,
            }
          );

        setSuccess(
          response.data?.message ||
            "Result updated successfully."
        );
      } else {
        const response =
          await api.post(
            "/results",
            payload
          );

        setSuccess(
          response.data?.message ||
            "Result created successfully."
        );
      }

      closeModal();

      await loadData();
    } catch (err) {
      console.error(
        "Save result error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to save result."
      );
    } finally {
      setSaving(false);
    }
  };

  const publishResult = async (
    resultId
  ) => {
    const confirmed =
      window.confirm(
        "Publish this result? The student will be able to see it immediately."
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response =
        await api.patch(
          `/results/${resultId}/publish`
        );

      setSuccess(
        response.data?.message ||
          "Result published successfully."
      );

      await loadData();
    } catch (err) {
      console.error(
        "Publish result error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to publish result."
      );
    }
  };

  const withholdResult = async (
    resultId
  ) => {
    const confirmed =
      window.confirm(
        "Withhold this result?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response =
        await api.patch(
          `/results/${resultId}/withhold`
        );

      setSuccess(
        response.data?.message ||
          "Result withheld successfully."
      );

      await loadData();
    } catch (err) {
      console.error(
        "Withhold result error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to withhold result."
      );
    }
  };

  const filteredResults =
    useMemo(() => {
      const search =
        filters.search
          .trim()
          .toLowerCase();

      return results.filter(
        (result) => {
          const matricNumber =
            result.student
              ?.matricNumber
              ?.toLowerCase() || "";

          const fullName =
            result.student
              ?.fullName
              ?.toLowerCase() || "";

          const courseCode =
            result.course
              ?.courseCode
              ?.toLowerCase() || "";

          const courseTitle =
            result.course
              ?.title
              ?.toLowerCase() || "";

          const matchesSearch =
            !search ||
            matricNumber.includes(
              search
            ) ||
            fullName.includes(
              search
            ) ||
            courseCode.includes(
              search
            ) ||
            courseTitle.includes(
              search
            );

          const matchesYear =
            !filters.academicYear ||
            result.academicYear ===
              filters.academicYear;

          const matchesProgramme =
            !filters.programme ||
            result.programme ===
              filters.programme;

          const matchesSemester =
            !filters.semester ||
            String(
              result.semester
            ) ===
              String(
                filters.semester
              );

          const matchesStatus =
            !filters.status ||
            result.resultStatus ===
              filters.status;

          return (
            matchesSearch &&
            matchesYear &&
            matchesProgramme &&
            matchesSemester &&
            matchesStatus
          );
        }
      );
    }, [results, filters]);

  const stats = useMemo(() => {
    return {
      total: results.length,

      published:
        results.filter(
          (result) =>
            result.resultStatus ===
            "PUBLISHED"
        ).length,

      pending:
        results.filter(
          (result) =>
            result.resultStatus ===
            "PENDING"
        ).length,

      withheld:
        results.filter(
          (result) =>
            result.resultStatus ===
            "WITHHELD"
        ).length,

      semesterOne:
        results.filter(
          (result) =>
            Number(
              result.semester
            ) === 1
        ).length,

      semesterTwo:
        results.filter(
          (result) =>
            Number(
              result.semester
            ) === 2
        ).length,
    };
  }, [results]);

  const academicYears =
    useMemo(() => {
      return [
        ...new Set(
          results
            .map(
              (result) =>
                result.academicYear
            )
            .filter(Boolean)
        ),
      ];
    }, [results]);

  const programmes =
    useMemo(() => {
      return [
        ...new Set(
          results
            .map(
              (result) =>
                result.programme
            )
            .filter(Boolean)
        ),
      ];
    }, [results]);

  const availableCourses =
    useMemo(() => {
      return courses.filter(
        (course) =>
          course.status !==
            "INACTIVE" &&
          Number(course.semester) ===
            Number(form.semester) &&
          (!form.academicYear ||
            course.academicYear ===
              form.academicYear) &&
          (!form.programme ||
            course.programme ===
              form.programme)
      );
    }, [
      courses,
      form.semester,
      form.academicYear,
      form.programme,
    ]);

  const calculatePreview =
    () => {
      const assessment =
        Number(
          form.assessmentScore || 0
        );

      const examination =
        Number(
          form.examinationScore || 0
        );

      const total =
        assessment + examination;

      let grade = "F";

      if (total >= 70) {
        grade = "A";
      } else if (total >= 60) {
        grade = "B";
      } else if (total >= 50) {
        grade = "C";
      } else if (total >= 45) {
        grade = "D";
      } else if (total >= 40) {
        grade = "E";
      }

      return {
        total,
        grade,
      };
    };

  const preview =
    calculatePreview();

  if (loading) {
    return (
      <div className="admin-results-page">
        <div className="admin-results-loading">
          Loading Academic Results...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-results-page">

      <header className="admin-results-header">

        <div className="admin-results-brand">

          <img
            src={gcmLogo}
            alt="Global College of Missiology"
          />

          <div>
            <span>
              GLOBAL COLLEGE OF MISSIOLOGY
            </span>

            <strong>
              Academic Administration
            </strong>
          </div>

        </div>

        <div className="admin-results-header-actions">

          <Link
            to="/admin/dashboard"
            className="admin-results-dashboard-link"
          >
            Dashboard
          </Link>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(
                "gcm_admin_token"
              );

              localStorage.removeItem(
                "gcm_admin"
              );

              navigate("/admin/login");
            }}
            className="admin-results-logout"
          >
            Sign Out
          </button>

        </div>

      </header>

      <main className="admin-results-main">

        <section className="admin-results-hero">

          <div>

            <p className="admin-results-eyebrow">
              ACADEMIC MANAGEMENT
            </p>

            <h1>
              Academic Results
            </h1>

            <p>
              Manage student results across
              Semester 1 and Semester 2
              within each academic year.
            </p>

          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="admin-results-primary-button"
          >
            + Add Result
          </button>

        </section>

        {error && (
          <div className="admin-results-alert error">
            {error}
          </div>
        )}

        {success && (
          <div className="admin-results-alert success">
            {success}
          </div>
        )}

        <section className="admin-results-stats">

          <div className="result-stat-card">
            <span>Total Results</span>
            <strong>{stats.total}</strong>
          </div>

          <div className="result-stat-card published">
            <span>Published</span>
            <strong>{stats.published}</strong>
          </div>

          <div className="result-stat-card pending">
            <span>Pending</span>
            <strong>{stats.pending}</strong>
          </div>

          <div className="result-stat-card withheld">
            <span>Withheld</span>
            <strong>{stats.withheld}</strong>
          </div>

          <div className="result-stat-card">
            <span>Semester 1</span>
            <strong>{stats.semesterOne}</strong>
          </div>

          <div className="result-stat-card">
            <span>Semester 2</span>
            <strong>{stats.semesterTwo}</strong>
          </div>

        </section>

        <section className="admin-results-filter-panel">

          <div className="result-filter search-filter">

            <label>
              Search
            </label>

            <input
              type="text"
              placeholder="Name, matric number or course..."
              value={filters.search}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  search:
                    event.target.value,
                })
              }
            />

          </div>

          <div className="result-filter">

            <label>
              Academic Year
            </label>

            <select
              value={
                filters.academicYear
              }
              onChange={(event) =>
                setFilters({
                  ...filters,
                  academicYear:
                    event.target.value,
                })
              }
            >
              <option value="">
                All Academic Years
              </option>

              {academicYears.map(
                (year) => (
                  <option
                    key={year}
                    value={year}
                  >
                    {year}
                  </option>
                )
              )}
            </select>

          </div>

          <div className="result-filter">

            <label>
              Programme
            </label>

            <select
              value={
                filters.programme
              }
              onChange={(event) =>
                setFilters({
                  ...filters,
                  programme:
                    event.target.value,
                })
              }
            >
              <option value="">
                All Programmes
              </option>

              {programmes.map(
                (programme) => (
                  <option
                    key={programme}
                    value={programme}
                  >
                    {programme}
                  </option>
                )
              )}
            </select>

          </div>

          <div className="result-filter">

            <label>
              Semester
            </label>

            <select
              value={
                filters.semester
              }
              onChange={(event) =>
                setFilters({
                  ...filters,
                  semester:
                    event.target.value,
                })
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

          <div className="result-filter">

            <label>
              Status
            </label>

            <select
              value={
                filters.status
              }
              onChange={(event) =>
                setFilters({
                  ...filters,
                  status:
                    event.target.value,
                })
              }
            >
              <option value="">
                All Statuses
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="PUBLISHED">
                Published
              </option>

              <option value="WITHHELD">
                Withheld
              </option>
            </select>

          </div>

          <button
            type="button"
            className="result-filter-reset"
            onClick={() =>
              setFilters({
                search: "",
                academicYear: "",
                programme: "",
                semester: "",
                status: "",
              })
            }
          >
            Reset
          </button>

        </section>

        <section className="admin-results-table-section">

          <div className="admin-results-table-header">

            <div>
              <span>
                RESULTS REGISTER
              </span>

              <h2>
                {filteredResults.length} result
                {filteredResults.length !== 1
                  ? "s"
                  : ""}
              </h2>
            </div>

          </div>

          {filteredResults.length ===
          0 ? (
            <div className="admin-results-empty">
              <div className="empty-icon">
                ∑
              </div>

              <h3>
                No academic results found
              </h3>

              <p>
                Add a result or adjust your
                filters to view records.
              </p>

              <button
                type="button"
                onClick={openCreateModal}
                className="admin-results-primary-button"
              >
                Add First Result
              </button>
            </div>
          ) : (
            <div className="admin-results-table-wrapper">

              <table className="admin-results-table">

                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Academic Year</th>
                    <th>Semester</th>
                    <th>Course</th>
                    <th>Assessment</th>
                    <th>Exam</th>
                    <th>Total</th>
                    <th>Grade</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredResults.map(
                    (result) => (
                      <tr
                        key={
                          result._id
                        }
                      >

                        <td>
                          <div className="result-student-cell">

                            <strong>
                              {result.student
                                ?.fullName ||
                                "Unknown Student"}
                            </strong>

                            <span>
                              {result.student
                                ?.matricNumber ||
                                "—"}
                            </span>

                          </div>
                        </td>

                        <td>
                          {result.academicYear}
                        </td>

                        <td>
                          <span className="semester-badge">
                            Semester{" "}
                            {result.semester}
                          </span>
                        </td>

                        <td>
                          <div className="result-course-cell">

                            <strong>
                              {result.course
                                ?.courseCode ||
                                "—"}
                            </strong>

                            <span>
                              {result.course
                                ?.title ||
                                "Unknown Course"}
                            </span>

                          </div>
                        </td>

                        <td>
                          {result.assessmentScore}
                        </td>

                        <td>
                          {result.examinationScore}
                        </td>

                        <td>
                          <strong>
                            {result.totalScore}
                          </strong>
                        </td>

                        <td>
                          <span className="grade-badge">
                            {result.grade ||
                              "—"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`result-status-badge ${String(
                              result.resultStatus ||
                                ""
                            ).toLowerCase()}`}
                          >
                            {result.resultStatus}
                          </span>
                        </td>

                        <td>

                          <div className="result-actions">

                            {result.resultStatus !==
                              "PUBLISHED" && (
                              <button
                                type="button"
                                className="action-edit"
                                onClick={() =>
                                  openEditModal(
                                    result
                                  )
                                }
                              >
                                Edit
                              </button>
                            )}

                            {result.resultStatus ===
                              "PENDING" && (
                              <button
                                type="button"
                                className="action-publish"
                                onClick={() =>
                                  publishResult(
                                    result._id
                                  )
                                }
                              >
                                Publish
                              </button>
                            )}

                            {result.resultStatus ===
                              "PUBLISHED" && (
                              <button
                                type="button"
                                className="action-withhold"
                                onClick={() =>
                                  withholdResult(
                                    result._id
                                  )
                                }
                              >
                                Withhold
                              </button>
                            )}

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

      </main>

      {showModal && (
        <div
          className="admin-results-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="admin-results-modal">

            <div className="admin-results-modal-header">

              <div>
                <span>
                  {editingResult
                    ? "EDIT RESULT"
                    : "NEW RESULT"}
                </span>

                <h2>
                  {editingResult
                    ? "Update Academic Result"
                    : "Record Academic Result"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="modal-close"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={submitResult}
              className="admin-results-form"
            >

              {!editingResult && (
                <>

                  <div className="form-group">

                    <label>
                      Student *
                    </label>

                    <select
                      name="student"
                      value={
                        form.student
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                    >
                      <option value="">
                        Select student
                      </option>

                      {students.map(
                        (student) => (
                          <option
                            key={
                              student._id
                            }
                            value={
                              student._id
                            }
                          >
                            {student.fullName} —{" "}
                            {
                              student.matricNumber
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div className="form-grid">

                    <div className="form-group">

                      <label>
                        Academic Year *
                      </label>

                      <input
                        type="text"
                        name="academicYear"
                        placeholder="e.g. 2026/2027"
                        value={
                          form.academicYear
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Programme *
                      </label>

                      <input
                        type="text"
                        name="programme"
                        placeholder="e.g. Missiology"
                        value={
                          form.programme
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                      />

                    </div>

                  </div>

                  <div className="form-grid">

                    <div className="form-group">

                      <label>
                        Semester *
                      </label>

                      <select
                        name="semester"
                        value={
                          form.semester
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                      >
                        <option value="1">
                          Semester 1
                        </option>

                        <option value="2">
                          Semester 2
                        </option>
                      </select>

                    </div>

                    <div className="form-group">

                      <label>
                        Course *
                      </label>

                      <select
                        name="course"
                        value={
                          form.course
                        }
                        onChange={
                          handleFormChange
                        }
                        required
                      >
                        <option value="">
                          Select course
                        </option>

                        {availableCourses.map(
                          (course) => (
                            <option
                              key={
                                course._id
                              }
                              value={
                                course._id
                              }
                            >
                              {
                                course.courseCode
                              }{" "}
                              —{" "}
                              {
                                course.title
                              }
                            </option>
                          )
                        )}

                      </select>

                      {availableCourses.length ===
                        0 && (
                        <small className="form-help">
                          No active course matches
                          this academic year,
                          programme and semester.
                        </small>
                      )}

                    </div>

                  </div>

                </>
              )}

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Assessment Score *
                  </label>

                  <input
                    type="number"
                    name="assessmentScore"
                    min="0"
                    max="100"
                    step="0.01"
                    value={
                      form.assessmentScore
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Examination Score *
                  </label>

                  <input
                    type="number"
                    name="examinationScore"
                    min="0"
                    max="100"
                    step="0.01"
                    value={
                      form.examinationScore
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                  />

                </div>

              </div>

              <div className="result-calculation-preview">

                <div>
                  <span>
                    Total Score
                  </span>

                  <strong>
                    {preview.total}
                    <small>/100</small>
                  </strong>
                </div>

                <div>
                  <span>
                    Grade
                  </span>

                  <strong>
                    {preview.grade}
                  </strong>
                </div>

              </div>

              <div className="form-group">

                <label>
                  Notes
                </label>

                <textarea
                  name="notes"
                  rows="4"
                  placeholder="Optional administrative notes..."
                  value={
                    form.notes
                  }
                  onChange={
                    handleFormChange
                  }
                />

              </div>

              <div className="admin-results-form-footer">

                <button
                  type="button"
                  onClick={closeModal}
                  className="modal-cancel"
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingResult
                    ? "Save Changes"
                    : "Create Result"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default AdminResults;