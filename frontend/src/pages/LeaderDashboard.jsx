import { useEffect, useState } from "react";
import "../styles/dashboard.css";

function LeaderDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  // ==================================================
  // REPORT DATA
  // ==================================================

  const [reports, setReports] = useState([]);
  const [allReports, setAllReports] = useState([]);

  // ==================================================
  // FILTER DATA
  // ==================================================

  const [areas, setAreas] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedArea, setSelectedArea] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // ==================================================
  // LOADING / ERROR
  // ==================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [updatingId, setUpdatingId] = useState(null);

  // ==================================================
  // RESOLUTION PROOF FILES
  // ==================================================

  const [resolutionImages, setResolutionImages] =
    useState({});

  const [resolutionVideos, setResolutionVideos] =
    useState({});


  // ==================================================
  // FETCH ALL REPORTS
  // ==================================================

  const fetchAllReports = async (
    showRefreshing = false
  ) => {
    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        "http://localhost:5000/api/problems/all",
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
        setError(
          data.message ||
            "Failed to fetch reports"
        );
        return;
      }

      // Backend returns:
      // { message: "...", problems: [...] }

      const fetchedReports =
        data.problems || [];

      setAllReports(
        fetchedReports
      );

      setReports(
        fetchedReports
      );

      // Unique areas

      const uniqueAreas = [
        ...new Set(
          fetchedReports
            .map(
              (report) =>
                report.area
            )
            .filter(
              (area) =>
                area &&
                area.trim() !== ""
            )
        ),
      ];

      // Unique categories

      const uniqueCategories = [
        ...new Set(
          fetchedReports
            .map(
              (report) =>
                report.category
            )
            .filter(
              (category) =>
                category &&
                category.trim() !== ""
            )
        ),
      ];

      setAreas(
        uniqueAreas
      );

      setCategories(
        uniqueCategories
      );

    } catch (error) {
      console.error(
        "Fetch all reports error:",
        error
      );

      setError(
        "Unable to connect to server"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  // ==================================================
  // FILTER REPORTS
  // ==================================================

  const applyFilters = (
    area,
    category,
    status
  ) => {

    let filteredReports =
      [...allReports];

    if (area) {
      filteredReports =
        filteredReports.filter(
          (report) =>
            report.area === area
        );
    }

    if (category) {
      filteredReports =
        filteredReports.filter(
          (report) =>
            report.category ===
            category
        );
    }

    if (status) {
      filteredReports =
        filteredReports.filter(
          (report) =>
            report.status ===
            status
        );
    }

    setReports(
      filteredReports
    );
  };


  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    fetchAllReports();

    // Automatically refresh reports every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchAllReports(true);
    }, 30000);

    // Cleanup interval when component unmounts
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);


  // ==================================================
  // APPLY FILTERS
  // ==================================================

  useEffect(() => {
    if (allReports.length === 0) {
      return;
    }

    applyFilters(
      selectedArea,
      selectedCategory,
      selectedStatus
    );
  }, [
    selectedArea,
    selectedCategory,
    selectedStatus,
    allReports,
  ]);


  // ==================================================
  // FILTER HANDLERS
  // ==================================================

  const handleAreaChange = (
    event
  ) => {
    setSelectedArea(
      event.target.value
    );
  };


  const handleCategoryChange = (
    event
  ) => {
    setSelectedCategory(
      event.target.value
    );
  };


  const handleStatusChange = (
    event
  ) => {
    setSelectedStatus(
      event.target.value
    );
  };


  // ==================================================
  // CLEAR FILTERS
  // ==================================================

  const clearFilters = () => {
    setSelectedArea("");
    setSelectedCategory("");
    setSelectedStatus("");

    setReports(
      [...allReports]
    );
  };


  // ==================================================
  // REFRESH REPORTS
  // ==================================================

  const handleRefresh = async () => {
    await fetchAllReports(true);
  };


  // ==================================================
  // UPDATE STATUS
  // ==================================================

  const updateStatus = async (
    problemId,
    newStatus
  ) => {
    try {
      const token =
        localStorage.getItem("token");

      setUpdatingId(
        problemId
      );

      const response =
        await fetch(
          `http://localhost:5000/api/problems/${problemId}/status`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              status: newStatus,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to update status"
        );
        return;
      }

      setAllReports(
        (currentReports) =>
          currentReports.map(
            (report) =>
              report.id === problemId
                ? {
                    ...report,
                    status:
                      newStatus,
                  }
                : report
          )
      );

      setReports(
        (currentReports) =>
          currentReports.map(
            (report) =>
              report.id === problemId
                ? {
                    ...report,
                    status:
                      newStatus,
                  }
                : report
          )
      );

    } catch (error) {
      console.error(
        "Update status error:",
        error
      );

      alert(
        "Unable to connect to server"
      );
    } finally {
      setUpdatingId(null);
    }
  };


  // ==================================================
  // RESOLUTION IMAGE
  // ==================================================

  const handleResolutionImageChange = (
    problemId,
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setResolutionImages(
      (current) => ({
        ...current,
        [problemId]: file,
      })
    );
  };


  // ==================================================
  // RESOLUTION VIDEO
  // ==================================================

  const handleResolutionVideoChange = (
    problemId,
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setResolutionVideos(
      (current) => ({
        ...current,
        [problemId]: file,
      })
    );
  };


  // ==================================================
  // RESOLVE WITH PROOF
  // ==================================================

  const resolveWithProof = async (
    problemId
  ) => {
    try {
      const token =
        localStorage.getItem("token");

      const imageFile =
        resolutionImages[
          problemId
        ];

      const videoFile =
        resolutionVideos[
          problemId
        ];

      if (
        !imageFile &&
        !videoFile
      ) {
        alert(
          "Please select a resolution image or video first."
        );

        return;
      }

      setUpdatingId(
        problemId
      );

      const formData =
        new FormData();

      if (imageFile) {
        formData.append(
          "resolution_image",
          imageFile
        );
      }

      if (videoFile) {
        formData.append(
          "resolution_video",
          videoFile
        );
      }

      const response =
        await fetch(
          `http://localhost:5000/api/problems/${problemId}/resolve`,
          {
            method: "PATCH",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to resolve problem"
        );

        return;
      }

      alert(
        "Problem resolved successfully!"
      );

      setResolutionImages(
        (current) => {
          const updated = {
            ...current,
          };

          delete updated[
            problemId
          ];

          return updated;
        }
      );

      setResolutionVideos(
        (current) => {
          const updated = {
            ...current,
          };

          delete updated[
            problemId
          ];

          return updated;
        }
      );

      await fetchAllReports();

    } catch (error) {
      console.error(
        "Resolve with proof error:",
        error
      );

      alert(
        "Unable to connect to server"
      );
    } finally {
      setUpdatingId(null);
    }
  };


  // ==================================================
  // LOGOUT
  // ==================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    window.location.href =
      "/login";
  };


  // ==================================================
  // STATISTICS
  // ==================================================

  const totalReports =
    allReports.length;

  const pendingReports =
    allReports.filter(
      (report) =>
        report.status ===
        "PENDING"
    ).length;

  const inProgressReports =
    allReports.filter(
      (report) =>
        report.status ===
        "IN_PROGRESS"
    ).length;

  const resolvedReports =
    allReports.filter(
      (report) =>
        report.status ===
        "RESOLVED"
    ).length;


  // ==================================================
  // STATUS BADGE
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
      status ===
      "IN_PROGRESS"
    ) {
      return {
        backgroundColor: "#cfe2ff",
        color: "#084298",
      };
    }

    if (
      status === "RESOLVED"
    ) {
      return {
        backgroundColor: "#d1e7dd",
        color: "#0f5132",
      };
    }

    return {
      backgroundColor: "#e2e3e5",
      color: "#41464b",
    };
  };


  // ==================================================
  // UI
  // ==================================================

  return (
    <div
      style={{
        maxWidth: "1150px",
        margin: "0 auto",
        padding: "20px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >

      {/* ==================================================
          HEADER
      ================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
          marginBottom: "20px",
        }}
      >

        <div>

          <h1
            style={{
              marginBottom: "8px",
            }}
          >
            Leader Dashboard
          </h1>

          <h2
            style={{
              marginTop: "0",
            }}
          >
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
            flexWrap: "wrap",
          }}
        >

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding:
                "10px 18px",
              cursor:
                refreshing
                  ? "not-allowed"
                  : "pointer",
              borderRadius:
                "6px",
              border:
                "1px solid #ccc",
              backgroundColor:
                "white",
            }}
          >
            {refreshing
              ? "🔄 Refreshing..."
              : "🔄 Refresh Reports"}
          </button>


          <button
            onClick={
              handleLogout
            }
            style={{
              padding:
                "10px 18px",
              cursor: "pointer",
              borderRadius:
                "6px",
              border:
                "1px solid #ccc",
            }}
          >
            Logout
          </button>

        </div>

      </div>


      <hr />


      {/* ==================================================
          DASHBOARD OVERVIEW
      ================================================== */}

      <h2>
        Dashboard Overview
      </h2>


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "18px",
          marginBottom: "30px",
        }}
      >

        {/* TOTAL */}

        <div
          style={{
            padding: "22px",
            border:
              "1px solid #ddd",
            borderRadius: "12px",
            textAlign: "center",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >

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

          <h1
            style={{
              margin: "5px 0",
            }}
          >
            {totalReports}
          </h1>

        </div>


        {/* PENDING */}

        <div
          style={{
            padding: "22px",
            border:
              "1px solid #ddd",
            borderRadius: "12px",
            textAlign: "center",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >

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

          <h1
            style={{
              margin: "5px 0",
            }}
          >
            {pendingReports}
          </h1>

        </div>


        {/* IN PROGRESS */}

        <div
          style={{
            padding: "22px",
            border:
              "1px solid #ddd",
            borderRadius: "12px",
            textAlign: "center",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >

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

          <h1
            style={{
              margin: "5px 0",
            }}
          >
            {inProgressReports}
          </h1>

        </div>


        {/* RESOLVED */}

        <div
          style={{
            padding: "22px",
            border:
              "1px solid #ddd",
            borderRadius: "12px",
            textAlign: "center",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >

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

          <h1
            style={{
              margin: "5px 0",
            }}
          >
            {resolvedReports}
          </h1>

        </div>

      </div>


      {/* ==================================================
          VILLAGE PROBLEMS
      ================================================== */}

      <h2>
        Village Problems
      </h2>


      {/* ==================================================
          FILTERS
      ================================================== */}

      <div
        style={{
          marginBottom: "25px",
          padding: "20px",
          border:
            "1px solid #ddd",
          borderRadius: "12px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >

        <h3>
          🔎 Filter Reports
        </h3>


        {/* FILTER GRID */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "15px",
          }}
        >

          {/* AREA */}

          <div>

            <label>
              <strong>
                📍 Area
              </strong>
            </label>

            <select
              value={selectedArea}
              onChange={
                handleAreaChange
              }
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "6px",
                borderRadius: "6px",
                border:
                  "1px solid #ccc",
              }}
            >

              <option value="">
                All Areas
              </option>

              {areas.map(
                (area) => (
                  <option
                    key={area}
                    value={area}
                  >
                    {area}
                  </option>
                )
              )}

            </select>

          </div>


          {/* CATEGORY */}

          <div>

            <label>
              <strong>
                🏷️ Category
              </strong>
            </label>

            <select
              value={
                selectedCategory
              }
              onChange={
                handleCategoryChange
              }
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "6px",
                borderRadius: "6px",
                border:
                  "1px solid #ccc",
              }}
            >

              <option value="">
                All Categories
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}

            </select>

          </div>


          {/* STATUS */}

          <div>

            <label>
              <strong>
                📊 Status
              </strong>
            </label>

            <select
              value={
                selectedStatus
              }
              onChange={
                handleStatusChange
              }
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "6px",
                borderRadius: "6px",
                border:
                  "1px solid #ccc",
              }}
            >

              <option value="">
                All Status
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="RESOLVED">
                Resolved
              </option>

            </select>

          </div>

        </div>


        {/* CLEAR */}

        {(
          selectedArea ||
          selectedCategory ||
          selectedStatus
        ) && (

          <button
            onClick={
              clearFilters
            }
            style={{
              marginTop: "15px",
              padding:
                "9px 16px",
              cursor:
                "pointer",
              borderRadius:
                "6px",
              border:
                "1px solid #ccc",
            }}
          >
            Clear Filters
          </button>

        )}

      </div>


      {/* ==================================================
          ACTIVE FILTERS
      ================================================== */}

      {(
        selectedArea ||
        selectedCategory ||
        selectedStatus
      ) && (

        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            borderRadius: "10px",
            backgroundColor:
              "#f8f9fa",
            border:
              "1px solid #ddd",
          }}
        >

          <strong>
            Active Filters
          </strong>

          <p>
            📍 Area:{" "}
            {selectedArea ||
              "All"}
          </p>

          <p>
            🏷️ Category:{" "}
            {selectedCategory ||
              "All"}
          </p>

          <p>
            📊 Status:{" "}
            {selectedStatus ||
              "All"}
          </p>

          <strong>
            Showing {reports.length} report(s)
          </strong>

        </div>

      )}


      {/* ==================================================
          LOADING
      ================================================== */}

      {loading && (
        <p>
          Loading reports...
        </p>
      )}


      {/* ==================================================
          ERROR
      ================================================== */}

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


      {/* ==================================================
          NO REPORTS
      ================================================== */}

      {!loading &&
        !error &&
        reports.length === 0 && (

          <div
            style={{
              padding: "25px",
              textAlign: "center",
              border:
                "1px solid #ddd",
              borderRadius: "10px",
            }}
          >

            <h3>
              No Problems Found
            </h3>

            <p>
              No reports match
              the selected filters.
            </p>

          </div>

        )}


      {/* ==================================================
          REPORTS
      ================================================== */}

      {!loading &&
        !error &&
        reports.length > 0 && (

          <div>

            {reports.map(
              (report) => (

                <div
                  key={report.id}
                  style={{
                    border:
                      "1px solid #ddd",
                    padding: "20px",
                    marginBottom:
                      "20px",
                    borderRadius:
                      "12px",
                    boxShadow:
                      "0 2px 8px rgba(0,0,0,0.07)",
                  }}
                >

                  {/* REPORT HEADER */}

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      flexWrap:
                        "wrap",
                      gap: "10px",
                    }}
                  >

                    <h3
                      style={{
                        marginTop: "0",
                      }}
                    >
                      {report.title}
                    </h3>


                    <span
                      style={{
                        ...getStatusStyle(
                          report.status
                        ),
                        padding:
                          "6px 12px",
                        borderRadius:
                          "20px",
                        fontWeight:
                          "bold",
                        fontSize:
                          "14px",
                      }}
                    >
                      {report.status}
                    </span>

                  </div>


                  {/* PROBLEM IMAGE */}

                  {report.image_url && (

                    <div
                      style={{
                        marginBottom:
                          "15px",
                      }}
                    >

                      <img
                        src={
                          `http://localhost:5000${report.image_url}`
                        }
                        alt={
                          report.title
                        }
                        style={{
                          width:
                            "100%",
                          maxWidth:
                            "450px",
                          maxHeight:
                            "300px",
                          objectFit:
                            "cover",
                          borderRadius:
                            "8px",
                        }}
                      />

                    </div>

                  )}


                  {/* PROBLEM VIDEO */}

                  {report.video_url && (

                    <div
                      style={{
                        marginBottom:
                          "15px",
                      }}
                    >

                      <p>
                        <strong>
                          Problem Video:
                        </strong>
                      </p>

                      <video
                        width="100%"
                        style={{
                          maxWidth:
                            "600px",
                          borderRadius:
                            "8px",
                        }}
                        controls
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
                      Reported By:
                    </strong>{" "}
                    {report.citizen_name}
                  </p>

                  <p>
                    <strong>
                      Citizen Email:
                    </strong>{" "}
                    {report.citizen_email}
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


                  {/* ==================================================
                      STATUS BUTTONS
                  ================================================== */}

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      marginTop:
                        "15px",
                    }}
                  >

                    <button
                      onClick={() =>
                        updateStatus(
                          report.id,
                          "IN_PROGRESS"
                        )
                      }
                      disabled={
                        updatingId ===
                          report.id ||
                        report.status ===
                          "IN_PROGRESS"
                      }
                      style={{
                        padding:
                          "9px 14px",
                        cursor:
                          "pointer",
                        borderRadius:
                          "6px",
                        border:
                          "1px solid #aaa",
                      }}
                    >
                      {updatingId ===
                      report.id
                        ? "Updating..."
                        : "🔵 In Progress"}
                    </button>


                    <button
                      onClick={() =>
                        updateStatus(
                          report.id,
                          "RESOLVED"
                        )
                      }
                      disabled={
                        updatingId ===
                          report.id ||
                        report.status ===
                          "RESOLVED"
                      }
                      style={{
                        padding:
                          "9px 14px",
                        cursor:
                          "pointer",
                        borderRadius:
                          "6px",
                        border:
                          "1px solid #aaa",
                      }}
                    >
                      {updatingId ===
                      report.id
                        ? "Updating..."
                        : "🟢 Resolved"}
                    </button>

                  </div>


                  {/* ==================================================
                      RESOLUTION PROOF UPLOAD
                  ================================================== */}

                  {report.status !==
                    "RESOLVED" && (

                    <div
                      style={{
                        marginTop:
                          "20px",
                        padding:
                          "18px",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "10px",
                        backgroundColor:
                          "#fafafa",
                      }}
                    >

                      <h3>
                        🛠️ Resolution Proof
                      </h3>

                      <p>
                        Upload a photo or
                        video after solving
                        the problem.
                      </p>


                      {/* IMAGE */}

                      <div
                        style={{
                          marginBottom:
                            "12px",
                        }}
                      >

                        <label>
                          <strong>
                            Resolution Image:
                          </strong>
                        </label>

                        <br />

                        <input
                          type="file"
                          accept="image/*"
                          onChange={(
                            event
                          ) =>
                            handleResolutionImageChange(
                              report.id,
                              event
                            )
                          }
                        />

                      </div>


                      {/* VIDEO */}

                      <div
                        style={{
                          marginBottom:
                            "12px",
                        }}
                      >

                        <label>
                          <strong>
                            Resolution Video:
                          </strong>
                        </label>

                        <br />

                        <input
                          type="file"
                          accept="video/*"
                          onChange={(
                            event
                          ) =>
                            handleResolutionVideoChange(
                              report.id,
                              event
                            )
                          }
                        />

                      </div>


                      {/* SELECTED FILES */}

                      {resolutionImages[
                        report.id
                      ] && (

                        <p>
                          📷{" "}
                          {
                            resolutionImages[
                              report.id
                            ].name
                          }
                        </p>

                      )}


                      {resolutionVideos[
                        report.id
                      ] && (

                        <p>
                          🎥{" "}
                          {
                            resolutionVideos[
                              report.id
                            ].name
                          }
                        </p>

                      )}


                      {/* RESOLVE */}

                      <button
                        onClick={() =>
                          resolveWithProof(
                            report.id
                          )
                        }
                        disabled={
                          updatingId ===
                          report.id
                        }
                        style={{
                          padding:
                            "10px 16px",
                          cursor:
                            "pointer",
                          borderRadius:
                            "6px",
                          border:
                            "1px solid #aaa",
                        }}
                      >

                        {updatingId ===
                        report.id
                          ? "Uploading..."
                          : "✅ Mark as Resolved"}

                      </button>

                    </div>

                  )}


                  {/* ==================================================
                      EXISTING RESOLUTION PROOF
                  ================================================== */}

                  {report.status ===
                    "RESOLVED" && (

                    <div
                      style={{
                        marginTop:
                          "20px",
                        padding:
                          "18px",
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


                      {/* IMAGE */}

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
                            style={{
                              width:
                                "100%",
                              maxWidth:
                                "450px",
                              maxHeight:
                                "300px",
                              objectFit:
                                "cover",
                              borderRadius:
                                "8px",
                            }}
                          />

                        </div>

                      )}


                      {/* VIDEO */}

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
                            style={{
                              maxWidth:
                                "600px",
                              borderRadius:
                                "8px",
                            }}
                            controls
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
                            No resolution proof uploaded.
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

export default LeaderDashboard;