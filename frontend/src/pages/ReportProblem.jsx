import { useState } from "react";

function ReportProblem() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    area: "",
  });

  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ==========================================
  // HANDLE TEXT INPUT
  // ==========================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
    setMessage("");
  };

  // ==========================================
  // HANDLE IMAGE
  // ==========================================

  const handleImageChange = (e) => {
    setError("");
    setMessage("");

    const selectedImage = e.target.files[0];

    if (!selectedImage) {
      setImage(null);
      return;
    }

    // Check file type
    if (!selectedImage.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      e.target.value = "";
      setImage(null);
      return;
    }

    // Maximum image size = 5 MB
    const maxImageSize = 5 * 1024 * 1024;

    if (selectedImage.size > maxImageSize) {
      setError("Image size must be less than 5 MB.");
      e.target.value = "";
      setImage(null);
      return;
    }

    setImage(selectedImage);
  };

  // ==========================================
  // HANDLE VIDEO
  // ==========================================

  const handleVideoChange = (e) => {
    setError("");
    setMessage("");

    const selectedVideo = e.target.files[0];

    if (!selectedVideo) {
      setVideo(null);
      return;
    }

    // Check file type
    if (!selectedVideo.type.startsWith("video/")) {
      setError("Please select a valid video file.");
      e.target.value = "";
      setVideo(null);
      return;
    }

    // Maximum video size = 20 MB
    const maxVideoSize = 20 * 1024 * 1024;

    if (selectedVideo.size > maxVideoSize) {
      setError("Video size must be less than 20 MB.");
      e.target.value = "";
      setVideo(null);
      return;
    }

    setVideo(selectedVideo);
  };

  // ==========================================
  // VALIDATE FORM
  // ==========================================

  const validateForm = () => {
    const title = formData.title.trim();
    const description = formData.description.trim();
    const category = formData.category.trim();
    const area = formData.area.trim();

    // ------------------------------------------
    // TITLE
    // ------------------------------------------

    if (!title) {
      return "Please enter the problem title.";
    }

    if (title.length < 3) {
      return "Problem title must be at least 3 characters.";
    }

    if (title.length > 100) {
      return "Problem title must not exceed 100 characters.";
    }

    // ------------------------------------------
    // DESCRIPTION
    // ------------------------------------------

    if (!description) {
      return "Please enter a description.";
    }

    if (description.length < 10) {
      return "Description must be at least 10 characters.";
    }

    if (description.length > 1000) {
      return "Description must not exceed 1000 characters.";
    }

    // ------------------------------------------
    // CATEGORY
    // ------------------------------------------

    if (!category) {
      return "Please select a category.";
    }

    // ------------------------------------------
    // AREA
    // ------------------------------------------

    if (!area) {
      return "Please enter the area.";
    }

    if (area.length < 2) {
      return "Area must be at least 2 characters.";
    }

    if (area.length > 100) {
      return "Area must not exceed 100 characters.";
    }

    // ------------------------------------------
    // PHOTO OR VIDEO REQUIRED
    // ------------------------------------------

    if (!image && !video) {
      return "Please upload a photo or video.";
    }

    return "";
  };

  // ==========================================
  // SUBMIT FORM
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    // ------------------------------------------
    // CHECK LOGIN TOKEN
    // ------------------------------------------

    const token =
      localStorage.getItem("token");

    if (!token) {
      setError("Please login first.");
      return;
    }

    // ------------------------------------------
    // VALIDATE FORM
    // ------------------------------------------

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);

      const data = new FormData();

      data.append(
        "title",
        formData.title.trim()
      );

      data.append(
        "description",
        formData.description.trim()
      );

      data.append(
        "category",
        formData.category.trim()
      );

      data.append(
        "area",
        formData.area.trim()
      );

      // ------------------------------------------
      // PHOTO
      // ------------------------------------------

      if (image) {
        data.append(
          "image",
          image
        );
      }

      // ------------------------------------------
      // VIDEO
      // ------------------------------------------

      if (video) {
        data.append(
          "video",
          video
        );
      }

      // ------------------------------------------
      // API REQUEST
      // ------------------------------------------

      const response = await fetch(
        "http://localhost:5000/api/problems",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: data,
        }
      );

      const result =
        await response.json();

      // ------------------------------------------
      // SERVER ERROR
      // ------------------------------------------

      if (!response.ok) {
        setError(
          result.message ||
            "Failed to report problem."
        );

        return;
      }

      // ------------------------------------------
      // SUCCESS
      // ------------------------------------------

      setMessage(
        result.message ||
          "Problem reported successfully."
      );

      // ------------------------------------------
      // RESET FORM
      // ------------------------------------------

      setFormData({
        title: "",
        description: "",
        category: "",
        area: "",
      });

      setImage(null);
      setVideo(null);

      // Reset image input
      const imageInput =
        document.getElementById(
          "problem-image"
        );

      if (imageInput) {
        imageInput.value = "";
      }

      // Reset video input
      const videoInput =
        document.getElementById(
          "problem-video"
        );

      if (videoInput) {
        videoInput.value = "";
      }

    } catch (error) {
      console.error(
        "Report problem error:",
        error
      );

      setError(
        "Unable to connect to server. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div>
      <h1>Report a Problem</h1>

      <form onSubmit={handleSubmit}>

        {/* =====================================
            PROBLEM TITLE
        ====================================== */}

        <div>
          <label>
            Problem Title
          </label>

          <input
            type="text"
            name="title"
            placeholder="Enter problem title"
            value={formData.title}
            onChange={handleChange}
            maxLength={100}
            disabled={submitting}
          />
        </div>

        <br />

        {/* =====================================
            DESCRIPTION
        ====================================== */}

        <div>
          <label>
            Description
          </label>

          <textarea
            name="description"
            placeholder="Describe the problem"
            value={formData.description}
            onChange={handleChange}
            maxLength={1000}
            disabled={submitting}
          />
        </div>

        <br />

        {/* =====================================
            CATEGORY
        ====================================== */}

        <div>
          <label>
            Category
          </label>

          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={submitting}
          >
            <option value="">
              Select category
            </option>

            <option value="Road">
              Road
            </option>

            <option value="Electricity">
              Electricity
            </option>

            <option value="Water">
              Water
            </option>

            <option value="Sanitation">
              Sanitation
            </option>

            <option value="Street Light">
              Street Light
            </option>

            <option value="Other">
              Other
            </option>
          </select>
        </div>

        <br />

        {/* =====================================
            AREA
        ====================================== */}

        <div>
          <label>
            Area
          </label>

          <input
            type="text"
            name="area"
            placeholder="Enter area"
            value={formData.area}
            onChange={handleChange}
            maxLength={100}
            disabled={submitting}
          />
        </div>

        <br />

        {/* =====================================
            PHOTO
        ====================================== */}

        <div>
          <label>
            Problem Photo
          </label>

          <br />

          <input
            id="problem-image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={submitting}
          />

          {image && (
            <p>
              Selected photo:{" "}
              <strong>
                {image.name}
              </strong>
            </p>
          )}
        </div>

        <br />

        {/* =====================================
            VIDEO
        ====================================== */}

        <div>
          <label>
            Problem Video
          </label>

          <br />

          <input
            id="problem-video"
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            disabled={submitting}
          />

          {video && (
            <p>
              Selected video:{" "}
              <strong>
                {video.name}
              </strong>
            </p>
          )}
        </div>

        <br />

        {/* =====================================
            MEDIA NOTE
        ====================================== */}

        <p>
          <strong>
            Note:
          </strong>{" "}
          Please upload at least one
          photo or video. You can upload
          either one or both.
        </p>

        <br />

        {/* =====================================
            SUBMIT BUTTON
        ====================================== */}

        <button
          type="submit"
          disabled={submitting}
        >
          {submitting
            ? "Submitting..."
            : "Submit Problem"}
        </button>

      </form>

      {/* =======================================
          SUCCESS MESSAGE
      ======================================== */}

      {message && (
        <p
          style={{
            padding: "10px",
            color: "#0f5132",
            backgroundColor: "#d1e7dd",
            borderRadius: "8px",
          }}
        >
          {message}
        </p>
      )}

      {/* =======================================
          ERROR MESSAGE
      ======================================== */}

      {error && (
        <p
          style={{
            padding: "10px",
            color: "#842029",
            backgroundColor: "#f8d7da",
            borderRadius: "8px",
          }}
        >
          {error}
        </p>
      )}

    </div>
  );
}

export default ReportProblem;