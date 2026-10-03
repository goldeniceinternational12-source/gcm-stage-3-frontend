import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import gcmLogo from "../../assets/images/gcm-logo.png";
import "./AdminAttendance.css";

const DEFAULT_FORM = {
  academicYear: "",
  programme: "",
  semester: "1",
  course: "",
  attendanceDate: "",
};

const STATUS_OPTIONS = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
];

function AdminAttendance() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState(DEFAULT_FORM);

  const [roster, setRoster] =
    useState([]);

  const [attendance, setAttendance] =
    useState([]);

  const [loadingRoster, setLoadingRoster] =
    useState(false);

  const [loadingAttendance, setLoadingAttendance] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [editingId, setEditingId] =
    useState(null);

  const [editingStatus, setEditingStatus] =
    useState("");

  const token =
    localStorage.getItem(
      "gcm_admin_token"
    );

  const authConfig = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  useEffect(() => {
    if (!token) {
      navigate("/admin/login", {
        replace: true,
      });
    }
  }, [token, navigate]);

  const updateForm = (
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const validateForm = () => {
    if (
      !form.academicYear ||
      !form.programme ||
      !form.semester ||
      !form.course ||
      !form.attendanceDate
    ) {
      setError(
        "Please enter the academic year, programme, semester, course, and attendance date."
      );

      return false;
    }

    return true;
  };

  const loadRoster = async () => {
    clearMessages();

    if (!validateForm()) {
      return;
    }

    try {
      setLoadingRoster(true);

      const response =
        await api.get(
          "/attendance/roster",
          {
            ...authConfig,
            params: {
              academicYear:
                form.academicYear,

              programme:
                form.programme,

              semester:
                Number(
                  form.semester
                ),

              course:
                form.course,

              attendanceDate:
                form.attendanceDate,
            },
          }
        );

      const data =
        response?.data;

      const students =
        data?.students ||
        data?.roster ||
        [];

      setRoster(students);

      if (!students.length) {
        setSuccess(
          "No students found for this class."
        );
      }
    } catch (requestError) {
      console.error(
        "Load attendance roster error:",
        requestError
      );

      setError(
        requestError?.response?.data
          ?.message ||
          "Unable to load the attendance roster."
      );
    } finally {
      setLoadingRoster(false);
    }
  };

  const loadAttendance = async () => {
    clearMessages();

    if (!validateForm()) {
      return;
    }

    try {
      setLoadingAttendance(true);

      const response =
        await api.get(
          "/attendance",
          {
            ...authConfig,
            params: {
              academicYear:
                form.academicYear,

              programme:
                form.programme,

              semester:
                Number(
                  form.semester
                ),

              course:
                form.course,

              attendanceDate:
                form.attendanceDate,
            },
          }
        );

      const data =
        response?.data;

      setAttendance(
        data?.attendance ||
          data?.records ||
          data?.data ||
          []
      );
    } catch (requestError) {
      console.error(
        "Load attendance records error:",
        requestError
      );

      setError(
        requestError?.response?.data
          ?.message ||
          "Unable to load attendance records."
      );
    } finally {
      setLoadingAttendance(false);
    }
  };

  const getStudentId = (
    student
  ) => {
    return (
      student?._id ||
      student?.id ||
      student?.student?._id ||
      student?.student?.id ||
      student?.student ||
      null
    );
  };

  const getStudentName = (
    student
  ) => {
    return (
      student?.fullName ||
      student?.student?.fullName ||
      `${student?.firstName || ""} ${
        student?.lastName || ""
      }`.trim() ||
      "Unnamed Student"
    );
  };

  const getStudentMatricNumber = (
    student
  ) => {
    return (
      student?.matricNumber ||
      student?.student?.matricNumber ||
      "—"
    );
  };

  const getExistingAttendance = (
    student
  ) => {
    const studentId =
      getStudentId(student);

    return attendance.find(
      (record) => {
        const recordStudentId =
          record?.student?._id ||
          record?.student?.id ||
          record?.student;

        return (
          String(
            recordStudentId
          ) ===
          String(studentId)
        );
      }
    );
  };

  const getStatusForStudent = (
    student
  ) => {
    const existing =
      getExistingAttendance(
        student
      );

    return (
      existing?.status ||
      "ABSENT"
    );
  };

  const updateRosterStatus = (
    studentId,
    status
  ) => {
    setRoster(
      (previous) =>
        previous.map(
          (student) => {
            if (
              String(
                getStudentId(
                  student
                )
              ) !==
              String(studentId)
            ) {
              return student;
            }

            return {
              ...student,
              attendanceStatus:
                status,
            };
          }
        )
    );
  };

  const getRosterStatus = (
    student
  ) => {
    if (
      student?.attendanceStatus
    ) {
      return student.attendanceStatus;
    }

    return getStatusForStudent(
      student
    );
  };

  const saveBulkAttendance =
    async () => {
      clearMessages();

      if (!roster.length) {
        setError(
          "There are no students in the attendance roster."
        );

        return;
      }

      try {
        setSaving(true);

        const records =
          roster
            .map((student) => {
              const studentId =
                getStudentId(
                  student
                );

              if (!studentId) {
                return null;
              }

              return {
                student:
                  studentId,

                academicYear:
                  form.academicYear,

                programme:
                  form.programme,

                semester:
                  Number(
                    form.semester
                  ),

                course:
                  form.course,

                attendanceDate:
                  form.attendanceDate,

                status:
                  getRosterStatus(
                    student
                  ),
              };
            })
            .filter(Boolean);

        const response =
          await api.post(
            "/attendance/bulk",
            {
              records,

              academicYear:
                form.academicYear,

              programme:
                form.programme,

              semester:
                Number(
                  form.semester
                ),

              course:
                form.course,

              attendanceDate:
                form.attendanceDate,
            },
            authConfig
          );

        setSuccess(
          response?.data?.message ||
            "Attendance saved successfully."
        );

        await loadAttendance();
      } catch (requestError) {
        console.error(
          "Save bulk attendance error:",
          requestError
        );

        setError(
          requestError?.response?.data
            ?.message ||
            "Unable to save attendance."
        );
      } finally {
        setSaving(false);
      }
    };

  const startEditing = (
    record
  ) => {
    setEditingId(
      record?._id || null
    );

    setEditingStatus(
      record?.status ||
        "PRESENT"
    );

    clearMessages();
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingStatus("");
  };

  const updateAttendance =
    async (recordId) => {
      if (!recordId) {
        return;
      }

      clearMessages();

      try {
        await api.patch(
          `/attendance/${recordId}`,
          {
            status:
              editingStatus,
          },
          authConfig
        );

        setSuccess(
          "Attendance record updated successfully."
        );

        cancelEditing();

        await loadAttendance();
      } catch (requestError) {
        console.error(
          "Update attendance error:",
          requestError
        );

        setError(
          requestError?.response?.data
            ?.message ||
            "Unable to update attendance."
        );
      }
    };

  const deleteAttendance =
    async (recordId) => {
      if (!recordId) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this attendance record?"
        );

      if (!confirmed) {
        return;
      }

      clearMessages();

      try {
        await api.delete(
          `/attendance/${recordId}`,
          authConfig
        );

        setSuccess(
          "Attendance record deleted successfully."
        );

        await loadAttendance();
        await loadRoster();
      } catch (requestError) {
        console.error(
          "Delete attendance error:",
          requestError
        );

        setError(
          requestError?.response?.data
            ?.message ||
            "Unable to delete attendance."
        );
      }
    };

  const getStatusClass = (
    status
  ) => {
    return (
      `attendance-status status-${(
        status || ""
      ).toLowerCase()}`
    );
  };

  const summary = useMemo(() => {
    const records =
      attendance || [];

    return {
      total:
        records.length,

      present:
        records.filter(
          (record) =>
            record.status ===
            "PRESENT"
        ).length,

      absent:
        records.filter(
          (record) =>
            record.status ===
            "ABSENT"
        ).length,

      late:
        records.filter(
          (record) =>
            record.status ===
            "LATE"
        ).length,

      excused:
        records.filter(
          (record) =>
            record.status ===
            "EXCUSED"
        ).length,
    };
  }, [attendance]);

  if (!token) {
    return null;
  }

  return (
    <div className="admin-attendance-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="admin-attendance-header">

        <div className="admin-attendance-brand">

          <div className="admin-attendance-logo-wrap">
            <img
              src={gcmLogo}
              alt="Global College of Missiology"
              className="admin-attendance-logo"
            />
          </div>

          <div>
            <span className="admin-attendance-eyebrow">
              GLOBAL COLLEGE OF MISSIOLOGY
            </span>

            <h1>
              Attendance Management
            </h1>

            <p>
              Academic Administration
            </p>
          </div>

        </div>

        <nav className="admin-attendance-nav">

          <Link to="/admin/dashboard">
            Dashboard
          </Link>

          <Link to="/admin/students">
            Students
          </Link>

          <Link to="/admin/courses">
            Courses
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

              navigate(
                "/admin/login",
                {
                  replace: true,
                }
              );
            }}
          >
            Sign Out
          </button>

        </nav>

      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="admin-attendance-content">

        <section className="attendance-page-heading">

          <div>

            <span className="section-label">
              ACADEMIC MANAGEMENT
            </span>

            <h2>
              Class Attendance
            </h2>

            <p>
              Select a class and date to
              record, review, and manage
              student attendance.
            </p>

          </div>

          <div className="attendance-heading-badge">
            <span className="attendance-live-dot" />
            Administration
          </div>

        </section>

        {/* ALERTS */}

        {error && (
          <div
            className="attendance-alert error"
            role="alert"
          >
            <span>
              !
            </span>

            {error}
          </div>
        )}

        {success && (
          <div
            className="attendance-alert success"
            role="status"
          >
            <span>
              ✓
            </span>

            {success}
          </div>
        )}

        {/* =================================================
            FILTER
        ================================================= */}

        <section className="attendance-filter-card">

          <div className="card-heading">

            <div>
              <span className="section-label">
                CLASS SELECTION
              </span>

              <h3>
                Attendance Session
              </h3>
            </div>

            <div className="filter-card-icon">
              ◷
            </div>

          </div>

          <div className="attendance-filter-grid">

            <div className="form-group">
              <label htmlFor="academicYear">
                Academic Year
              </label>

              <input
                id="academicYear"
                type="text"
                value={
                  form.academicYear
                }
                onChange={(event) =>
                  updateForm(
                    "academicYear",
                    event.target.value
                  )
                }
                placeholder="2026/2027"
              />
            </div>

            <div className="form-group">
              <label htmlFor="programme">
                Programme
              </label>

              <input
                id="programme"
                type="text"
                value={
                  form.programme
                }
                onChange={(event) =>
                  updateForm(
                    "programme",
                    event.target.value
                  )
                }
                placeholder="Missiology"
              />
            </div>

            <div className="form-group">
              <label htmlFor="semester">
                Semester
              </label>

              <select
                id="semester"
                value={
                  form.semester
                }
                onChange={(event) =>
                  updateForm(
                    "semester",
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
            </div>

            <div className="form-group">
              <label htmlFor="course">
                Course
              </label>

              <input
                id="course"
                type="text"
                value={
                  form.course
                }
                onChange={(event) =>
                  updateForm(
                    "course",
                    event.target.value
                  )
                }
                placeholder="Course ID"
              />
            </div>

            <div className="form-group">
              <label htmlFor="attendanceDate">
                Attendance Date
              </label>

              <input
                id="attendanceDate"
                type="date"
                value={
                  form.attendanceDate
                }
                onChange={(event) =>
                  updateForm(
                    "attendanceDate",
                    event.target.value
                  )
                }
              />
            </div>

          </div>

          <div className="attendance-filter-actions">

            <button
              type="button"
              className="primary-button"
              onClick={loadRoster}
              disabled={
                loadingRoster
              }
            >
              {loadingRoster
                ? "Loading Class..."
                : "Load Class"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={
                loadAttendance
              }
              disabled={
                loadingAttendance
              }
            >
              {loadingAttendance
                ? "Loading Records..."
                : "Load Records"}
            </button>

          </div>

        </section>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="attendance-summary-grid">

          <div className="summary-card total">
            <div className="summary-icon">
              #
            </div>

            <div>
              <span>
                Total Records
              </span>

              <strong>
                {summary.total}
              </strong>
            </div>
          </div>

          <div className="summary-card present">
            <div className="summary-icon">
              ✓
            </div>

            <div>
              <span>
                Present
              </span>

              <strong>
                {summary.present}
              </strong>
            </div>
          </div>

          <div className="summary-card absent">
            <div className="summary-icon">
              !
            </div>

            <div>
              <span>
                Absent
              </span>

              <strong>
                {summary.absent}
              </strong>
            </div>
          </div>

          <div className="summary-card late">
            <div className="summary-icon">
              ◷
            </div>

            <div>
              <span>
                Late
              </span>

              <strong>
                {summary.late}
              </strong>
            </div>
          </div>

          <div className="summary-card excused">
            <div className="summary-icon">
              E
            </div>

            <div>
              <span>
                Excused
              </span>

              <strong>
                {summary.excused}
              </strong>
            </div>
          </div>

        </section>

        {/* =================================================
            ROSTER
        ================================================= */}

        <section className="attendance-roster-card">

          <div className="card-heading">

            <div>
              <span className="section-label">
                CLASS ROSTER
              </span>

              <h3>
                Mark Attendance
              </h3>

              <p className="card-subtitle">
                Set the attendance status for
                each student and save the
                complete class record.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={
                saveBulkAttendance
              }
              disabled={
                saving ||
                roster.length === 0
              }
            >
              {saving
                ? "Saving..."
                : "Save Attendance"}
            </button>

          </div>

          {roster.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                ♙
              </div>

              <h4>
                No Class Loaded
              </h4>

              <p>
                Enter the class information
                above and select
                <strong>
                  {" "}Load Class
                </strong>
                {" "}to display the
                student roster.
              </p>
            </div>
          ) : (
            <div className="attendance-table-wrapper">

              <table className="attendance-table">

                <thead>
                  <tr>
                    <th>
                      #
                    </th>

                    <th>
                      Student
                    </th>

                    <th>
                      Matric Number
                    </th>

                    <th>
                      Attendance Status
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {roster.map(
                    (
                      student,
                      index
                    ) => {
                      const studentId =
                        getStudentId(
                          student
                        );

                      const status =
                        getRosterStatus(
                          student
                        );

                      return (
                        <tr
                          key={
                            studentId ||
                            index
                          }
                        >

                          <td className="row-number">
                            {index + 1}
                          </td>

                          <td>
                            <div className="student-cell">
                              <div className="student-avatar">
                                {getStudentName(
                                  student
                                )
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}
                              </div>

                              <strong>
                                {getStudentName(
                                  student
                                )}
                              </strong>
                            </div>
                          </td>

                          <td className="matric-cell">
                            {getStudentMatricNumber(
                              student
                            )}
                          </td>

                          <td>

                            <select
                              className={`attendance-status-select ${getStatusClass(
                                status
                              )}`}
                              value={
                                status
                              }
                              onChange={(
                                event
                              ) =>
                                updateRosterStatus(
                                  studentId,
                                  event
                                    .target
                                    .value
                                )
                              }
                            >

                              {STATUS_OPTIONS.map(
                                (
                                  statusOption
                                ) => (
                                  <option
                                    key={
                                      statusOption
                                    }
                                    value={
                                      statusOption
                                    }
                                  >
                                    {
                                      statusOption
                                    }
                                  </option>
                                )
                              )}

                            </select>

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

        {/* =================================================
            SAVED RECORDS
        ================================================= */}

        <section className="attendance-records-card">

          <div className="card-heading">

            <div>
              <span className="section-label">
                SAVED RECORDS
              </span>

              <h3>
                Attendance Records
              </h3>

              <p className="card-subtitle">
                Review, edit, or remove saved
                attendance records.
              </p>
            </div>

            <span className="record-count">
              {attendance.length}{" "}
              Record
              {attendance.length === 1
                ? ""
                : "s"}
            </span>

          </div>

          {attendance.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                ▤
              </div>

              <h4>
                No Records Loaded
              </h4>

              <p>
                Select the class information
                above and choose
                <strong>
                  {" "}Load Records
                </strong>
                {" "}to display saved
                attendance.
              </p>
            </div>
          ) : (
            <div className="attendance-table-wrapper">

              <table className="attendance-table">

                <thead>
                  <tr>
                    <th>
                      #
                    </th>

                    <th>
                      Student
                    </th>

                    <th>
                      Matric Number
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

                  {attendance.map(
                    (
                      record,
                      index
                    ) => {
                      const recordStudent =
                        record?.student ||
                        {};

                      const studentName =
                        recordStudent?.fullName ||
                        record?.studentName ||
                        "Unnamed Student";

                      const matricNumber =
                        recordStudent?.matricNumber ||
                        record?.matricNumber ||
                        "—";

                      const recordId =
                        record?._id;

                      const status =
                        record?.status ||
                        "—";

                      return (
                        <tr
                          key={
                            recordId ||
                            index
                          }
                        >

                          <td className="row-number">
                            {index + 1}
                          </td>

                          <td>
                            <div className="student-cell">
                              <div className="student-avatar">
                                {studentName
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}
                              </div>

                              <strong>
                                {studentName}
                              </strong>
                            </div>
                          </td>

                          <td className="matric-cell">
                            {matricNumber}
                          </td>

                          <td>

                            {editingId ===
                            recordId ? (
                              <select
                                className={`attendance-status-select ${getStatusClass(
                                  editingStatus
                                )}`}
                                value={
                                  editingStatus
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditingStatus(
                                    event
                                      .target
                                      .value
                                  )
                                }
                              >

                                {STATUS_OPTIONS.map(
                                  (
                                    statusOption
                                  ) => (
                                    <option
                                      key={
                                        statusOption
                                      }
                                      value={
                                        statusOption
                                      }
                                    >
                                      {
                                        statusOption
                                      }
                                    </option>
                                  )
                                )}

                              </select>
                            ) : (
                              <span
                                className={getStatusClass(
                                  status
                                )}
                              >
                                {status}
                              </span>
                            )}

                          </td>

                          <td>

                            {editingId ===
                            recordId ? (
                              <div className="record-actions">

                                <button
                                  type="button"
                                  className="action-save"
                                  onClick={() =>
                                    updateAttendance(
                                      recordId
                                    )
                                  }
                                >
                                  Save
                                </button>

                                <button
                                  type="button"
                                  className="action-cancel"
                                  onClick={
                                    cancelEditing
                                  }
                                >
                                  Cancel
                                </button>

                              </div>
                            ) : (
                              <div className="record-actions">

                                <button
                                  type="button"
                                  className="action-edit"
                                  onClick={() =>
                                    startEditing(
                                      record
                                    )
                                  }
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="action-delete"
                                  onClick={() =>
                                    deleteAttendance(
                                      recordId
                                    )
                                  }
                                >
                                  Delete
                                </button>

                              </div>
                            )}

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

        {/* FOOTER */}

        <footer className="admin-attendance-footer">

          <div>
            <strong>
              GLOBAL COLLEGE OF MISSIOLOGY
            </strong>

            <span>
              Academic Administration Platform
            </span>
          </div>

          <div>
            © {new Date().getFullYear()} GCM
            <span> • </span>
            Stage 3
          </div>

        </footer>

      </main>

    </div>
  );
}

export default AdminAttendance;