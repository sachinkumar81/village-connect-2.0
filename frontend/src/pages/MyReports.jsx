import { useEffect, useState } from "react";

function MyReports() {
  const [reports, setReports] = useState([]);
  const [history, setHistory] = useState({});
  const [expandedHistory, setExpandedHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState({});
  const [error, setError] = useState("");

  // ==================================================
  // FETCH MY REPORTS
  // ==================================================

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login first.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/problems/my",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Failed to fetch reports"
        );
        return;
      }

      // Backend response is:
      // { message: "...", problems: [...] }

      setReports(data.problems || []);
    } catch (error) {
      console.error("Fetch reports error:", error);

      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // FETCH STATUS HISTORY
  // ==================================================

  const fetchHistory = async (problemId) => {
    try {
      const token = localStorage.getItem("token");

      setHistoryLoading((current) => ({
        ...current,
        [problemId]: true,
      }));

      const response = await fetch(
        `http://localhost:5000/api/problems/${problemId}/history`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to fetch status history"
        );
        return;
      }

      setHistory((current) => ({
        ...current,
        [problemId]: data.history || [],
      }));

      setExpandedHistory((current) => ({
        ...current,
        [problemId]: true,
      }));
    } catch (error) {
      console.error(
        "Fetch history error:",
        error
      );

      alert("Unable to connect to server");
    } finally {
      setHistoryLoading((current) => ({
        ...current,
        [problemId]: false,
      }));
    }
  };

  // ==================================================
  // TOGGLE HISTORY
  // ==================================================

  const toggleHistory = (problemId) => {
    // History is currently visible
    if (expandedHistory[problemId]) {
      setExpandedHistory((current) => ({
        ...current,
        [problemId]: false,
      }));

      return;
    }

    // History was already fetched
    if (history[problemId]) {
      setExpandedHistory((current) => ({
        ...current,
        [problemId]: true,
      }));

      return;
    }

    // Fetch history
    fetchHistory(problemId);
  };

  // ==================================================
  // LOAD REPORTS
  // ==================================================

  useEffect(() => {
    fetchReports();
  }, []);

  // ==================================================
  // LOGOUT
  // ==================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  // ==================================================
  // STATUS ICON
  // ==================================================

  const getStatusIcon = (status) => {
    if (status === "PENDING") {
      return "🟡";
    }

    if (status === "IN_PROGRESS") {
      return "🔵";
    }

    if (status === "RESOLVED") {
      return "🟢";
    }

    return "⚪";
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      {/* ==========================================
          PAGE TITLE
      ========================================== */}

      <h1>My Reports</h1>

      <hr />

      {/* ==========================================
          LOADING
      ========================================== */}

      {loading && (
        <p>Loading reports...</p>
      )}

      {/* ==========================================
          ERROR
      ========================================== */}

      {!loading && error && (
        <p>{error}</p>
      )}

      {/* ==========================================
          NO REPORTS
      ========================================== */}

      {!loading &&
        !error &&
        reports.length === 0 && (
          <p>
            You have not reported any
            problems yet.
          </p>
        )}

      {/* ==========================================
          REPORTS
      ========================================== */}

      {!loading &&
        !error &&
        reports.length > 0 && (
          <div>
            {reports.map((report) => (
              <div
                key={report.id}
                style={{
                  border: "1px solid #ccc",
                  padding: "20px",
                  marginBottom: "20px",
                  borderRadius: "10px",
                }}
              >
                {/* ==================================
                    PROBLEM IMAGE
                ================================== */}

                {report.image_url && (
                  <div
                    style={{
                      marginBottom: "15px",
                    }}
                  >
                    <img
                      src={`http://localhost:5000${report.image_url}`}
                      alt={report.title}
                      style={{
                        maxWidth: "100%",
                        width: "350px",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                )}

                {/* ==================================
                    TITLE
                ================================== */}

                <h2>{report.title}</h2>

                {/* ==================================
                    DESCRIPTION
                ================================== */}

                <p>
                  <strong>
                    Description:
                  </strong>{" "}
                  {report.description}
                </p>

                {/* ==================================
                    CATEGORY
                ================================== */}

                <p>
                  <strong>
                    Category:
                  </strong>{" "}
                  {report.category}
                </p>

                {/* ==================================
                    AREA
                ================================== */}

                <p>
                  <strong>
                    Area:
                  </strong>{" "}
                  {report.area}
                </p>

                {/* ==================================
                    CURRENT STATUS
                ================================== */}

                <p>
                  <strong>
                    Current Status:
                  </strong>{" "}

                  {getStatusIcon(
                    report.status
                  )}{" "}

                  {report.status}
                </p>

                {/* ==================================
                    REPORTED DATE
                ================================== */}

                <p>
                  <strong>
                    Reported On:
                  </strong>{" "}

                  {report.created_at
                    ? new Date(
                        report.created_at
                      ).toLocaleString()
                    : "N/A"}
                </p>

                {/* ==================================
                    RESOLUTION IMAGE
                ================================== */}

                {report.resolution_image_url && (
                  <div
                    style={{
                      marginTop: "15px",
                    }}
                  >
                    <h3>
                      Resolution Image
                    </h3>

                    <img
                      src={`http://localhost:5000${report.resolution_image_url}`}
                      alt="Resolution proof"
                      style={{
                        maxWidth: "100%",
                        width: "350px",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                )}

                {/* ==================================
                    RESOLUTION VIDEO
                ================================== */}

                {report.resolution_video_url && (
                  <div
                    style={{
                      marginTop: "15px",
                    }}
                  >
                    <h3>
                      Resolution Video
                    </h3>

                    <video
                      controls
                      style={{
                        maxWidth: "100%",
                        width: "500px",
                        borderRadius: "8px",
                      }}
                    >
                      <source
                        src={`http://localhost:5000${report.resolution_video_url}`}
                        type="video/mp4"
                      />

                      Your browser does not
                      support video.
                    </video>
                  </div>
                )}

                <hr />

                {/* ==================================
                    STATUS HISTORY BUTTON
                ================================== */}

                <button
                  onClick={() =>
                    toggleHistory(
                      report.id
                    )
                  }
                  disabled={
                    historyLoading[
                      report.id
                    ]
                  }
                >
                  {historyLoading[
                    report.id
                  ]
                    ? "Loading History..."
                    : expandedHistory[
                        report.id
                      ]
                    ? "Hide Status History"
                    : "View Status History"}
                </button>

                {/* ==================================
                    STATUS HISTORY
                ================================== */}

                {expandedHistory[
                  report.id
                ] && (
                  <div
                    style={{
                      marginTop: "20px",
                      padding: "15px",
                      border:
                        "1px solid #ddd",
                      borderRadius: "8px",
                    }}
                  >
                    <h3>
                      Status History
                    </h3>

                    {history[
                      report.id
                    ] &&
                    history[
                      report.id
                    ].length > 0 ? (
                      <div>
                        {history[
                          report.id
                        ].map(
                          (
                            item,
                            index
                          ) => (
                            <div
                              key={
                                item.id
                              }
                              style={{
                                marginBottom:
                                  "20px",
                                paddingLeft:
                                  "10px",
                                borderLeft:
                                  "3px solid #888",
                              }}
                            >
                              <h4
                                style={{
                                  margin:
                                    "0 0 5px 0",
                                }}
                              >
                                {getStatusIcon(
                                  item.status
                                )}{" "}
                                {item.status}
                              </h4>

                              <p
                                style={{
                                  margin:
                                    "5px 0",
                                }}
                              >
                                <strong>
                                  Changed By:
                                </strong>{" "}
                                {item.changed_by_name ||
                                  "Unknown"}
                              </p>

                              <p
                                style={{
                                  margin:
                                    "5px 0",
                                }}
                              >
                                <strong>
                                  Role:
                                </strong>{" "}
                                {item.changed_by_role ||
                                  "Unknown"}
                              </p>

                              <p
                                style={{
                                  margin:
                                    "5px 0",
                                }}
                              >
                                <strong>
                                  Date:
                                </strong>{" "}
                                {item.changed_at
                                  ? new Date(
                                      item.changed_at
                                    ).toLocaleString()
                                  : "N/A"}
                              </p>

                              {index <
                                history[
                                  report.id
                                ].length -
                                  1 && (
                                <p
                                  style={{
                                    margin:
                                      "10px 0 0 0",
                                  }}
                                >
                                  ↓
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p>
                        No status history
                        available yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      <hr />

      {/* ==========================================
          BACK TO DASHBOARD
      ========================================== */}

      <button
        onClick={() => {
          window.location.href =
            "/citizen-dashboard";
        }}
      >
        Back to Dashboard
      </button>

      {" "}

      {/* ==========================================
          LOGOUT
      ========================================== */}

      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default MyReports;