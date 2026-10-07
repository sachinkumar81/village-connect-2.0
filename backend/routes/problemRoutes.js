const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/* =========================
   UPLOAD DIRECTORIES
========================= */

const uploadDirectory = path.join(
  __dirname,
  "../uploads"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

/* =========================
   MULTER STORAGE
========================= */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

/* =========================
   PROBLEM UPLOAD
========================= */

const problemUpload = multer({
  storage: storage,

  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 2,
  },

  fileFilter: function (req, file, cb) {
    if (file.fieldname === "image") {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(
          new Error(
            "Only image files are allowed for the image field."
          )
        );
      }
    } else if (file.fieldname === "video") {
      if (file.mimetype.startsWith("video/")) {
        cb(null, true);
      } else {
        cb(
          new Error(
            "Only video files are allowed for the video field."
          )
        );
      }
    } else {
      cb(new Error("Invalid file field."));
    }
  },
});

/* =========================
   RESOLUTION UPLOAD
========================= */

const resolutionUpload = multer({
  storage: storage,

  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 2,
  },

  fileFilter: function (req, file, cb) {
    if (file.fieldname === "resolution_image") {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(
          new Error(
            "Only image files are allowed for the resolution_image field."
          )
        );
      }
    } else if (file.fieldname === "resolution_video") {
      if (file.mimetype.startsWith("video/")) {
        cb(null, true);
      } else {
        cb(
          new Error(
            "Only video files are allowed for the resolution_video field."
          )
        );
      }
    } else {
      cb(
        new Error(
          "Invalid resolution file field."
        )
      );
    }
  },
});

/* =========================
   CREATE PROBLEM
========================= */

router.post(
  "/",
  authMiddleware,
  problemUpload.fields([
    {
      name: "image",
      maxCount: 1,
    },
    {
      name: "video",
      maxCount: 1,
    },
  ]),
  async (req, res) => {
    let client;

    try {
      const {
        title,
        description,
        category,
        area,
      } = req.body;

      const imageFile =
        req.files?.image?.[0] || null;

      const videoFile =
        req.files?.video?.[0] || null;

      /* =========================
         MEDIA VALIDATION
      ========================= */

      if (!imageFile && !videoFile) {
        return res.status(400).json({
          message:
            "At least one image or video is required.",
        });
      }

      /* =========================
         TEXT VALIDATION
      ========================= */

      const cleanTitle =
        typeof title === "string"
          ? title.trim()
          : "";

      const cleanDescription =
        typeof description === "string"
          ? description.trim()
          : "";

      const cleanCategory =
        typeof category === "string"
          ? category.trim()
          : "";

      const cleanArea =
        typeof area === "string"
          ? area.trim()
          : "";

      if (
        cleanTitle.length < 3 ||
        cleanTitle.length > 100
      ) {
        return res.status(400).json({
          message:
            "Title must be between 3 and 100 characters.",
        });
      }

      if (
        cleanDescription.length < 10 ||
        cleanDescription.length > 1000
      ) {
        return res.status(400).json({
          message:
            "Description must be between 10 and 1000 characters.",
        });
      }

      if (!cleanCategory) {
        return res.status(400).json({
          message:
            "Category is required.",
        });
      }

      if (
        cleanArea.length < 2 ||
        cleanArea.length > 100
      ) {
        return res.status(400).json({
          message:
            "Area must be between 2 and 100 characters.",
        });
      }

      /* =========================
         FILE SIZE VALIDATION
      ========================= */

      if (
        imageFile &&
        imageFile.size > 5 * 1024 * 1024
      ) {
        try {
          fs.unlinkSync(imageFile.path);
        } catch {}

        if (videoFile) {
          try {
            fs.unlinkSync(videoFile.path);
          } catch {}
        }

        return res.status(400).json({
          message:
            "Image size must be 5 MB or less.",
        });
      }

      if (
        videoFile &&
        videoFile.size > 20 * 1024 * 1024
      ) {
        if (imageFile) {
          try {
            fs.unlinkSync(imageFile.path);
          } catch {}
        }

        try {
          fs.unlinkSync(videoFile.path);
        } catch {}

        return res.status(400).json({
          message:
            "Video size must be 20 MB or less.",
        });
      }

      /* =========================
         FILE URLS
      ========================= */

      const imageUrl = imageFile
        ? `/uploads/${imageFile.filename}`
        : null;

      const videoUrl = videoFile
        ? `/uploads/${videoFile.filename}`
        : null;

      /* =========================
         DATABASE TRANSACTION
      ========================= */

      client = await pool.connect();

      try {
        await client.query("BEGIN");

        /* =========================
           INSERT PROBLEM
        ========================= */

        const result = await client.query(
          `
          INSERT INTO problems
          (
            title,
            description,
            category,
            area,
            image_url,
            video_url,
            status,
            user_id
          )
          VALUES
          ($1, $2, $3, $4, $5, $6, 'PENDING', $7)
          RETURNING *
          `,
          [
            cleanTitle,
            cleanDescription,
            cleanCategory,
            cleanArea,
            imageUrl,
            videoUrl,
            req.user.id,
          ]
        );

        const problem =
          result.rows[0];

        /* =========================
           INITIAL STATUS HISTORY
        ========================= */

        await client.query(
          `
          INSERT INTO problem_status_history
          (
            problem_id,
            status,
            changed_by
          )
          VALUES
          ($1, $2, $3)
          `,
          [
            problem.id,
            "PENDING",
            req.user.id,
          ]
        );

        await client.query("COMMIT");

        return res.status(201).json({
          message:
            "Problem reported successfully.",
          problem,
        });
      } catch (transactionError) {
        await client.query("ROLLBACK");
        throw transactionError;
      } finally {
        client.release();
        client = null;
      }
    } catch (error) {
      console.error(
        "Create problem error:",
        error.message
      );

      return res.status(500).json({
        message:
          "Server error while creating problem.",
      });
    }
  }
);

/* =========================
   GET MY PROBLEMS
========================= */

router.get(
  "/my",
  authMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT
          id,
          title,
          description,
          category,
          area,
          image_url,
          video_url,
          resolution_image_url,
          resolution_video_url,
          status,
          created_at,
          updated_at
        FROM problems
        WHERE user_id = $1
        ORDER BY created_at DESC
        `,
        [req.user.id]
      );

      return res.json({
        message:
          "Problems fetched successfully.",
        problems: result.rows,
      });
    } catch (error) {
      console.error(
        "Fetch my problems error:",
        error.message
      );

      return res.status(500).json({
        message:
          "Server error while fetching problems.",
      });
    }
  }
);

/* =========================
   GET ALL PROBLEMS
   LEADER ONLY
========================= */

router.get(
  "/all",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "LEADER") {
        return res.status(403).json({
          message:
            "Access denied. Leader only.",
        });
      }

      const {
        area,
        category,
        status,
      } = req.query;

      const validStatuses = [
        "PENDING",
        "IN_PROGRESS",
        "RESOLVED",
        "REJECTED",
      ];

      if (
        status &&
        !validStatuses.includes(status)
      ) {
        return res.status(400).json({
          message:
            "Invalid status filter",
        });
      }

      let query = `
        SELECT
          p.id,
          p.title,
          p.description,
          p.category,
          p.area,
          p.image_url,
          p.video_url,
          p.resolution_image_url,
          p.resolution_video_url,
          p.status,
          p.created_at,
          p.updated_at,
          p.user_id,
          u.name AS citizen_name
        FROM problems p
        JOIN users u
          ON p.user_id = u.id
        WHERE 1 = 1
      `;

      const values = [];
      let index = 1;

      if (area) {
        query +=
          ` AND LOWER(p.area) = LOWER($${index})`;

        values.push(area.trim());
        index++;
      }

      if (category) {
        query +=
          ` AND LOWER(p.category) = LOWER($${index})`;

        values.push(category.trim());
        index++;
      }

      if (status) {
        query +=
          ` AND p.status = $${index}`;

        values.push(status);
        index++;
      }

      query += `
        ORDER BY p.created_at DESC
      `;

      const result =
        await pool.query(
          query,
          values
        );

      return res.json({
        message:
          "All problems fetched successfully.",
        problems: result.rows,
      });
    } catch (error) {
      console.error(
        "Fetch all problems error:",
        error.message
      );

      return res.status(500).json({
        message:
          "Server error while fetching problems.",
      });
    }
  }
);

/* =========================
   UPDATE PROBLEM STATUS
   LEADER ONLY
========================= */

router.patch(
  "/:id/status",
  authMiddleware,
  async (req, res) => {
    let client;

    try {
      if (req.user.role !== "LEADER") {
        return res.status(403).json({
          message:
            "Access denied. Leader only.",
        });
      }

      const problemId =
        parseInt(req.params.id);

      if (
        Number.isNaN(problemId) ||
        problemId <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid problem ID",
        });
      }

      const { status } = req.body;

      const validStatuses = [
        "PENDING",
        "IN_PROGRESS",
        "RESOLVED",
        "REJECTED",
      ];

      if (
        !validStatuses.includes(status)
      ) {
        return res.status(400).json({
          message:
            "Invalid status",
        });
      }

      client = await pool.connect();

      try {
        await client.query("BEGIN");

        /* =========================
           GET EXISTING PROBLEM
        ========================= */

        const existing =
          await client.query(
            `
            SELECT
              id,
              status,
              user_id
            FROM problems
            WHERE id = $1
            FOR UPDATE
            `,
            [problemId]
          );

        if (
          existing.rows.length === 0
        ) {
          await client.query("ROLLBACK");

          return res.status(404).json({
            message:
              "Problem not found",
          });
        }

        const oldStatus =
          existing.rows[0].status;

        const citizenId =
          existing.rows[0].user_id;

        /* =========================
           UPDATE PROBLEM
        ========================= */

        const updated =
          await client.query(
            `
            UPDATE problems
            SET
              status = $1,
              updated_at = NOW()
            WHERE id = $2
            RETURNING *
            `,
            [
              status,
              problemId,
            ]
          );

        /* =========================
           STATUS HISTORY
        ========================= */

        await client.query(
          `
          INSERT INTO problem_status_history
          (
            problem_id,
            status,
            changed_by
          )
          VALUES
          ($1, $2, $3)
          `,
          [
            problemId,
            status,
            req.user.id,
          ]
        );

        /* =========================
           NOTIFICATION
        ========================= */

        await client.query(
          `
          INSERT INTO notifications
          (
            user_id,
            problem_id,
            message
          )
          VALUES
          ($1, $2, $3)
          `,
          [
            citizenId,
            problemId,
            `Your problem status has been updated from ${oldStatus} to ${status}.`,
          ]
        );

        await client.query("COMMIT");

        return res.json({
          message:
            "Problem status updated successfully.",
          problem:
            updated.rows[0],
        });
      } catch (transactionError) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(
            "Rollback error:",
            rollbackError.message
          );
        }

        throw transactionError;
      } finally {
        client.release();
        client = null;
      }
    } catch (error) {
      console.error(
        "Update status error:",
        error.message
      );

      return res.status(500).json({
        message:
          "Server error while updating status.",
      });
    }
  }
);

/* =========================
   STATUS HISTORY
========================= */

router.get(
  "/:id/history",
  authMiddleware,
  async (req, res) => {
    try {
      const problemId =
        parseInt(req.params.id);

      if (
        Number.isNaN(problemId) ||
        problemId <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid problem ID",
        });
      }

      const problemResult =
        await pool.query(
          `
          SELECT
            id,
            user_id
          FROM problems
          WHERE id = $1
          `,
          [problemId]
        );

      if (
        problemResult.rows.length === 0
      ) {
        return res.status(404).json({
          message:
            "Problem not found",
        });
      }

      const problem =
        problemResult.rows[0];

      if (
        req.user.role !== "LEADER" &&
        problem.user_id !== req.user.id
      ) {
        return res.status(403).json({
          message:
            "Access denied",
        });
      }

      const result =
        await pool.query(
          `
          WITH history AS (
            SELECT
              h.id,
              h.problem_id,
              h.status AS new_status,
              LAG(h.status) OVER (
                PARTITION BY h.problem_id
                ORDER BY h.changed_at ASC, h.id ASC
              ) AS old_status,
              h.changed_at,
              h.changed_by
            FROM problem_status_history h
            WHERE h.problem_id = $1
          )
          SELECT
            history.id,
            history.problem_id,
            history.old_status,
            history.new_status,
            history.changed_at,
            history.changed_by,
            u.name AS changed_by_name
          FROM history
          LEFT JOIN users u
            ON history.changed_by = u.id
          ORDER BY
            history.changed_at ASC,
            history.id ASC
          `,
          [problemId]
        );

      return res.json({
        message:
          "Status history fetched successfully",
        history:
          result.rows,
      });
    } catch (error) {
      console.error(
        "Fetch history error:",
        error.message
      );

      return res.status(500).json({
        message:
          "Server error while fetching history.",
      });
    }
  }
);

/* =========================
   RESOLUTION PROOF UPLOAD
   LEADER ONLY
========================= */

router.patch(
  "/:id/resolve",
  authMiddleware,
  resolutionUpload.fields([
    {
      name: "resolution_image",
      maxCount: 1,
    },
    {
      name: "resolution_video",
      maxCount: 1,
    },
  ]),
  async (req, res) => {
    let client;

    try {
      if (req.user.role !== "LEADER") {
        return res.status(403).json({
          message:
            "Access denied. Leader only.",
        });
      }

      const problemId =
        parseInt(req.params.id);

      if (
        Number.isNaN(problemId) ||
        problemId <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid problem ID",
        });
      }

      const imageFile =
        req.files?.resolution_image?.[0] ||
        null;

      const videoFile =
        req.files?.resolution_video?.[0] ||
        null;

      if (!imageFile && !videoFile) {
        return res.status(400).json({
          message:
            "At least one resolution image or video is required.",
        });
      }

      /* =========================
         FILE SIZE VALIDATION
      ========================= */

      if (
        imageFile &&
        imageFile.size > 5 * 1024 * 1024
      ) {
        try {
          fs.unlinkSync(imageFile.path);
        } catch {}

        if (videoFile) {
          try {
            fs.unlinkSync(videoFile.path);
          } catch {}
        }

        return res.status(400).json({
          message:
            "Resolution image size must be 5 MB or less.",
        });
      }

      if (
        videoFile &&
        videoFile.size > 20 * 1024 * 1024
      ) {
        if (imageFile) {
          try {
            fs.unlinkSync(imageFile.path);
          } catch {}
        }

        try {
          fs.unlinkSync(videoFile.path);
        } catch {}

        return res.status(400).json({
          message:
            "Resolution video size must be 20 MB or less.",
        });
      }

      client = await pool.connect();

      try {
        await client.query("BEGIN");

        /* =========================
           GET EXISTING PROBLEM
        ========================= */

        const existing =
          await client.query(
            `
            SELECT
              id,
              user_id,
              resolution_image_url,
              resolution_video_url,
              status
            FROM problems
            WHERE id = $1
            FOR UPDATE
            `,
            [problemId]
          );

        if (
          existing.rows.length === 0
        ) {
          await client.query("ROLLBACK");

          if (imageFile) {
            try {
              fs.unlinkSync(imageFile.path);
            } catch {}
          }

          if (videoFile) {
            try {
              fs.unlinkSync(videoFile.path);
            } catch {}
          }

          return res.status(404).json({
            message:
              "Problem not found",
          });
        }

        const oldStatus =
          existing.rows[0].status;

        const imageUrl = imageFile
          ? `/uploads/${imageFile.filename}`
          : existing.rows[0]
              .resolution_image_url;

        const videoUrl = videoFile
          ? `/uploads/${videoFile.filename}`
          : existing.rows[0]
              .resolution_video_url;

        /* =========================
           UPDATE PROBLEM
        ========================= */

        const updated =
          await client.query(
            `
            UPDATE problems
            SET
              resolution_image_url = $1,
              resolution_video_url = $2,
              status = 'RESOLVED',
              updated_at = NOW()
            WHERE id = $3
            RETURNING *
            `,
            [
              imageUrl,
              videoUrl,
              problemId,
            ]
          );

        /* =========================
           STATUS HISTORY
        ========================= */

        await client.query(
          `
          INSERT INTO problem_status_history
          (
            problem_id,
            status,
            changed_by
          )
          VALUES
          ($1, $2, $3)
          `,
          [
            problemId,
            "RESOLVED",
            req.user.id,
          ]
        );

        /* =========================
           NOTIFICATION
        ========================= */

        await client.query(
          `
          INSERT INTO notifications
          (
            user_id,
            problem_id,
            message
          )
          VALUES
          ($1, $2, $3)
          `,
          [
            existing.rows[0].user_id,
            problemId,
            oldStatus === "RESOLVED"
              ? "Resolution proof has been updated."
              : "Your problem has been resolved.",
          ]
        );

        await client.query("COMMIT");

        return res.json({
          message:
            "Resolution proof uploaded successfully.",
          problem:
            updated.rows[0],
        });
      } catch (transactionError) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(
            "Rollback error:",
            rollbackError.message
          );
        }

        throw transactionError;
      } finally {
        client.release();
        client = null;
      }
    } catch (error) {
      console.error(
        "Resolution upload error:",
        error.message
      );

      return res.status(500).json({
        message:
          "Server error while uploading resolution proof.",
      });
    }
  }
);

/* =========================
   MULTER / UPLOAD ERROR HANDLER
========================= */

router.use(
  (error, req, res, next) => {
    console.error(
      "Upload error:",
      error.message
    );

    if (req.files) {
      Object.values(req.files)
        .flat()
        .forEach((file) => {
          if (
            file &&
            file.path
          ) {
            try {
              fs.unlinkSync(
                file.path
              );
            } catch (deleteError) {
              console.error(
                "Upload cleanup error:",
                deleteError.message
              );
            }
          }
        });
    }

    if (
      error instanceof multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          message:
            "Uploaded file is too large. Maximum allowed file size is 20 MB.",
        });
      }

      if (
        error.code ===
        "LIMIT_FILE_COUNT"
      ) {
        return res.status(400).json({
          message:
            "Too many files uploaded. Maximum 2 files are allowed.",
        });
      }

      if (
        error.code ===
        "LIMIT_UNEXPECTED_FILE"
      ) {
        return res.status(400).json({
          message:
            "Unexpected file field.",
        });
      }

      return res.status(400).json({
        message:
          error.message ||
          "Invalid file upload.",
      });
    }

    if (
      error &&
      error.message ===
        "Invalid file field."
    ) {
      return res.status(400).json({
        message:
          "Invalid file field.",
      });
    }

    if (
      error &&
      error.message ===
        "Invalid resolution file field."
    ) {
      return res.status(400).json({
        message:
          "Invalid resolution file field.",
      });
    }

    if (
      error &&
      error.message &&
      error.message.startsWith(
        "Only image files are allowed"
      )
    ) {
      return res.status(400).json({
        message:
          error.message,
      });
    }

    if (
      error &&
      error.message &&
      error.message.startsWith(
        "Only video files are allowed"
      )
    ) {
      return res.status(400).json({
        message:
          error.message,
      });
    }

    return res.status(500).json({
      message:
        "Server error",
    });
  }
);

/* =========================
   EXPORT ROUTER
========================= */

module.exports = router;