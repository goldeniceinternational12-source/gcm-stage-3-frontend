import { useEffect, useState } from "react";

import enrollmentService from "../../services/enrollmentService";

import "./AcademicHistory.css";

function formatDate(date) {
    if (!date) {
        return "—";
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

function AcademicHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadHistory = async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await enrollmentService.getAcademicHistory();

                setHistory(response.enrollments || []);
            } catch (err) {
                console.error(
                    "Academic history error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Unable to load academic history."
                );
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, []);

    return (
        <div className="academic-history-page">

            <div className="history-header">

                <span>ACADEMIC RECORD</span>

                <h1>Academic History</h1>

                <p>
                    Your academic years, programmes,
                    semesters, and enrollment records.
                </p>

            </div>


            {loading && (
                <div className="history-message">
                    Loading academic history...
                </div>
            )}


            {!loading && error && (
                <div className="history-message history-error">
                    {error}
                </div>
            )}


            {!loading &&
                !error &&
                history.length === 0 && (
                    <div className="history-message">
                        No academic history is available yet.
                    </div>
                )}


            {!loading &&
                !error &&
                history.length > 0 && (

                    <div className="history-list">

                        {history.map((enrollment) => {

                            const isCurrent =
                                enrollment.enrollmentStatus ===
                                "ACTIVE";

                            return (
                                <article
                                    className={`history-card ${
                                        isCurrent
                                            ? "current"
                                            : ""
                                    }`}
                                    key={enrollment._id}
                                >

                                    <div className="history-card-top">

                                        <div>

                                            <span className="history-year">
                                                {enrollment.academicYear}
                                                {" "}
                                                Academic Year
                                            </span>

                                            <h2>
                                                {enrollment.programme}
                                            </h2>

                                        </div>


                                        <span
                                            className={`history-status ${
                                                isCurrent
                                                    ? "active"
                                                    : "completed"
                                            }`}
                                        >
                                            {enrollment.enrollmentStatus}
                                        </span>

                                    </div>


                                    <div className="history-details">

                                        <div>
                                            <span>
                                                SEMESTER
                                            </span>

                                            <strong>
                                                Semester{" "}
                                                {enrollment.semester}
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                START DATE
                                            </span>

                                            <strong>
                                                {formatDate(
                                                    enrollment.startDate
                                                )}
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                END DATE
                                            </span>

                                            <strong>
                                                {formatDate(
                                                    enrollment.endDate
                                                )}
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                COMPLETION
                                            </span>

                                            <strong>
                                                {
                                                    enrollment.completionStatus
                                                }
                                            </strong>
                                        </div>

                                    </div>

                                </article>
                            );
                        })}

                    </div>
                )}

        </div>
    );
}

export default AcademicHistory;