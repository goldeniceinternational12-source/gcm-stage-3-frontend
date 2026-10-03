import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentManagement.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

function StudentManagement() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);

  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    activeStudents: 0,
    suspendedStudents: 0,
    inactiveStudents: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalStudents: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [selectedStudent, setSelectedStudent] =
    useState(null);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    address: "",
    profilePhoto: "",
  });

  const token =
    localStorage.getItem("gcm_admin_token");

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    loadStudents();
    loadStatistics();
  }, [page, status, search]);

  const getHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (search.trim()) {
        params.append(
          "search",
          search.trim()
        );
      }

      if (status) {
        params.append(
          "status",
          status
        );
      }

      const response = await fetch(
        `${API_URL}/students?${params.toString()}`,
        {
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load students."
        );
      }

      setStudents(
        data.students || []
      );

      if (data.pagination) {
        setPagination(
          data.pagination
        );
      }
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the student management service."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch(
        `${API_URL}/students/statistics`,
        {
          headers: getHeaders(),
        }
      );

      const data =
        await response.json();

      if (
        response.ok &&
        data.success
      ) {
        setStatistics(
          data.statistics || {
            totalStudents: 0,
            activeStudents: 0,
            suspendedStudents: 0,
            inactiveStudents: 0,
          }
        );
      }
    } catch {
      // Statistics failure should not block the student list.
    }
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);

    setEditForm({
      fullName:
        student.fullName || "",

      email:
        student.email || "",

      phoneNumber:
        student.phoneNumber || "",

      dateOfBirth:
        student.dateOfBirth
          ? String(
              student.dateOfBirth
            ).slice(0, 10)
          : "",

      gender:
        student.gender || "",

      nationality:
        student.nationality || "",

      address:
        student.address || "",

      profilePhoto:
        student.profilePhoto || "",
    });

    setError("");
    setSuccess("");
    setShowEditModal(true);
  };

  const handleEditChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setEditForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  const handleEditStudent =
    async (event) => {
      event.preventDefault();

      if (!selectedStudent) {
        return;
      }

      setError("");
      setSuccess("");

      try {
        setSaving(true);

        const response =
          await fetch(
            `${API_URL}/students/${selectedStudent._id}`,
            {
              method: "PATCH",
              headers:
                getHeaders(),
              body: JSON.stringify({
                fullName:
                  editForm.fullName.trim(),

                email:
                  editForm.email
                    .trim()
                    .toLowerCase(),

                phoneNumber:
                  editForm.phoneNumber.trim(),

                dateOfBirth:
                  editForm.dateOfBirth ||
                  null,

                gender:
                  editForm.gender.trim(),

                nationality:
                  editForm.nationality.trim(),

                address:
                  editForm.address.trim(),

                profilePhoto:
                  editForm.profilePhoto.trim(),
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to update student."
          );
        }

        setSuccess(
          "Student information updated successfully."
        );

        await loadStudents();
        await loadStatistics();

        setTimeout(() => {
          setShowEditModal(false);
          setSelectedStudent(null);
          setSuccess("");
        }, 1200);
      } catch (err) {
        setError(
          err.message ||
            "Unable to update the student information."
        );
      } finally {
        setSaving(false);
      }
    };

  const toggleStudentStatus =
    async (student) => {
      const nextStatus =
        student.accountStatus ===
        "ACTIVE"
          ? "SUSPENDED"
          : "ACTIVE";

      const confirmed =
        window.confirm(
          `Change ${student.fullName}'s status to ${nextStatus}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");
        setSuccess("");

        const response =
          await fetch(
            `${API_URL}/students/${student._id}/status`,
            {
              method: "PATCH",
              headers:
                getHeaders(),
              body: JSON.stringify({
                accountStatus:
                  nextStatus,
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to update student status."
          );
        }

        setSuccess(
          `${student.fullName} is now ${nextStatus.toLowerCase()}.`
        );

        await loadStudents();
        await loadStatistics();

        setTimeout(
          () => setSuccess(""),
          1800
        );
      } catch (err) {
        setError(
          err.message ||
            "Unable to update the student status."
        );
      }
    };

  const handleLogout = () => {
    localStorage.removeItem(
      "gcm_admin_token"
    );

    localStorage.removeItem(
      "gcm_admin"
    );

    navigate("/admin/login");
  };

  const closeModals = () => {
    if (saving) {
      return;
    }

    setShowEditModal(false);
    setSelectedStudent(null);
    setError("");
    setSuccess("");
  };

  const formatDate = (date) => {
    if (!date) {
      return "Not provided";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "Not provided";
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

  return (
    <main className="student-management-page">
      {/* HEADER */}
      <header className="student-management-header">
        <div className="student-management-heading">
          <button
            type="button"
            className="student-back-button"
            onClick={() =>
              navigate(
                "/admin/dashboard"
              )
            }
          >
            ← Back to Dashboard
          </button>

          <span className="student-page-overline">
            GLOBAL COLLEGE OF MISSIOLOGY
          </span>

          <h1>
            Student Management
          </h1>

          <p>
            Review and manage
            registered GCM student
            accounts and academic
            identity records.
          </p>
        </div>

        <div className="student-header-actions">
          <button
            type="button"
            className="student-dashboard-button"
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
            className="student-logout-button"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* STATISTICS */}
      <section className="student-stat-grid">
        <div className="student-stat-card">
          <span>
            Total Students
          </span>

          <strong>
            {statistics.totalStudents}
          </strong>
        </div>

        <div className="student-stat-card">
          <span>Active</span>

          <strong>
            {statistics.activeStudents}
          </strong>
        </div>

        <div className="student-stat-card">
          <span>Suspended</span>

          <strong>
            {statistics.suspendedStudents}
          </strong>
        </div>

        <div className="student-stat-card">
          <span>Inactive</span>

          <strong>
            {statistics.inactiveStudents}
          </strong>
        </div>
      </section>

      {/* MAIN CARD */}
      <section className="student-management-card">
        <div className="student-management-card-header">
          <div>
            <span className="student-section-overline">
              ACADEMIC RECORDS
            </span>

            <h2>
              Registered Students
            </h2>
          </div>

          <span className="student-record-count">
            {pagination.totalStudents ||
              0}{" "}
            record
            {pagination.totalStudents ===
            1
              ? ""
              : "s"}
          </span>
        </div>

        {/* FILTERS */}
        <div className="student-filters">
          <div className="student-search-wrapper">
            <label htmlFor="student-search">
              Search Students
            </label>

            <input
              id="student-search"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value
                );
                setPage(1);
              }}
              placeholder="Name, matric number or email"
            />
          </div>

          <div className="student-status-filter">
            <label htmlFor="student-status">
              Account Status
            </label>

            <select
              id="student-status"
              value={status}
              onChange={(event) => {
                setStatus(
                  event.target.value
                );
                setPage(1);
              }}
            >
              <option value="">
                All Statuses
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="SUSPENDED">
                Suspended
              </option>

              <option value="INACTIVE">
                Inactive
              </option>
            </select>
          </div>

          <button
            type="button"
            className="student-clear-button"
            onClick={() => {
              setSearch("");
              setStatus("");
              setPage(1);
            }}
          >
            Clear Filters
          </button>
        </div>

        {/* MESSAGES */}
        {error && (
          <div className="student-management-error">
            {error}
          </div>
        )}

        {success && (
          <div className="student-management-success">
            {success}
          </div>
        )}

        {/* CONTENT */}
        {loading ? (
          <div className="student-loading-state">
            <div className="student-loading-spinner"></div>

            <p>
              Loading student
              records...
            </p>
          </div>
        ) : students.length ===
          0 ? (
          <div className="student-empty-state">
            <div className="student-empty-icon">
              🎓
            </div>

            <h3>
              No Students Found
            </h3>

            <p>
              There are currently no
              student records matching
              your search or selected
              status.
            </p>

            {(search || status) && (
              <button
                type="button"
                className="student-empty-clear-button"
                onClick={() => {
                  setSearch("");
                  setStatus("");
                  setPage(1);
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="student-table-wrapper">
            <table className="student-table">
              <thead>
                <tr>
                  <th>
                    Student
                  </th>

                  <th>
                    Matric Number
                  </th>

                  <th>
                    Email
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
                {students.map(
                  (student) => (
                    <tr
                      key={
                        student._id
                      }
                    >
                      <td>
                        <div className="student-name-cell">
                          <div className="student-avatar">
                            {student.fullName
                              ?.charAt(
                                0
                              )
                              ?.toUpperCase() ||
                              "S"}
                          </div>

                          <div>
                            <strong>
                              {
                                student.fullName
                              }
                            </strong>

                            <span>
                              {student.role ||
                                "STUDENT"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong className="student-matric">
                          {
                            student.matricNumber
                          }
                        </strong>
                      </td>

                      <td>
                        {student.email}
                      </td>

                      <td>
                        <span
                          className={`student-status-badge ${String(
                            student.accountStatus ||
                              ""
                          ).toLowerCase()}`}
                        >
                          {
                            student.accountStatus
                          }
                        </span>
                      </td>

                      <td>
                        <div className="student-actions">
                          <button
                            type="button"
                            className="student-view-action"
                            onClick={() =>
                              setSelectedStudent(
                                student
                              )
                            }
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="student-edit-action"
                            onClick={() =>
                              openEditModal(
                                student
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="student-status-action"
                            onClick={() =>
                              toggleStudentStatus(
                                student
                              )
                            }
                          >
                            {student.accountStatus ===
                            "ACTIVE"
                              ? "Suspend"
                              : "Activate"}
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

        {/* PAGINATION */}
        <div className="student-pagination">
          <button
            type="button"
            disabled={
              !pagination.hasPreviousPage
            }
            onClick={() =>
              setPage(
                (current) =>
                  Math.max(
                    1,
                    current - 1
                  )
              )
            }
          >
            ← Previous
          </button>

          <span>
            Page{" "}
            <strong>
              {page}
            </strong>{" "}
            of{" "}
            <strong>
              {pagination.totalPages ||
                1}
            </strong>
          </span>

          <button
            type="button"
            disabled={
              !pagination.hasNextPage
            }
            onClick={() =>
              setPage(
                (current) =>
                  current + 1
              )
            }
          >
            Next →
          </button>
        </div>
      </section>

      {/* VIEW STUDENT MODAL */}
      {selectedStudent &&
        !showEditModal && (
          <div
            className="student-modal-overlay"
            onClick={() =>
              setSelectedStudent(
                null
              )
            }
          >
            <section
              className="student-modal student-view-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="student-modal-header">
                <div>
                  <span>
                    STUDENT RECORD
                  </span>

                  <h2>
                    {
                      selectedStudent.fullName
                    }
                  </h2>

                  <p>
                    Registered GCM
                    student account
                  </p>
                </div>

                <button
                  type="button"
                  className="student-modal-close"
                  onClick={() =>
                    setSelectedStudent(
                      null
                    )
                  }
                >
                  ×
                </button>
              </div>

              <div className="student-detail-grid">
                <div>
                  <span>
                    Matric Number
                  </span>

                  <strong>
                    {
                      selectedStudent.matricNumber
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Account Status
                  </span>

                  <strong>
                    {
                      selectedStudent.accountStatus
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Email
                  </span>

                  <strong>
                    {
                      selectedStudent.email
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Role
                  </span>

                  <strong>
                    {
                      selectedStudent.role ||
                      "STUDENT"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Phone Number
                  </span>

                  <strong>
                    {
                      selectedStudent.phoneNumber ||
                      "Not provided"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Date of Birth
                  </span>

                  <strong>
                    {formatDate(
                      selectedStudent.dateOfBirth
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Gender
                  </span>

                  <strong>
                    {
                      selectedStudent.gender ||
                      "Not provided"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Nationality
                  </span>

                  <strong>
                    {
                      selectedStudent.nationality ||
                      "Not provided"
                    }
                  </strong>
                </div>

                <div className="student-detail-full">
                  <span>
                    Address
                  </span>

                  <strong>
                    {
                      selectedStudent.address ||
                      "Not provided"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Account Created
                  </span>

                  <strong>
                    {formatDate(
                      selectedStudent.createdAt
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Last Login
                  </span>

                  <strong>
                    {formatDate(
                      selectedStudent.lastLoginAt
                    )}
                  </strong>
                </div>
              </div>

              <div className="student-view-footer">
                <button
                  type="button"
                  className="student-modal-cancel"
                  onClick={() =>
                    setSelectedStudent(
                      null
                    )
                  }
                >
                  Close
                </button>

                <button
                  type="button"
                  className="student-modal-submit"
                  onClick={() =>
                    openEditModal(
                      selectedStudent
                    )
                  }
                >
                  Edit Student
                </button>
              </div>
            </section>
          </div>
        )}

      {/* EDIT STUDENT MODAL */}
      {showEditModal &&
        selectedStudent && (
          <div
            className="student-modal-overlay"
            onClick={closeModals}
          >
            <section
              className="student-modal student-edit-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="student-modal-header">
                <div>
                  <span>
                    EDIT STUDENT
                  </span>

                  <h2>
                    {
                      selectedStudent.fullName
                    }
                  </h2>

                  <p>
                    Update the student's
                    academic identity
                    information.
                  </p>
                </div>

                <button
                  type="button"
                  className="student-modal-close"
                  onClick={closeModals}
                  disabled={saving}
                >
                  ×
                </button>
              </div>

              <div className="student-edit-identity">
                <span>
                  MATRIC NUMBER
                </span>

                <strong>
                  {
                    selectedStudent.matricNumber
                  }
                </strong>

                <small>
                  Matric number and
                  student role cannot be
                  changed from this screen.
                </small>
              </div>

              <form
                className="student-edit-form"
                onSubmit={
                  handleEditStudent
                }
              >
                {error && (
                  <div className="student-form-error">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="student-form-success">
                    {success}
                  </div>
                )}

                <div className="student-form-grid">
                  <div className="student-form-field">
                    <label htmlFor="edit-name">
                      Full Name
                    </label>

                    <input
                      id="edit-name"
                      name="fullName"
                      value={
                        editForm.fullName
                      }
                      onChange={
                        handleEditChange
                      }
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="student-form-field">
                    <label htmlFor="edit-email">
                      Email
                    </label>

                    <input
                      id="edit-email"
                      name="email"
                      type="email"
                      value={
                        editForm.email
                      }
                      onChange={
                        handleEditChange
                      }
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="student-form-field">
                    <label htmlFor="edit-phone">
                      Phone Number
                    </label>

                    <input
                      id="edit-phone"
                      name="phoneNumber"
                      value={
                        editForm.phoneNumber
                      }
                      onChange={
                        handleEditChange
                      }
                      disabled={saving}
                    />
                  </div>

                  <div className="student-form-field">
                    <label htmlFor="edit-dob">
                      Date of Birth
                    </label>

                    <input
                      id="edit-dob"
                      name="dateOfBirth"
                      type="date"
                      value={
                        editForm.dateOfBirth
                      }
                      onChange={
                        handleEditChange
                      }
                      disabled={saving}
                    />
                  </div>

                  <div className="student-form-field">
                    <label htmlFor="edit-gender">
                      Gender
                    </label>

                    <input
                      id="edit-gender"
                      name="gender"
                      value={
                        editForm.gender
                      }
                      onChange={
                        handleEditChange
                      }
                      disabled={saving}
                    />
                  </div>

                  <div className="student-form-field">
                    <label htmlFor="edit-nationality">
                      Nationality
                    </label>

                    <input
                      id="edit-nationality"
                      name="nationality"
                      value={
                        editForm.nationality
                      }
                      onChange={
                        handleEditChange
                      }
                      disabled={saving}
                    />
                  </div>

                  <div className="student-form-field student-form-full">
                    <label htmlFor="edit-address">
                      Address
                    </label>

                    <textarea
                      id="edit-address"
                      name="address"
                      value={
                        editForm.address
                      }
                      onChange={
                        handleEditChange
                      }
                      rows="4"
                      disabled={saving}
                    />
                  </div>

                  <div className="student-form-field student-form-full">
                    <label htmlFor="edit-photo">
                      Profile Photo URL
                    </label>

                    <input
                      id="edit-photo"
                      name="profilePhoto"
                      value={
                        editForm.profilePhoto
                      }
                      onChange={
                        handleEditChange
                      }
                      placeholder="Optional image URL"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="student-modal-actions">
                  <button
                    type="button"
                    className="student-modal-cancel"
                    onClick={
                      closeModals
                    }
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="student-modal-submit"
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

export default StudentManagement;