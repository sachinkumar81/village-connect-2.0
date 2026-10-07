import { useEffect, useState } from "react";
import "../styles/dashboard.css";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/notifications",
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
          data.message ||
            "Failed to fetch notifications"
        );
        return;
      }

      setNotifications(
        data.notifications || []
      );
    } catch (error) {
      console.error(
        "Fetch notifications error:",
        error
      );

      setError(
        "Unable to connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return;
      }

      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (notification) =>
              notification.id ===
              notificationId
                ? {
                    ...notification,
                    is_read: true,
                    read: true,
                  }
                : notification
          )
      );
    } catch (error) {
      console.error(
        "Mark notification read error:",
        error
      );
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getMessage = (notification) => {
    return (
      notification.message ||
      notification.content ||
      notification.text ||
      "You have a new notification."
    );
  };

  const isRead = (notification) => {
    return (
      notification.is_read === true ||
      notification.read === true
    );
  };

  return (
    <div className="dashboard-container">

      <div className="dashboard-header">
        <h1>🔔 Notifications</h1>

        <p>
          Stay updated about your reported
          problems.
        </p>
      </div>

      {loading && (
        <div className="report-card">
          <p>Loading notifications...</p>
        </div>
      )}

      {error && (
        <div className="report-card">
          <p>{error}</p>
        </div>
      )}

      {!loading &&
        !error &&
        notifications.length === 0 && (
          <div className="report-card">
            <h3>No Notifications</h3>

            <p>
              You don't have any notifications
              yet.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        notifications.length > 0 && (
          <div>
            {notifications.map(
              (notification, index) => {

                const read =
                  isRead(notification);

                return (
                  <div
                    key={
                      notification.id ||
                      index
                    }
                    className="report-card"
                    style={{
                      borderLeft: read
                        ? "4px solid #ccc"
                        : "4px solid #0d6efd",
                      backgroundColor:
                        read
                          ? "white"
                          : "#f0f7ff",
                    }}
                  >

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap: "15px",
                        flexWrap: "wrap",
                      }}
                    >

                      <h3
                        style={{
                          margin: 0,
                        }}
                      >
                        🔔 Notification
                      </h3>

                      {!read && (
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor:
                              "#cfe2ff",
                            color:
                              "#084298",
                          }}
                        >
                          NEW
                        </span>
                      )}

                    </div>

                    <p>
                      {getMessage(
                        notification
                      )}
                    </p>

                    {notification.created_at && (
                      <small>
                        {new Date(
                          notification.created_at
                        ).toLocaleString()}
                      </small>
                    )}

                    {!read && notification.id && (
                      <div
                        style={{
                          marginTop: "15px",
                        }}
                      >
                        <button
                          className="dashboard-button"
                          onClick={() =>
                            markAsRead(
                              notification.id
                            )
                          }
                        >
                          Mark as Read
                        </button>
                      </div>
                    )}

                    {read && (
                      <p
                        style={{
                          marginBottom: 0,
                          color: "#198754",
                          fontWeight: "bold",
                        }}
                      >
                        ✓ Read
                      </p>
                    )}

                  </div>
                );
              }
            )}
          </div>
        )}

    </div>
  );
}

export default Notifications;