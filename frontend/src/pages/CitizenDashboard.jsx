import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

function CitizenDashboard() {
  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [notificationCount, setNotificationCount] =
    useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  // ==================================================
  // FETCH MY REPORTS
  // ==================================================

  const fetchReports = async (
    showRefreshing = false
  ) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      }

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/problems/my",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Failed to fetch reports"
        );
        return;
      }

      // Backend returns:
      // { message, problems: [...] }
      const fetchedReports =
        data.problems || [];

      setReports(fetchedReports);
    } catch (error) {
      console.error(
        "Fetch reports error:",
        error
      );

      setError(
        "Unable to connect to server"
      );
    } finally {
      setLoading(false);

      if (showRefreshing) {
        setTimeout(() => {
          setRefreshing(false);
        }, 500);
      }
    }
  };

  // ==================================================
  // FETCH NOTIFICATION COUNT
  // ==================================================

  const fetchNotificationCount =
    async () => {
      try {
        const token =
          localStorage.getItem("token");

        if (!token) {
          return;
        }

        const response =
          await fetch(
            "http://localhost:5000/api/notifications/unread-count",
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          return;
        }

        setNotificationCount(
          data.count || 0
        );
      } catch (error) {
        console.error(
          "Notification count error:",
          error
        );
      }
    };

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    fetchReports();
    fetchNotificationCount();

    const refreshInterval =
      setInterval(() => {
        fetchReports(true);
        fetchNotificationCount();
      }, 30000);

    return () => {
      clearInterval(
        refreshInterval
      );
    };
  }, []);

  // ==================================================
  // MANUAL REFRESH
  // ==================================================

  const handleRefresh = async () => {
    if (refreshing) {
      return;
    }

    await Promise.all([
      fetchReports(true),
      fetchNotificationCount(),
    ]);
  };

  // ==================================================
  // LOGOUT
  // ==================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  // ==================================================
  // STATUS STYLE
  // ==================================================

  const getStatusStyle = (
    status
  ) => {
    if (status === "PENDING") {
      return {
        backgroundColor: "#fff3cd",
        color: "#856404",
      };
    }

    if (
      status === "IN_PROGRESS"
    ) {
      return {
        backgroundColor: "#cfe2ff",
        color: "#084298",
      };
    }

    if (status === "RESOLVED") {
      return {
        backgroundColor: "#d1e7dd",
        color: "#0f5132",
      };
    }

    if (status === "REJECTED") {
      return {
        backgroundColor: "#f8d7da",
        color: "#842029",
      };
    }

    return {
      backgroundColor: "#e2e3e5",
      color: "#41464b",
    };
  };

  // ==================================================
  // STATISTICS
  // ==================================================

  const totalReports =
    reports.length;

  const pendingReports =
    reports.filter(
      (report) =>
        report.status ===
        "PENDING"
    ).length;

  const inProgressReports =
    reports.filter(
      (report) =>
        report.status ===
        "IN_PROGRESS"
    ).length;

  const resolvedReports =
    reports.filter(
      (report) =>
        report.status ===
        "RESOLVED"
    ).length;

  const rejectedReports =
    reports.filter(
      (report) =>
        report.status ===
        "REJECTED"
    ).length;

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="dashboard-container">

      {/* HEADER */}

      <div className="dashboard-header">

        <div>
          <h1>
            Citizen Dashboard
          </h1>

          <h2>
            Welcome, {user?.name}! 👋
          </h2>

          <p>
            Email: {user?.email}
          </p>

          <p>
            Role: {user?.role}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handleRefresh}
            className="dashboard-button"
            disabled={refreshing}
          >
            {refreshing
              ? "🔄 Refreshing..."
              : "🔄 Refresh Dashboard"}
          </button>

          <button
            onClick={handleLogout}
            className="logout-button"
          >
            Logout
          </button>
        </div>

      </div>

      {/* NOTIFICATIONS */}

      <div
        className="filters-card"
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
            }}
          >
            🔔 Notifications
          </h2>

          <p
            style={{
              marginBottom: 0,
              color: "#666",
            }}
          >
            You have{" "}
            {notificationCount}{" "}
            unread notification
            {notificationCount !== 1
              ? "s"
              : ""}
            .
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <strong
            style={{
              fontSize: "18px",
            }}
          >
            🔴{" "}
            {notificationCount}
          </strong>

          <button
            className="dashboard-button"
            onClick={() =>
              navigate(
                "/notifications"
              )
            }
          >
            View Notifications →
          </button>
        </div>

      </div>

      {/* QUICK ACTIONS */}

      <div
        className="filters-card"
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <button
          className="dashboard-button"
          onClick={() =>
            navigate(
              "/notifications"
            )
          }
        >
          🔔 Notifications
        </button>

        <button
          className="dashboard-button"
          onClick={() =>
            navigate(
              "/my-reports"
            )
          }
        >
          📋 My Reports
        </button>

        <button
          className="dashboard-button"
          onClick={() =>
            navigate(
              "/report-problem"
            )
          }
        >
          ➕ Report Problem
        </button>
      </div>

      {/* STATISTICS */}

      <div className="dashboard-stats">

        <div className="stat-card">
          <div
            style={{
              fontSize: "30px",
            }}
          >
            📊
          </div>

          <h3>
            Total Reports
          </h3>

          <h2>
            {totalReports}
          </h2>
        </div>

        <div className="stat-card">
          <div
            style={{
              fontSize: "30px",
            }}
          >
            🟡
          </div>

          <h3>
            Pending
          </h3>

          <h2>
            {pendingReports}
          </h2>
        </div>

        <div className="stat-card">
          <div
            style={{
              fontSize: "30px",
            }}
          >
            🔵
          </div>

          <h3>
            In Progress
          </h3>

          <h2>
            {inProgressReports}
          </h2>
        </div>

        <div className="stat-card">
          <div
            style={{
              fontSize: "30px",
            }}
          >
            🟢
          </div>

          <h3>
            Resolved
          </h3>

          <h2>
            {resolvedReports}
          </h2>
        </div>

        <div className="stat-card">
          <div
            style={{
              fontSize: "30px",
            }}
          >
            🔴
          </div>

          <h3>
            Rejected
          </h3>

          <h2>
            {rejectedReports}
          </h2>
        </div>

      </div>

      {/* REPORTS */}

      <h2>
        My Reports
      </h2>

      {loading && (
        <p>
          Loading reports...
        </p>
      )}

      {error && (
        <p
          style={{
            padding: "12px",
            borderRadius: "8px",
            backgroundColor:
              "#f8d7da",
            color: "#842029",
          }}
        >
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        reports.length === 0 && (
          <div className="report-card">
            <h3>
              No Reports Found
            </h3>

            <p>
              You have not reported
              any problem yet.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        reports.length > 0 && (
          <div>
            {reports.map(
              (report) => (
                <div
                  key={report.id}
                  className="report-card"
                >

                  {/* HEADER */}

                  <div className="report-header">

                    <h3>
                      {report.title}
                    </h3>

                    <span
                      className="status-badge"
                      style={getStatusStyle(
                        report.status
                      )}
                    >
                      {report.status}
                    </span>

                  </div>

                  {/* IMAGE */}

                  {report.image_url && (
                    <img
                      src={
                        `http://localhost:5000${report.image_url}`
                      }
                      alt={
                        report.title
                      }
                      className="report-image"
                    />
                  )}

                  {/* VIDEO */}

                  {report.video_url && (
                    <div
                      style={{
                        marginTop:
                          "15px",
                      }}
                    >
                      <p>
                        <strong>
                          Report Video:
                        </strong>
                      </p>

                      <video
                        width="100%"
                        controls
                        style={{
                          maxWidth:
                            "600px",
                          borderRadius:
                            "10px",
                        }}
                      >
                        <source
                          src={
                            `http://localhost:5000${report.video_url}`
                          }
                        />

                        Your browser does
                        not support video.
                      </video>
                    </div>
                  )}

                  {/* DETAILS */}

                  <p>
                    <strong>
                      Description:
                    </strong>{" "}
                    {report.description}
                  </p>

                  <p>
                    <strong>
                      Category:
                    </strong>{" "}
                    {report.category}
                  </p>

                  <p>
                    <strong>
                      Area:
                    </strong>{" "}
                    {report.area}
                  </p>

                  <p>
                    <strong>
                      Status:
                    </strong>{" "}
                    {report.status}
                  </p>

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

                  {/* RESOLUTION PROOF */}

                  {report.status ===
                    "RESOLVED" && (
                    <div
                      style={{
                        marginTop:
                          "20px",
                        padding: "18px",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "10px",
                        backgroundColor:
                          "#f8fff9",
                      }}
                    >
                      <h3>
                        🟢 Resolution Proof
                      </h3>

                      {report.resolution_image_url && (
                        <div>
                          <p>
                            <strong>
                              Resolution Image:
                            </strong>
                          </p>

                          <img
                            src={
                              `http://localhost:5000${report.resolution_image_url}`
                            }
                            alt="Resolution proof"
                            className="report-image"
                          />
                        </div>
                      )}

                      {report.resolution_video_url && (
                        <div
                          style={{
                            marginTop:
                              "15px",
                          }}
                        >
                          <p>
                            <strong>
                              Resolution Video:
                            </strong>
                          </p>

                          <video
                            width="100%"
                            controls
                            style={{
                              maxWidth:
                                "600px",
                              borderRadius:
                                "10px",
                            }}
                          >
                            <source
                              src={
                                `http://localhost:5000${report.resolution_video_url}`
                              }
                            />

                            Your browser does
                            not support video.
                          </video>
                        </div>
                      )}

                      {!report.resolution_image_url &&
                        !report.resolution_video_url && (
                          <p>
                            No resolution proof
                            uploaded.
                          </p>
                        )}
                    </div>
                  )}

                </div>
              )
            )}
          </div>
        )}

    </div>
  );
}

export default CitizenDashboard;