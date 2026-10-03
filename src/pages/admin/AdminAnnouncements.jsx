import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import gcmLogo from "../../assets/images/gcm-logo.png";
import "./AdminAnnouncements.css";

const emptyForm = {
  title: "",
  message: "",
  audience: "ALL_STUDENTS",
  programme: "",
  academicYear: "",
  priority: "NORMAL",
  expiresAt: "",
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getAudienceLabel = (audience) => {
  switch (audience) {
    case "PROGRAMME":
      return "Programme";
    case "ACADEMIC_YEAR":
      return "Academic Year";
    case "ALL_STUDENTS":
    default:
      return "All Students";
  }
};

const getPriorityLabel = (priority) => {
  switch (priority) {
    case "IMPORTANT":
      return "Important";
    case "URGENT":
      return "Urgent";
    case "NORMAL":
    default:
      return "Normal";
  }
};

const getStatusLabel = (status) => {
  return status === "PUBLISHED"
    ? "Published"
    : "Draft";
};

const getPriorityClass = (priority) => {
  switch (priority) {
    case "URGENT":
      return "priority-urgent";
    case "IMPORTANT":
      return "priority-important";
    default:
      return "priority-normal";
  }
};

const getStatusClass = (status) => {
  return status === "PUBLISHED"
    ? "status-published"
    : "status-draft";
};

export default function AdminAnnouncements() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);

  const [announcements, setAnnouncements] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [actionId, setActionId] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [priorityFilter, setPriorityFilter] =
    useState("ALL");

  const [audienceFilter, setAudienceFilter] =
    useState("ALL");

  const [showForm, setShowForm] =
    useState(false);

  const [editingAnnouncement, setEditingAnnouncement] =
    useState(null);

  const [form, setForm] =
    useState(emptyForm);

  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState(null);

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const [publishTarget, setPublishTarget] =
    useState(null);

  useEffect(() => {
    const token =
      localStorage.getItem(
        "gcm_admin_token"
      );

    const storedAdmin =
      localStorage.getItem(
        "gcm_admin"
      );

    if (!token) {
      navigate("/admin/login", {
        replace: true,
      });
      return;
    }

    if (storedAdmin) {
      try {
        setAdmin(
          JSON.parse(storedAdmin)
        );
      } catch {
        setAdmin(null);
      }
    }

    loadAnnouncements();
  }, [navigate]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }

      if (priorityFilter !== "ALL") {
        params.priority =
          priorityFilter;
      }

      if (audienceFilter !== "ALL") {
        params.audience =
          audienceFilter;
      }

      if (search.trim()) {
        params.search =
          search.trim();
      }

      const response =
        await api.get(
          "/announcements",
          { params }
        );

      const data = response.data;

      if (!response.status || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to load announcements."
        );
      }

      setAnnouncements(
        Array.isArray(
          data.announcements
        )
          ? data.announcements
          : []
      );
    } catch (requestError) {
      console.error(
        "Load announcements error:",
        requestError
      );

      if (
        requestError?.response
          ?.status === 401
      ) {
        localStorage.removeItem(
          "gcm_admin_token"
        );

        localStorage.removeItem(
          "gcm_admin"
        );

        navigate(
          "/admin/login",
          { replace: true }
        );

        return;
      }

      setError(
        requestError?.response
          ?.data?.message ||
          requestError?.message ||
          "Unable to load announcements."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAnnouncements();
    }, 250);

    return () => clearTimeout(timer);
  }, [
    statusFilter,
    priorityFilter,
    audienceFilter,
    search,
  ]);

  const stats = useMemo(() => {
    const total =
      announcements.length;

    const published =
      announcements.filter(
        (item) =>
          item.status ===
          "PUBLISHED"
      ).length;

    const drafts =
      announcements.filter(
        (item) =>
          item.status ===
          "DRAFT"
      ).length;

    const urgent =
      announcements.filter(
        (item) =>
          item.priority ===
          "URGENT"
      ).length;

    return {
      total,
      published,
      drafts,
      urgent,
    };
  }, [announcements]);

  const filteredAnnouncements =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return announcements;
      }

      return announcements.filter(
        (announcement) => {
          const searchable = [
            announcement.title,
            announcement.message,
            announcement.programme,
            announcement.academicYear,
            announcement.audience,
            announcement.priority,
            announcement.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            query
          );
        }
      );
    },
    [announcements, search]
  );

  const handleFormChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const openCreateForm = () => {
    setEditingAnnouncement(
      null
    );

    setForm({
      ...emptyForm,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (
    announcement
  ) => {
    setEditingAnnouncement(
      announcement
    );

    setForm({
      title:
        announcement.title || "",
      message:
        announcement.message ||
        "",
      audience:
        announcement.audience ||
        "ALL_STUDENTS",
      programme:
        announcement.programme ||
        "",
      academicYear:
        announcement.academicYear ||
        "",
      priority:
        announcement.priority ||
        "NORMAL",
      expiresAt:
        announcement.expiresAt
          ? new Date(
              announcement.expiresAt
            )
              .toISOString()
              .slice(0, 16)
          : "",
    });

    setSelectedAnnouncement(
      null
    );

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingAnnouncement(
      null
    );
    setForm({
      ...emptyForm,
    });
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      return "Announcement title is required.";
    }

    if (!form.message.trim()) {
      return "Announcement message is required.";
    }

    if (
      form.audience ===
        "PROGRAMME" &&
      !form.programme.trim()
    ) {
      return "Programme is required for a programme announcement.";
    }

    if (
      form.audience ===
        "ACADEMIC_YEAR" &&
      !form.academicYear.trim()
    ) {
      return "Academic year is required for an academic-year announcement.";
    }

    return "";
  };

  const buildPayload = () => {
    return {
      title: form.title.trim(),
      message: form.message.trim(),
      audience: form.audience,
      programme:
        form.audience ===
        "PROGRAMME"
          ? form.programme.trim()
          : "",
      academicYear:
        form.audience ===
        "ACADEMIC_YEAR"
          ? form.academicYear.trim()
          : "",
      priority: form.priority,
      expiresAt:
        form.expiresAt || null,
    };
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload =
        buildPayload();

      let response;

      if (editingAnnouncement) {
        response =
          await api.patch(
            `/announcements/${editingAnnouncement._id}`,
            payload
          );
      } else {
        response =
          await api.post(
            "/announcements",
            payload
          );
      }

      const data =
        response.data;

      if (
        !response.status ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to save announcement."
        );
      }

      setSuccess(
        editingAnnouncement
          ? "Announcement updated successfully."
          : "Announcement created successfully."
      );

      setShowForm(false);
      setEditingAnnouncement(
        null
      );
      setForm({
        ...emptyForm,
      });

      await loadAnnouncements();
    } catch (requestError) {
      console.error(
        "Save announcement error:",
        requestError
      );

      setError(
        requestError?.response
          ?.data?.message ||
          requestError?.message ||
          "Unable to save announcement."
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!publishTarget) {
      return;
    }

    try {
      setActionId(
        publishTarget._id
      );
      setError("");
      setSuccess("");

      const response =
        await api.patch(
          `/announcements/${publishTarget._id}/publish`
        );

      const data =
        response.data;

      if (
        !response.status ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to publish announcement."
        );
      }

      setSuccess(
        "Announcement published successfully."
      );

      setPublishTarget(null);

      await loadAnnouncements();
    } catch (requestError) {
      console.error(
        "Publish announcement error:",
        requestError
      );

      setError(
        requestError?.response
          ?.data?.message ||
          requestError?.message ||
          "Unable to publish announcement."
      );
    } finally {
      setActionId("");
    }
  };

  const handleUnpublish = async (
    announcement
  ) => {
    try {
      setActionId(
        announcement._id
      );
      setError("");
      setSuccess("");

      const response =
        await api.patch(
          `/announcements/${announcement._id}/unpublish`
        );

      const data =
        response.data;

      if (
        !response.status ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to unpublish announcement."
        );
      }

      setSuccess(
        "Announcement moved back to draft."
      );

      await loadAnnouncements();
    } catch (requestError) {
      console.error(
        "Unpublish announcement error:",
        requestError
      );

      setError(
        requestError?.response
          ?.data?.message ||
          requestError?.message ||
          "Unable to unpublish announcement."
      );
    } finally {
      setActionId("");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setActionId(
        deleteTarget._id
      );
      setError("");
      setSuccess("");

      const response =
        await api.delete(
          `/announcements/${deleteTarget._id}`
        );

      const data =
        response.data;

      if (
        !response.status ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to delete announcement."
        );
      }

      setSuccess(
        "Announcement deleted successfully."
      );

      setDeleteTarget(null);

      if (
        selectedAnnouncement?._id ===
        deleteTarget._id
      ) {
        setSelectedAnnouncement(
          null
        );
      }

      await loadAnnouncements();
    } catch (requestError) {
      console.error(
        "Delete announcement error:",
        requestError
      );

      setError(
        requestError?.response
          ?.data?.message ||
          requestError?.message ||
          "Unable to delete announcement."
      );
    } finally {
      setActionId("");
    }
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

  return (
    <div className="admin-announcements-page">
      <header className="admin-announcements-header">
        <div className="admin-announcements-brand">
          <img
            src={gcmLogo}
            alt="Global College of Missiology"
          />

          <div>
            <span>
              GLOBAL COLLEGE OF MISSIOLOGY
            </span>

            <strong>
              ADMINISTRATION
            </strong>
          </div>
        </div>

        <div className="admin-announcements-header-right">
          <div className="admin-user-info">
            <span>
              {admin?.fullName ||
                "Administrator"}
            </span>

            <small>
              {admin?.email ||
                ""}
            </small>
          </div>

          <button
            type="button"
            className="admin-logout-button"
            onClick={
              handleLogout
            }
          >
            Logout
          </button>
        </div>
      </header>

      <main className="admin-announcements-main">
        <div className="admin-announcements-topbar">
          <div>
            <Link
              to="/admin/dashboard"
              className="admin-back-link"
            >
              ← Dashboard
            </Link>

            <span className="admin-section-label">
              COMMUNICATIONS
            </span>

            <h1>
              Announcements
            </h1>

            <p>
              Create, manage and publish official
              communications for GCM students.
            </p>
          </div>

          <button
            type="button"
            className="gold-primary-button"
            onClick={
              openCreateForm
            }
          >
            <span>+</span>
            New Announcement
          </button>
        </div>

        {error && (
          <div className="admin-alert admin-alert-error">
            <strong>
              Error
            </strong>
            <span>
              {error}
            </span>
          </div>
        )}

        {success && (
          <div className="admin-alert admin-alert-success">
            <strong>
              Success
            </strong>
            <span>
              {success}
            </span>
          </div>
        )}

        <section className="announcement-stat-grid">
          <article className="announcement-stat-card">
            <span>
              TOTAL
            </span>
            <strong>
              {stats.total}
            </strong>
            <small>
              All announcements
            </small>
          </article>

          <article className="announcement-stat-card">
            <span>
              PUBLISHED
            </span>
            <strong>
              {stats.published}
            </strong>
            <small>
              Visible to students
            </small>
          </article>

          <article className="announcement-stat-card">
            <span>
              DRAFTS
            </span>
            <strong>
              {stats.drafts}
            </strong>
            <small>
              Awaiting publication
            </small>
          </article>

          <article className="announcement-stat-card">
            <span>
              URGENT
            </span>
            <strong>
              {stats.urgent}
            </strong>
            <small>
              Priority notices
            </small>
          </article>
        </section>

        <section className="announcement-controls">
          <div className="announcement-search">
            <span>
              ⌕
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search announcements..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Statuses
            </option>

            <option value="DRAFT">
              Drafts
            </option>

            <option value="PUBLISHED">
              Published
            </option>
          </select>

          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Priorities
            </option>

            <option value="NORMAL">
              Normal
            </option>

            <option value="IMPORTANT">
              Important
            </option>

            <option value="URGENT">
              Urgent
            </option>
          </select>

          <select
            value={audienceFilter}
            onChange={(event) =>
              setAudienceFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Audiences
            </option>

            <option value="ALL_STUDENTS">
              All Students
            </option>

            <option value="PROGRAMME">
              Programme
            </option>

            <option value="ACADEMIC_YEAR">
              Academic Year
            </option>
          </select>

          <button
            type="button"
            className="refresh-button"
            onClick={
              loadAnnouncements
            }
            disabled={loading}
          >
            ↻
          </button>
        </section>

        <section className="announcement-table-card">
          <div className="announcement-table-heading">
            <div>
              <span>
                OFFICIAL COMMUNICATION
              </span>

              <h2>
                Announcement Registry
              </h2>
            </div>

            <span className="announcement-count">
              {filteredAnnouncements.length}{" "}
              record
              {filteredAnnouncements.length ===
              1
                ? ""
                : "s"}
            </span>
          </div>

          {loading ? (
            <div className="announcement-loading">
              <div className="loading-spinner" />
              <p>
                Loading announcements...
              </p>
            </div>
          ) : filteredAnnouncements.length ===
            0 ? (
            <div className="announcement-empty">
              <div className="empty-icon">
                ✦
              </div>

              <h3>
                No announcements found
              </h3>

              <p>
                Create an announcement to begin
                communicating with students.
              </p>

              <button
                type="button"
                className="gold-primary-button"
                onClick={
                  openCreateForm
                }
              >
                Create Announcement
              </button>
            </div>
          ) : (
            <div className="announcement-table-wrap">
              <table className="announcement-table">
                <thead>
                  <tr>
                    <th>
                      ANNOUNCEMENT
                    </th>

                    <th>
                      AUDIENCE
                    </th>

                    <th>
                      PRIORITY
                    </th>

                    <th>
                      STATUS
                    </th>

                    <th>
                      CREATED
                    </th>

                    <th>
                      ACTIONS
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAnnouncements.map(
                    (announcement) => (
                      <tr
                        key={
                          announcement._id
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="announcement-title-button"
                            onClick={() =>
                              setSelectedAnnouncement(
                                announcement
                              )
                            }
                          >
                            <strong>
                              {
                                announcement.title
                              }
                            </strong>

                            <span>
                              {announcement.message.length >
                              100
                                ? `${announcement.message.slice(
                                    0,
                                    100
                                  )}...`
                                : announcement.message}
                            </span>
                          </button>
                        </td>

                        <td>
                          <div className="audience-cell">
                            <span>
                              {getAudienceLabel(
                                announcement.audience
                              )}
                            </span>

                            {announcement.audience ===
                              "PROGRAMME" &&
                              announcement.programme && (
                                <small>
                                  {
                                    announcement.programme
                                  }
                                </small>
                              )}

                            {announcement.audience ===
                              "ACADEMIC_YEAR" &&
                              announcement.academicYear && (
                                <small>
                                  {
                                    announcement.academicYear
                                  }
                                </small>
                              )}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`priority-badge ${getPriorityClass(
                              announcement.priority
                            )}`}
                          >
                            {
                              getPriorityLabel(
                                announcement.priority
                              )
                            }
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status-badge ${getStatusClass(
                              announcement.status
                            )}`}
                          >
                            <i />
                            {
                              getStatusLabel(
                                announcement.status
                              )
                            }
                          </span>
                        </td>

                        <td>
                          <div className="created-cell">
                            <strong>
                              {formatDate(
                                announcement.createdAt
                              )}
                            </strong>

                            <small>
                              {formatDateTime(
                                announcement.createdAt
                              )}
                            </small>
                          </div>
                        </td>

                        <td>
                          <div className="announcement-actions">
                            <button
                              type="button"
                              className="action-button view-action"
                              onClick={() =>
                                setSelectedAnnouncement(
                                  announcement
                                )
                              }
                            >
                              View
                            </button>

                            <button
                              type="button"
                              className="action-button edit-action"
                              onClick={() =>
                                openEditForm(
                                  announcement
                                )
                              }
                            >
                              Edit
                            </button>

                            {announcement.status ===
                            "PUBLISHED" ? (
                              <button
                                type="button"
                                className="action-button unpublish-action"
                                disabled={
                                  actionId ===
                                  announcement._id
                                }
                                onClick={() =>
                                  handleUnpublish(
                                    announcement
                                  )
                                }
                              >
                                {actionId ===
                                announcement._id
                                  ? "..."
                                  : "Unpublish"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="action-button publish-action"
                                onClick={() =>
                                  setPublishTarget(
                                    announcement
                                  )
                                }
                              >
                                Publish
                              </button>
                            )}

                            <button
                              type="button"
                              className="action-button delete-action"
                              onClick={() =>
                                setDeleteTarget(
                                  announcement
                                )
                              }
                            >
                              Delete
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
      </main>

      {showForm && (
        <div
          className="announcement-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <div className="announcement-modal announcement-form-modal">
            <div className="modal-header">
              <div>
                <span>
                  {editingAnnouncement
                    ? "EDIT ANNOUNCEMENT"
                    : "NEW ANNOUNCEMENT"}
                </span>

                <h2>
                  {editingAnnouncement
                    ? "Update Announcement"
                    : "Create Announcement"}
                </h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  closeForm
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div className="form-section">
                <label>
                  Title
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="title"
                  value={
                    form.title
                  }
                  onChange={
                    handleFormChange
                  }
                  maxLength={200}
                  placeholder="Enter announcement title"
                  required
                />
              </div>

              <div className="form-section">
                <label>
                  Message
                  <span>*</span>
                </label>

                <textarea
                  name="message"
                  value={
                    form.message
                  }
                  onChange={
                    handleFormChange
                  }
                  maxLength={10000}
                  rows={7}
                  placeholder="Write the official announcement..."
                  required
                />

                <small className="character-count">
                  {
                    form.message
                      .length
                  }{" "}
                  / 10000
                </small>
              </div>

              <div className="form-grid">
                <div className="form-section">
                  <label>
                    Audience
                    <span>*</span>
                  </label>

                  <select
                    name="audience"
                    value={
                      form.audience
                    }
                    onChange={
                      handleFormChange
                    }
                  >
                    <option value="ALL_STUDENTS">
                      All Students
                    </option>

                    <option value="PROGRAMME">
                      Specific Programme
                    </option>

                    <option value="ACADEMIC_YEAR">
                      Specific Academic Year
                    </option>
                  </select>
                </div>

                <div className="form-section">
                  <label>
                    Priority
                    <span>*</span>
                  </label>

                  <select
                    name="priority"
                    value={
                      form.priority
                    }
                    onChange={
                      handleFormChange
                    }
                  >
                    <option value="NORMAL">
                      Normal
                    </option>

                    <option value="IMPORTANT">
                      Important
                    </option>

                    <option value="URGENT">
                      Urgent
                    </option>
                  </select>
                </div>
              </div>

              {form.audience ===
                "PROGRAMME" && (
                <div className="form-section">
                  <label>
                    Programme
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="programme"
                    value={
                      form.programme
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Enter programme name"
                    required
                  />
                </div>
              )}

              {form.audience ===
                "ACADEMIC_YEAR" && (
                <div className="form-section">
                  <label>
                    Academic Year
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="academicYear"
                    value={
                      form.academicYear
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="e.g. 2026/2027"
                    required
                  />
                </div>
              )}

              <div className="form-section">
                <label>
                  Expiration
                  <span className="optional">
                    Optional
                  </span>
                </label>

                <input
                  type="datetime-local"
                  name="expiresAt"
                  value={
                    form.expiresAt
                  }
                  onChange={
                    handleFormChange
                  }
                />

                <small className="form-help">
                  Leave empty if the announcement
                  should remain active until manually
                  unpublished.
                </small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeForm
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="gold-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingAnnouncement
                    ? "Save Changes"
                    : "Create Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedAnnouncement && (
        <div
          className="announcement-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedAnnouncement(
                null
              );
            }
          }}
        >
          <div className="announcement-modal announcement-view-modal">
            <div className="modal-header">
              <div>
                <span>
                  ANNOUNCEMENT
                </span>

                <h2>
                  {
                    selectedAnnouncement.title
                  }
                </h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setSelectedAnnouncement(
                    null
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="announcement-view-meta">
              <span
                className={`priority-badge ${getPriorityClass(
                  selectedAnnouncement.priority
                )}`}
              >
                {getPriorityLabel(
                  selectedAnnouncement.priority
                )}
              </span>

              <span
                className={`status-badge ${getStatusClass(
                  selectedAnnouncement.status
                )}`}
              >
                <i />
                {getStatusLabel(
                  selectedAnnouncement.status
                )}
              </span>

              <span className="view-audience">
                {getAudienceLabel(
                  selectedAnnouncement.audience
                )}
              </span>
            </div>

            <div className="announcement-full-message">
              {selectedAnnouncement.message}
            </div>

            <div className="announcement-details-grid">
              <div>
                <span>
                  Created
                </span>

                <strong>
                  {formatDateTime(
                    selectedAnnouncement.createdAt
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Published
                </span>

                <strong>
                  {formatDateTime(
                    selectedAnnouncement.publishedAt
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Expires
                </span>

                <strong>
                  {formatDateTime(
                    selectedAnnouncement.expiresAt
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Audience
                </span>

                <strong>
                  {getAudienceLabel(
                    selectedAnnouncement.audience
                  )}
                </strong>
              </div>
            </div>

            {selectedAnnouncement.audience ===
              "PROGRAMME" &&
              selectedAnnouncement.programme && (
                <div className="view-target-box">
                  <span>
                    Programme
                  </span>

                  <strong>
                    {
                      selectedAnnouncement.programme
                    }
                  </strong>
                </div>
              )}

            {selectedAnnouncement.audience ===
              "ACADEMIC_YEAR" &&
              selectedAnnouncement.academicYear && (
                <div className="view-target-box">
                  <span>
                    Academic Year
                  </span>

                  <strong>
                    {
                      selectedAnnouncement.academicYear
                    }
                  </strong>
                </div>
              )}

            <div className="view-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setSelectedAnnouncement(
                    null
                  )
                }
              >
                Close
              </button>

              <button
                type="button"
                className="gold-primary-button"
                onClick={() =>
                  openEditForm(
                    selectedAnnouncement
                  )
                }
              >
                Edit Announcement
              </button>
            </div>
          </div>
        </div>
      )}

      {publishTarget && (
        <div
          className="announcement-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setPublishTarget(
                null
              );
            }
          }}
        >
          <div className="announcement-modal confirmation-modal">
            <div className="confirmation-icon">
              ✓
            </div>

            <span className="confirmation-label">
              PUBLISH ANNOUNCEMENT
            </span>

            <h2>
              Publish this announcement?
            </h2>

            <p>
              This announcement will become visible
              to the selected students immediately.
            </p>

            <strong>
              {publishTarget.title}
            </strong>

            <div className="confirmation-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setPublishTarget(
                    null
                  )
                }
                disabled={
                  actionId ===
                  publishTarget._id
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="gold-primary-button"
                onClick={
                  handlePublish
                }
                disabled={
                  actionId ===
                  publishTarget._id
                }
              >
                {actionId ===
                publishTarget._id
                  ? "Publishing..."
                  : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="announcement-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setDeleteTarget(
                null
              );
            }
          }}
        >
          <div className="announcement-modal confirmation-modal">
            <div className="delete-confirmation-icon">
              !
            </div>

            <span className="confirmation-label">
              DELETE ANNOUNCEMENT
            </span>

            <h2>
              Delete this announcement?
            </h2>

            <p>
              This action permanently removes the
              announcement and cannot be undone.
            </p>

            <strong>
              {deleteTarget.title}
            </strong>

            <div className="confirmation-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setDeleteTarget(
                    null
                  )
                }
                disabled={
                  actionId ===
                  deleteTarget._id
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger-button"
                onClick={
                  handleDelete
                }
                disabled={
                  actionId ===
                  deleteTarget._id
                }
              >
                {actionId ===
                deleteTarget._id
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}