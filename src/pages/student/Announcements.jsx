import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Announcements.css";
import gcmLogo from "../../assets/images/gcm-logo.png";

const priorityOrder = {
  URGENT: 1,
  HIGH: 2,
  NORMAL: 3,
  LOW: 4,
};

const priorityLabel = {
  URGENT: "Urgent",
  HIGH: "High Priority",
  NORMAL: "General",
  LOW: "Low Priority",
};

export default function Announcements() {
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const student = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("gcm_student") || "null");
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("gcm_student_token");

    if (!token) {
      navigate("/student/login");
      return;
    }

    loadAnnouncements();
  }, [navigate]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/announcements/student");

      const data = response.data;

      if (Array.isArray(data)) {
        setAnnouncements(data);
      } else if (Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      } else if (Array.isArray(data.data)) {
        setAnnouncements(data.data);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      console.error("Failed to load announcements:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("gcm_student_token");
        localStorage.removeItem("gcm_student");
        navigate("/student/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load announcements. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...announcements]
      .filter((announcement) => {
        if (priority === "ALL") return true;

        return (
          String(announcement.priority || "NORMAL").toUpperCase() === priority
        );
      })
      .filter((announcement) => {
        if (!query) return true;

        return (
          String(announcement.title || "")
            .toLowerCase()
            .includes(query) ||
          String(announcement.message || "")
            .toLowerCase()
            .includes(query) ||
          String(announcement.programme || "")
            .toLowerCase()
            .includes(query)
        );
      })
      .sort((a, b) => {
        const priorityA =
          priorityOrder[String(a.priority || "NORMAL").toUpperCase()] || 99;

        const priorityB =
          priorityOrder[String(b.priority || "NORMAL").toUpperCase()] || 99;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        return (
          new Date(b.publishedAt || b.createdAt || 0).getTime() -
          new Date(a.publishedAt || a.createdAt || 0).getTime()
        );
      });
  }, [announcements, priority, search]);

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Date unavailable";
    }

    return parsed.toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "Date unavailable";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Date unavailable";
    }

    return parsed.toLocaleString("en-NG", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriority = (announcement) =>
    String(announcement.priority || "NORMAL").toUpperCase();

  const getAudienceLabel = (announcement) => {
    const audience = String(announcement.audience || "ALL").toUpperCase();

    if (audience === "PROGRAMME") {
      return announcement.programme
        ? announcement.programme
        : "Programme Students";
    }

    if (audience === "STUDENT") {
      return "Students";
    }

    return "All Students";
  };

  const closeModal = () => {
    setSelectedAnnouncement(null);
  };

  return (
    <div className="student-announcements-page">
      <header className="student-announcements-header">
        <div className="student-announcements-brand">
          <Link to="/student/dashboard" className="student-announcements-logo">
            <img src={gcmLogo} alt="Global College of Missiology" />
          </Link>

          <div>
            <span>GLOBAL COLLEGE OF MISSIOLOGY</span>
            <strong>Student Portal</strong>
          </div>
        </div>

        <Link
          to="/student/dashboard"
          className="student-announcements-back"
        >
          Dashboard
        </Link>
      </header>

      <main className="student-announcements-main">
        <section className="student-announcements-hero">
          <div className="student-announcements-hero-content">
            <span className="student-announcements-eyebrow">
              STUDENT PORTAL
            </span>

            <h1>Announcements</h1>

            <p>
              Stay informed about important academic updates, college notices,
              programme information and other messages from Global College of
              Missiology.
            </p>

            {student?.firstName && (
              <div className="student-announcements-welcome">
                Welcome, {student.firstName}
              </div>
            )}
          </div>

          <div className="student-announcements-hero-icon">
            <span>✦</span>
          </div>
        </section>

        <section className="student-announcements-toolbar">
          <div className="student-announcements-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search announcements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="student-announcements-filter">
            <label htmlFor="announcementPriority">Priority</label>

            <select
              id="announcementPriority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="ALL">All Announcements</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High Priority</option>
              <option value="NORMAL">General</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </section>

        {!loading && !error && (
          <section className="student-announcements-summary">
            <div>
              <strong>{filteredAnnouncements.length}</strong>
              <span>
                {filteredAnnouncements.length === 1
                  ? "announcement"
                  : "announcements"}
              </span>
            </div>

            <div>
              <strong>{announcements.length}</strong>
              <span>Total published</span>
            </div>
          </section>
        )}

        {loading && (
          <section className="student-announcements-state">
            <div className="announcement-spinner"></div>
            <h3>Loading announcements</h3>
            <p>Please wait while your latest college announcements load.</p>
          </section>
        )}

        {!loading && error && (
          <section className="student-announcements-state announcement-error">
            <div className="state-icon">!</div>
            <h3>Unable to load announcements</h3>
            <p>{error}</p>

            <button
              type="button"
              className="announcement-retry-btn"
              onClick={loadAnnouncements}
            >
              Try Again
            </button>
          </section>
        )}

        {!loading && !error && filteredAnnouncements.length === 0 && (
          <section className="student-announcements-state">
            <div className="state-icon">✦</div>

            <h3>
              {search || priority !== "ALL"
                ? "No matching announcements"
                : "No announcements yet"}
            </h3>

            <p>
              {search || priority !== "ALL"
                ? "Try changing your search or priority filter."
                : "There are currently no published announcements for you."}
            </p>
          </section>
        )}

        {!loading && !error && filteredAnnouncements.length > 0 && (
          <section className="student-announcements-list">
            {filteredAnnouncements.map((announcement) => {
              const currentPriority = getPriority(announcement);

              return (
                <article
                  className={`announcement-card priority-${currentPriority.toLowerCase()}`}
                  key={announcement._id || announcement.id}
                  onClick={() => setSelectedAnnouncement(announcement)}
                >
                  <div className="announcement-card-top">
                    <span
                      className={`announcement-priority priority-${currentPriority.toLowerCase()}`}
                    >
                      {priorityLabel[currentPriority] || "General"}
                    </span>

                    <span className="announcement-date">
                      {formatDate(
                        announcement.publishedAt || announcement.createdAt
                      )}
                    </span>
                  </div>

                  <div className="announcement-card-content">
                    <div className="announcement-symbol">✦</div>

                    <div className="announcement-main-content">
                      <h2>{announcement.title}</h2>

                      <p>
                        {String(announcement.message || "")
                          .replace(/<[^>]*>/g, "")
                          .slice(0, 220)}
                        {String(announcement.message || "").length > 220
                          ? "..."
                          : ""}
                      </p>

                      <div className="announcement-meta">
                        <span>{getAudienceLabel(announcement)}</span>

                        {announcement.academicYear && (
                          <span>{announcement.academicYear}</span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAnnouncement(announcement);
                          }}
                        >
                          Read announcement →
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {selectedAnnouncement && (
        <div
          className="announcement-modal-overlay"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="announcement-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="announcement-modal-header">
              <div>
                <span
                  className={`announcement-priority priority-${getPriority(
                    selectedAnnouncement
                  ).toLowerCase()}`}
                >
                  {priorityLabel[getPriority(selectedAnnouncement)] ||
                    "General"}
                </span>

                <h2>{selectedAnnouncement.title}</h2>

                <p>
                  Published{" "}
                  {formatDateTime(
                    selectedAnnouncement.publishedAt ||
                      selectedAnnouncement.createdAt
                  )}
                </p>
              </div>

              <button
                type="button"
                className="announcement-modal-close"
                onClick={closeModal}
                aria-label="Close announcement"
              >
                ×
              </button>
            </div>

            <div className="announcement-modal-divider"></div>

            <div
              className="announcement-modal-message"
              dangerouslySetInnerHTML={{
                __html: selectedAnnouncement.message || "",
              }}
            />

            <div className="announcement-modal-footer">
              <div>
                <span>Audience</span>
                <strong>{getAudienceLabel(selectedAnnouncement)}</strong>
              </div>

              {selectedAnnouncement.academicYear && (
                <div>
                  <span>Academic Year</span>
                  <strong>{selectedAnnouncement.academicYear}</strong>
                </div>
              )}
            </div>

            <button
              type="button"
              className="announcement-close-btn"
              onClick={closeModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}