import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AdminAcademic.css";
import gcmLogo from "../../assets/images/gcm-logo.png";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const emptyForm = {
  studentId: "",
  academicYear: "",
  programme: "",
  semester: 1,
  startDate: "",
  endDate: "",
  notes: "",
};

function AdminAcademic() {
  const navigate = useNavigate();
  const studentDropdownRef = useRef(null);

  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [semesterFilter, setSemesterFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const [studentSearch, setStudentSearch] = useState("");
  const [studentDropdownOpen, setStudentDropdownOpen] =
    useState(false);

  const [editingEnrollment, setEditingEnrollment] =
    useState(null);

  const [selectedEnrollment, setSelectedEnrollment] =
    useState(null);

  const [form, setForm] = useState(emptyForm);

  const token = localStorage.getItem("gcm_admin_token");

  const getHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    loadData();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        studentDropdownRef.current &&
        !studentDropdownRef.current.contains(event.target)
      ) {
        setStudentDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [enrollmentResponse, studentsResponse] =
        await Promise.all([
          fetch(`${API_URL}/academic-enrollments`, {
            headers: getHeaders(),
          }),
          fetch(`${API_URL}/students?limit=1000`, {
            headers: getHeaders(),
          }),
        ]);

      if (
        enrollmentResponse.status === 401 ||
        studentsResponse.status === 401
      ) {
        localStorage.removeItem("gcm_admin_token");
        localStorage.removeItem("gcm_admin");
        navigate("/admin/login");
        return;
      }

      if (!enrollmentResponse.ok) {
        throw new Error(
          "Failed to load academic enrollments."
        );
      }

      if (!studentsResponse.ok) {
        throw new Error("Failed to load students.");
      }

      const enrollmentData =
        await enrollmentResponse.json();

      const studentsData =
        await studentsResponse.json();

      const enrollmentList = Array.isArray(enrollmentData)
        ? enrollmentData
        : enrollmentData.enrollments ||
          enrollmentData.data ||
          [];

      const studentList = Array.isArray(studentsData)
        ? studentsData
        : studentsData.students ||
          studentsData.data ||
          [];

      setEnrollments(enrollmentList);

      /*
       * Remove duplicate student records by _id.
       * This prevents duplicate <option> values from
       * making the wrong student appear selected.
       */
      const uniqueStudents = Array.from(
        new Map(
          studentList
            .filter((student) => student && student._id)
            .map((student) => [
              String(student._id),
              student,
            ])
        ).values()
      );

      setStudents(uniqueStudents);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load academic data."
      );
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      total: enrollments.length,

      active: enrollments.filter(
        (item) => item.enrollmentStatus === "ACTIVE"
      ).length,

      completed: enrollments.filter(
        (item) => item.enrollmentStatus === "COMPLETED"
      ).length,

      suspended: enrollments.filter(
        (item) => item.enrollmentStatus === "SUSPENDED"
      ).length,

      semesterOne: enrollments.filter(
        (item) => Number(item.semester) === 1
      ).length,

      semesterTwo: enrollments.filter(
        (item) => Number(item.semester) === 2
      ).length,
    };
  }, [enrollments]);

  const filteredEnrollments = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return enrollments.filter((item) => {
      const student = item.student || {};

      const studentName = [
        student.firstName,
        student.middleName,
        student.lastName,
      ]
        .filter(Boolean)
        .join(" ");

      const searchable = [
        studentName,
        student.matricNumber,
        student.email,
        item.academicYear,
        item.programme,
        item.enrollmentStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const searchMatch =
        !searchTerm ||
        searchable.includes(searchTerm);

      const statusMatch =
        statusFilter === "ALL" ||
        item.enrollmentStatus === statusFilter;

      const semesterMatch =
        semesterFilter === "ALL" ||
        Number(item.semester) ===
          Number(semesterFilter);

      return (
        searchMatch &&
        statusMatch &&
        semesterMatch
      );
    });
  }, [
    enrollments,
    search,
    statusFilter,
    semesterFilter,
  ]);

  const getStudentName = (student) => {
    if (!student) return "Unknown Student";

    return [
      student.firstName,
      student.middleName,
      student.lastName,
    ]
      .filter(Boolean)
      .join(" ") || "Unknown Student";
  };

  const getInitials = (student) => {
    if (!student) return "ST";

    const first =
      student.firstName?.charAt(0) || "";

    const last =
      student.lastName?.charAt(0) || "";

    return `${first}${last}`.toUpperCase() || "ST";
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "ACTIVE":
        return "status-active";

      case "COMPLETED":
        return "status-completed";

      case "SUSPENDED":
        return "status-suspended";

      case "WITHDRAWN":
        return "status-withdrawn";

      case "DEFERRED":
        return "status-deferred";

      default:
        return "";
    }
  };

  const selectedStudent = useMemo(() => {
    if (!form.studentId) return null;

    return (
      students.find(
        (student) =>
          String(student._id) ===
          String(form.studentId)
      ) || null
    );
  }, [students, form.studentId]);

  const filteredStudents = useMemo(() => {
    const term = studentSearch
      .trim()
      .toLowerCase();

    const result = students.filter((student) => {
      if (!term) return true;

      const name = getStudentName(student);

      const searchable = [
        name,
        student.firstName,
        student.middleName,
        student.lastName,
        student.matricNumber,
        student.email,
        student.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });

    return result.sort((a, b) => {
      const nameA = getStudentName(a).toLowerCase();
      const nameB = getStudentName(b).toLowerCase();

      return nameA.localeCompare(nameB);
    });
  }, [students, studentSearch]);

  const selectStudent = (student) => {
    setForm((previous) => ({
      ...previous,
      studentId: String(student._id),
    }));

    setStudentSearch("");
    setStudentDropdownOpen(false);
    setError("");
  };

  const clearSelectedStudent = () => {
    setForm((previous) => ({
      ...previous,
      studentId: "",
    }));

    setStudentSearch("");
    setStudentDropdownOpen(true);
  };

  const openCreateModal = () => {
    setEditingEnrollment(null);

    setForm({
      ...emptyForm,
      startDate: new Date()
        .toISOString()
        .split("T")[0],
    });

    setStudentSearch("");
    setStudentDropdownOpen(false);

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (enrollment) => {
    setEditingEnrollment(enrollment);

    const enrollmentStudentId =
      enrollment.student?._id ||
      enrollment.student ||
      "";

    setForm({
      studentId: enrollmentStudentId
        ? String(enrollmentStudentId)
        : "",

      academicYear:
        enrollment.academicYear || "",

      programme:
        enrollment.programme || "",

      semester:
        enrollment.semester || 1,

      startDate: enrollment.startDate
        ? new Date(enrollment.startDate)
            .toISOString()
            .split("T")[0]
        : "",

      endDate: enrollment.endDate
        ? new Date(enrollment.endDate)
            .toISOString()
            .split("T")[0]
        : "",

      notes: enrollment.notes || "",
    });

    setStudentSearch("");
    setStudentDropdownOpen(false);

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingEnrollment(null);
    setForm(emptyForm);
    setStudentSearch("");
    setStudentDropdownOpen(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!form.studentId) {
      setError("Please select a student.");
      return;
    }

    if (!form.academicYear.trim()) {
      setError("Academic year is required.");
      return;
    }

    if (!form.programme.trim()) {
      setError("Programme is required.");
      return;
    }

    if (!form.startDate) {
      setError("Start date is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/academic-enrollments`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            studentId: String(form.studentId),

            academicYear:
              form.academicYear.trim(),

            programme:
              form.programme.trim(),

            semester:
              Number(form.semester),

            startDate:
              form.startDate,

            endDate:
              form.endDate || null,

            notes:
              form.notes.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create enrollment."
        );
      }

      setSuccess(
        "Academic enrollment created successfully."
      );

      setShowModal(false);
      setForm(emptyForm);
      setStudentSearch("");
      setStudentDropdownOpen(false);

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to create academic enrollment."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingEnrollment) return;

    if (!form.academicYear.trim()) {
      setError("Academic year is required.");
      return;
    }

    if (!form.programme.trim()) {
      setError("Programme is required.");
      return;
    }

    if (!form.startDate) {
      setError("Start date is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/academic-enrollments/${editingEnrollment._id}`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({
            academicYear:
              form.academicYear.trim(),

            programme:
              form.programme.trim(),

            startDate:
              form.startDate,

            endDate:
              form.endDate || null,

            notes:
              form.notes.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update enrollment."
        );
      }

      setSuccess(
        "Academic enrollment updated successfully."
      );

      setShowModal(false);
      setEditingEnrollment(null);
      setForm(emptyForm);

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to update academic enrollment."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSemesterChange = async (
    enrollment,
    semester
  ) => {
    if (
      enrollment.enrollmentStatus !==
      "ACTIVE"
    ) {
      setError(
        "Only active enrollments can change semester."
      );
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/academic-enrollments/${enrollment._id}/semester`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({
            semester: Number(semester),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update semester."
        );
      }

      setSuccess(
        `Semester updated to Semester ${semester}.`
      );

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to update semester."
      );
    }
  };

  const openCompleteModal = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowCompleteModal(true);
    setError("");
  };

  const closeCompleteModal = () => {
    if (saving) return;

    setShowCompleteModal(false);
    setSelectedEnrollment(null);
  };

  const handleComplete = async () => {
    if (!selectedEnrollment) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/academic-enrollments/${selectedEnrollment._id}/complete`,
        {
          method: "PATCH",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to complete enrollment."
        );
      }

      setSuccess(
        "Academic enrollment marked as completed."
      );

      setShowCompleteModal(false);
      setSelectedEnrollment(null);

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to complete enrollment."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="gcm-academic-page">
      <header className="gcm-academic-header">
        <div className="gcm-academic-brand">
          <img
            src={gcmLogo}
            alt="Global College of Missiology"
            className="gcm-academic-logo"
          />

          <div className="gcm-academic-brand-text">
            <span>GLOBAL COLLEGE OF</span>
            <strong>MISSIOLOGY</strong>
          </div>
        </div>

        <div className="gcm-academic-header-right">
          <span>ACADEMIC MANAGEMENT</span>

          <Link
            to="/admin/dashboard"
            className="gcm-academic-dashboard-link"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="gcm-academic-main">
        <section className="gcm-academic-heading">
          <div>
            <span className="gcm-academic-eyebrow">
              ACADEMIC MANAGEMENT
            </span>

            <h1>Academic Enrollments</h1>

            <p>
              Manage student academic years,
              programmes, semesters and completion
              records.
            </p>
          </div>

          <button
            type="button"
            className="gcm-academic-primary-button"
            onClick={openCreateModal}
          >
            <span>+</span>
            New Enrollment
          </button>
        </section>

        {error && (
          <div className="gcm-academic-alert error">
            <strong>Attention</strong>
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="gcm-academic-alert success">
            <strong>Success</strong>
            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
            >
              ×
            </button>
          </div>
        )}

        <section className="gcm-academic-stats">
          <div className="gcm-academic-stat-card">
            <div className="stat-icon">◈</div>

            <div>
              <span>Total Enrollments</span>
              <strong>{stats.total}</strong>
            </div>
          </div>

          <div className="gcm-academic-stat-card">
            <div className="stat-icon active">
              ✓
            </div>

            <div>
              <span>Active</span>
              <strong>{stats.active}</strong>
            </div>
          </div>

          <div className="gcm-academic-stat-card">
            <div className="stat-icon completed">
              ◆
            </div>

            <div>
              <span>Completed</span>
              <strong>{stats.completed}</strong>
            </div>
          </div>

          <div className="gcm-academic-stat-card">
            <div className="stat-icon suspended">
              !
            </div>

            <div>
              <span>Suspended</span>
              <strong>{stats.suspended}</strong>
            </div>
          </div>

          <div className="gcm-academic-stat-card">
            <div className="stat-icon semester">
              01
            </div>

            <div>
              <span>Semester 1</span>
              <strong>{stats.semesterOne}</strong>
            </div>
          </div>

          <div className="gcm-academic-stat-card">
            <div className="stat-icon semester">
              02
            </div>

            <div>
              <span>Semester 2</span>
              <strong>{stats.semesterTwo}</strong>
            </div>
          </div>
        </section>

        <section className="gcm-academic-controls">
          <div className="gcm-academic-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search student, matric number, programme..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="ALL">
              All Statuses
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="COMPLETED">
              Completed
            </option>

            <option value="SUSPENDED">
              Suspended
            </option>

            <option value="WITHDRAWN">
              Withdrawn
            </option>

            <option value="DEFERRED">
              Deferred
            </option>
          </select>

          <select
            value={semesterFilter}
            onChange={(event) =>
              setSemesterFilter(event.target.value)
            }
          >
            <option value="ALL">
              All Semesters
            </option>

            <option value="1">
              Semester 1
            </option>

            <option value="2">
              Semester 2
            </option>
          </select>

          <button
            type="button"
            className="gcm-academic-refresh"
            onClick={loadData}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </section>

        <section className="gcm-academic-table-card">
          <div className="gcm-academic-table-header">
            <div>
              <h2>Enrollment Records</h2>

              <p>
                {filteredEnrollments.length} record
                {filteredEnrollments.length !== 1
                  ? "s"
                  : ""}{" "}
                found
              </p>
            </div>

            <div className="gcm-academic-year-note">
              One enrollment = one academic year
            </div>
          </div>

          {loading ? (
            <div className="gcm-academic-loading">
              <div className="academic-spinner"></div>

              <p>
                Loading academic records...
              </p>
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="gcm-academic-empty">
              <div className="empty-symbol">
                ◇
              </div>

              <h3>
                No enrollment records found
              </h3>

              <p>
                Create an academic enrollment to
                begin managing a student's academic
                year.
              </p>

              <button
                type="button"
                className="gcm-academic-primary-button"
                onClick={openCreateModal}
              >
                + New Enrollment
              </button>
            </div>
          ) : (
            <div className="gcm-academic-table-wrapper">
              <table className="gcm-academic-table">
                <thead>
                  <tr>
                    <th>STUDENT</th>
                    <th>ACADEMIC YEAR</th>
                    <th>PROGRAMME</th>
                    <th>SEMESTER</th>
                    <th>START DATE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEnrollments.map(
                    (enrollment) => {
                      const student =
                        enrollment.student || {};

                      return (
                        <tr
                          key={enrollment._id}
                        >
                          <td>
                            <div className="student-cell">
                              <div className="student-avatar">
                                {getInitials(student)}
                              </div>

                              <div className="student-info">
                                <strong>
                                  {getStudentName(
                                    student
                                  )}
                                </strong>

                                <span>
                                  {student.matricNumber ||
                                    "No matric number"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="academic-year">
                              {enrollment.academicYear}
                            </span>
                          </td>

                          <td>
                            <span className="programme-name">
                              {enrollment.programme}
                            </span>
                          </td>

                          <td>
                            {enrollment.enrollmentStatus ===
                            "ACTIVE" ? (
                              <select
                                className="semester-select"
                                value={
                                  enrollment.semester ||
                                  1
                                }
                                onChange={(event) =>
                                  handleSemesterChange(
                                    enrollment,
                                    event.target.value
                                  )
                                }
                              >
                                <option value="1">
                                  Semester 1
                                </option>

                                <option value="2">
                                  Semester 2
                                </option>
                              </select>
                            ) : (
                              <span className="semester-badge">
                                Semester{" "}
                                {enrollment.semester ||
                                  1}
                              </span>
                            )}
                          </td>

                          <td>
                            <span className="date-value">
                              {formatDate(
                                enrollment.startDate
                              )}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`status-badge ${getStatusClass(
                                enrollment.enrollmentStatus
                              )}`}
                            >
                              {enrollment.enrollmentStatus}
                            </span>
                          </td>

                          <td>
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="action-button edit"
                                onClick={() =>
                                  openEditModal(
                                    enrollment
                                  )
                                }
                              >
                                Edit
                              </button>

                              {enrollment.enrollmentStatus ===
                                "ACTIVE" && (
                                <button
                                  type="button"
                                  className="action-button complete"
                                  onClick={() =>
                                    openCompleteModal(
                                      enrollment
                                    )
                                  }
                                >
                                  Complete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {showModal && (
        <div
          className="gcm-academic-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !saving
            ) {
              closeModal();
            }
          }}
        >
          <div className="gcm-academic-modal">
            <div className="gcm-academic-modal-header">
              <div>
                <span>
                  ACADEMIC MANAGEMENT
                </span>

                <h2>
                  {editingEnrollment
                    ? "Edit Enrollment"
                    : "New Enrollment"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form
              className="gcm-academic-form"
              onSubmit={
                editingEnrollment
                  ? handleUpdate
                  : handleCreate
              }
            >
              {!editingEnrollment && (
                <div className="form-group full">
                  <label>
                    Student <span>*</span>
                  </label>

                  <div
                    className="student-picker"
                    ref={studentDropdownRef}
                  >
                    {selectedStudent ? (
                      <div className="selected-student-box">
                        <div className="selected-student-avatar">
                          {getInitials(
                            selectedStudent
                          )}
                        </div>

                        <div className="selected-student-details">
                          <strong>
                            {getStudentName(
                              selectedStudent
                            )}
                          </strong>

                          <span>
                            {selectedStudent.matricNumber ||
                              selectedStudent.email ||
                              "Student"}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="remove-student"
                          onClick={
                            clearSelectedStudent
                          }
                          disabled={saving}
                          aria-label="Change selected student"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="student-search-box">
                          <span>⌕</span>

                          <input
                            type="text"
                            value={studentSearch}
                            placeholder="Search by name, matric number or email..."
                            onFocus={() =>
                              setStudentDropdownOpen(
                                true
                              )
                            }
                            onChange={(event) => {
                              setStudentSearch(
                                event.target.value
                              );

                              setStudentDropdownOpen(
                                true
                              );
                            }}
                          />

                          <span className="student-chevron">
                            ▾
                          </span>
                        </div>

                        {studentDropdownOpen && (
                          <div className="student-dropdown">
                            <div className="student-dropdown-count">
                              {filteredStudents.length} student
                              {filteredStudents.length !==
                              1
                                ? "s"
                                : ""}{" "}
                              available
                            </div>

                            {filteredStudents.length ===
                            0 ? (
                              <div className="student-dropdown-empty">
                                No student found.
                              </div>
                            ) : (
                              filteredStudents.map(
                                (student) => (
                                  <button
                                    type="button"
                                    className="student-option"
                                    key={String(
                                      student._id
                                    )}
                                    onClick={() =>
                                      selectStudent(
                                        student
                                      )
                                    }
                                  >
                                    <div className="student-option-avatar">
                                      {getInitials(
                                        student
                                      )}
                                    </div>

                                    <div className="student-option-info">
                                      <strong>
                                        {getStudentName(
                                          student
                                        )}
                                      </strong>

                                      <span>
                                        {student.matricNumber ||
                                          "No matric number"}
                                      </span>

                                      {student.email && (
                                        <small>
                                          {
                                            student.email
                                          }
                                        </small>
                                      )}
                                    </div>
                                  </button>
                                )
                              )
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {editingEnrollment && (
                <div className="gcm-academic-selected-student">
                  <div className="student-avatar">
                    {getInitials(
                      editingEnrollment.student
                    )}
                  </div>

                  <div>
                    <strong>
                      {getStudentName(
                        editingEnrollment.student
                      )}
                    </strong>

                    <span>
                      {editingEnrollment.student
                        ?.matricNumber ||
                        "No matric number"}
                    </span>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Academic Year <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="academicYear"
                    placeholder="2026/2027"
                    value={form.academicYear}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Programme <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="programme"
                    placeholder="Missiology"
                    value={form.programme}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                {!editingEnrollment && (
                  <div className="form-group">
                    <label>
                      Starting Semester
                    </label>

                    <select
                      name="semester"
                      value={form.semester}
                      onChange={handleChange}
                    >
                      <option value="1">
                        Semester 1
                      </option>

                      <option value="2">
                        Semester 2
                      </option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>
                    Start Date <span>*</span>
                  </label>

                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                {editingEnrollment && (
                  <div className="form-group">
                    <label>
                      End Date
                    </label>

                    <input
                      type="date"
                      name="endDate"
                      value={form.endDate}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>

              <div className="form-group full">
                <label>Notes</label>

                <textarea
                  name="notes"
                  rows="4"
                  placeholder="Optional academic notes..."
                  value={form.notes}
                  onChange={handleChange}
                />
              </div>

              <div className="gcm-academic-form-note">
                <strong>
                  Academic structure
                </strong>

                <span>
                  This enrollment represents one
                  complete academic year. Semester 1
                  and Semester 2 belong to the same
                  annual enrollment.
                </span>
              </div>

              <div className="gcm-academic-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingEnrollment
                    ? "Save Changes"
                    : "Create Enrollment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCompleteModal &&
        selectedEnrollment && (
          <div
            className="gcm-academic-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                  event.currentTarget &&
                !saving
              ) {
                closeCompleteModal();
              }
            }}
          >
            <div className="gcm-academic-confirm-modal">
              <div className="confirm-icon">
                ✓
              </div>

              <h2>
                Complete Academic Year?
              </h2>

              <p>
                You are about to mark the academic
                enrollment for{" "}
                <strong>
                  {getStudentName(
                    selectedEnrollment.student
                  )}
                </strong>{" "}
                as completed.
              </p>

              <div className="confirm-details">
                <div>
                  <span>
                    Academic Year
                  </span>

                  <strong>
                    {
                      selectedEnrollment.academicYear
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Programme
                  </span>

                  <strong>
                    {selectedEnrollment.programme}
                  </strong>
                </div>

                <div>
                  <span>
                    Current Semester
                  </span>

                  <strong>
                    Semester{" "}
                    {selectedEnrollment.semester}
                  </strong>
                </div>
              </div>

              <div className="confirm-warning">
                Completing an enrollment records the
                academic year as finished and adds it
                to the student's academic history.
              </div>

              <div className="confirm-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeCompleteModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={handleComplete}
                  disabled={saving}
                >
                  {saving
                    ? "Completing..."
                    : "Complete Enrollment"}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default AdminAcademic;