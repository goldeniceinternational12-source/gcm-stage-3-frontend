import { useEffect, useState } from "react";

import enrollmentService from "../../services/enrollmentService";

import "./MyProgramme.css";

function formatDate(date) {
  if (!date) {
    return "Not set";
  }

  return new Date(date).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

function MyProgramme() {
  const [enrollment, setEnrollment] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadProgramme = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await enrollmentService.getCurrentEnrollment();

        setEnrollment(
          response.enrollment || null
        );
      } catch (err) {
        console.error(
          "Unable to load programme:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load your programme information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProgramme();
  }, []);

  if (loading) {
    return (
      <div className="programme-page">
        <div className="programme-message">
          Loading your programme...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="programme-page">
        <div className="programme-message programme-error">
          {error}
        </div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="programme-page">
        <div className="programme-message">
          No active academic programme was found.
        </div>
      </div>
    );
  }

  const {
    academicYear,
    programme,
    semester,
    startDate,
    endDate,
    enrollmentStatus,
    completionStatus,
    courses,
    notes,
  } = enrollment;

  return (
    <div className="programme-page">

      {/* PAGE HEADER */}
      <div className="programme-header">

        <span>
          ACADEMIC PROGRAMME
        </span>

        <h1>
          My Programme
        </h1>

        <p>
          Your current academic programme
          and enrollment information.
        </p>

      </div>


      {/* PROGRAMME HERO */}
      <section className="programme-hero">

        <div className="programme-hero-content">

          <span>
            CURRENT PROGRAMME
          </span>

          <h2>
            {programme}
          </h2>

          <p>
            {academicYear} Academic Year
          </p>

        </div>


        <div
          className={`programme-status ${
            enrollmentStatus === "ACTIVE"
              ? "active"
              : "inactive"
          }`}
        >
          {enrollmentStatus}
        </div>

      </section>


      {/* PROGRAMME INFORMATION */}
      <section className="programme-section">

        <div className="programme-section-heading">

          <span>
            ENROLLMENT INFORMATION
          </span>

          <h2>
            Current Academic Record
          </h2>

        </div>


        <div className="programme-info-grid">

          <div className="programme-info-card">

            <span>
              ACADEMIC YEAR
            </span>

            <strong>
              {academicYear}
            </strong>

          </div>


          <div className="programme-info-card">

            <span>
              SEMESTER
            </span>

            <strong>
              Semester {semester}
            </strong>

          </div>


          <div className="programme-info-card">

            <span>
              ENROLLMENT STATUS
            </span>

            <strong>
              {enrollmentStatus}
            </strong>

          </div>


          <div className="programme-info-card">

            <span>
              COMPLETION STATUS
            </span>

            <strong>
              {completionStatus}
            </strong>

          </div>


          <div className="programme-info-card">

            <span>
              START DATE
            </span>

            <strong>
              {formatDate(startDate)}
            </strong>

          </div>


          <div className="programme-info-card">

            <span>
              END DATE
            </span>

            <strong>
              {formatDate(endDate)}
            </strong>

          </div>

        </div>

      </section>


      {/* COURSE SUMMARY */}
      <section className="programme-section">

        <div className="programme-section-heading">

          <span>
            ACADEMIC LOAD
          </span>

          <h2>
            Current Courses
          </h2>

        </div>


        <div className="course-summary">

          <div className="course-count">

            <strong>
              {Array.isArray(courses)
                ? courses.length
                : 0}
            </strong>

            <span>
              Courses assigned
            </span>

          </div>


          <div className="course-summary-text">

            <p>
              Your courses for this academic
              year will appear here once they
              have been assigned by the
              academic administration.
            </p>

          </div>

        </div>

      </section>


      {/* NOTES */}
      {notes && (
        <section className="programme-section">

          <div className="programme-section-heading">

            <span>
              ACADEMIC NOTES
            </span>

            <h2>
              Programme Notes
            </h2>

          </div>


          <div className="programme-notes">

            {notes}

          </div>

        </section>
      )}

    </div>
  );
}

export default MyProgramme;