import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import gcmLogo from "../../assets/images/gcm-logo.png";
import "./Results.css";

function Results() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResults = async () => {
      try {
        const token = localStorage.getItem("gcm_student_token");

        if (!token) {
          navigate("/student/login");
          return;
        }

        const response = await api.get("/results/current");

        setData(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("gcm_student_token");
          localStorage.removeItem("gcm_student");
          navigate("/student/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load your results."
        );
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [navigate]);

  const formatScore = (score) => {
    if (score === undefined || score === null) {
      return "—";
    }

    return Number(score).toFixed(1);
  };

  return (
    <div className="results-page">
      <header className="results-header">
        <div className="results-header-inner">
          <button
            className="results-logo-button"
            onClick={() => navigate("/student/dashboard")}
          >
            <img
              src={gcmLogo}
              alt="Global College of Missiology"
              className="results-logo"
            />
          </button>

          <div className="results-header-title">
            <span>GCM STUDENT PORTAL</span>
            <strong>Results</strong>
          </div>

          <button
            className="results-back-button"
            onClick={() => navigate("/student/dashboard")}
          >
            Dashboard
          </button>
        </div>
      </header>

      <main className="results-main">
        <section className="results-hero">
          <div>
            <p className="results-eyebrow">
              ACADEMIC RECORD
            </p>

            <h1>My Results</h1>

            <p>
              View your published academic results for the
              current academic period.
            </p>
          </div>

          {data && (
            <div className="results-academic-info">
              <span>
                Academic Year
                <strong>{data.academicYear}</strong>
              </span>

              <span>
                Programme
                <strong>{data.programme}</strong>
              </span>

              <span>
                Semester
                <strong>{data.semester}</strong>
              </span>
            </div>
          )}
        </section>

        {loading && (
          <section className="results-state">
            <div className="results-spinner"></div>
            <p>Loading your results...</p>
          </section>
        )}

        {!loading && error && (
          <section className="results-state results-error">
            <h2>Unable to load results</h2>
            <p>{error}</p>

            <button
              onClick={() =>
                window.location.reload()
              }
            >
              Try Again
            </button>
          </section>
        )}

        {!loading &&
          !error &&
          data &&
          (!data.results || data.results.length === 0) && (
            <section className="results-state">
              <div className="results-empty-icon">
                R
              </div>

              <h2>No Published Results Yet</h2>

              <p>
                Your results will appear here once they
                have been released by the college.
              </p>
            </section>
          )}

        {!loading &&
          !error &&
          data &&
          data.results &&
          data.results.length > 0 && (
            <>
              <section className="results-summary">
                <div className="results-summary-card">
                  <span>Total Courses</span>
                  <strong>{data.results.length}</strong>
                </div>

                <div className="results-summary-card">
                  <span>Published Courses</span>
                  <strong>{data.results.length}</strong>
                </div>

                <div className="results-summary-card">
                  <span>Academic Period</span>
                  <strong>
                    Semester {data.semester}
                  </strong>
                </div>
              </section>

              <section className="results-table-section">
                <div className="results-section-heading">
                  <div>
                    <p>ACADEMIC PERFORMANCE</p>
                    <h2>Semester Results</h2>
                  </div>

                  <span>
                    {data.results.length} course
                    {data.results.length !== 1
                      ? "s"
                      : ""}
                  </span>
                </div>

                <div className="results-table-wrapper">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Credits</th>
                        <th>Assessment</th>
                        <th>Examination</th>
                        <th>Total</th>
                        <th>Grade</th>
                        <th>Point</th>
                        <th>Remark</th>
                      </tr>
                    </thead>

                    <tbody>
                      {data.results.map((result) => (
                        <tr key={result._id}>
                          <td>
                            <div className="result-course">
                              <strong>
                                {result.course?.courseCode ||
                                  "—"}
                              </strong>

                              <span>
                                {result.course?.title ||
                                  "Course"}
                              </span>
                            </div>
                          </td>

                          <td>
                            {result.course?.creditUnits ??
                              "—"}
                          </td>

                          <td>
                            {formatScore(
                              result.assessmentScore
                            )}
                          </td>

                          <td>
                            {formatScore(
                              result.examinationScore
                            )}
                          </td>

                          <td className="result-total">
                            {formatScore(
                              result.totalScore
                            )}
                          </td>

                          <td>
                            <span className="result-grade">
                              {result.grade || "—"}
                            </span>
                          </td>

                          <td>
                            {result.gradePoint ??
                              "—"}
                          </td>

                          <td>
                            <span className="result-remark">
                              {result.remarks || "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

        <section className="results-notice">
          <div className="results-notice-icon">
            i
          </div>

          <div>
            <h3>Important Notice</h3>

            <p>
              Only results officially published by Global
              College of Missiology are displayed in this
              portal. If you believe there is an issue with
              a published result, contact the appropriate
              college office.
            </p>
          </div>
        </section>

        <button
          className="results-history-button"
          onClick={() =>
            navigate("/student/academic-history")
          }
        >
          View Academic History
        </button>
      </main>

      <footer className="results-footer">
        <span>
          Global College of Missiology
        </span>

        <span>
          Student Academic Portal
        </span>
      </footer>
    </div>
  );
}

export default Results;