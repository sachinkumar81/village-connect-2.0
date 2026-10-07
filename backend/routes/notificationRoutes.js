const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();


// ============================================================
// GET ALL NOTIFICATIONS
// ============================================================

router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        problem_id,
        message,
        is_read,
        created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    res.status(200).json({
      message: "Notifications fetched successfully",
      notifications: result.rows,
    });

  } catch (error) {
    console.error(
      "Fetch notifications error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
});


// ============================================================
// GET UNREAD NOTIFICATION COUNT
// ============================================================

router.get(
  "/unread-count",
  authenticateToken,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT COUNT(*) AS count
        FROM notifications
        WHERE user_id = $1
        AND is_read = false
        `,
        [req.user.id]
      );

      res.status(200).json({
        count: Number(result.rows[0].count),
      });

    } catch (error) {
      console.error(
        "Unread notification count error:",
        error.message
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// ============================================================
// MARK ONE NOTIFICATION AS READ
// ============================================================

router.patch(
  "/:id/read",
  authenticateToken,
  async (req, res) => {
    try {
      const notificationId = req.params.id;

      const result = await pool.query(
        `
        UPDATE notifications
        SET is_read = true
        WHERE id = $1
        AND user_id = $2
        RETURNING *
        `,
        [
          notificationId,
          req.user.id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Notification not found",
        });
      }

      res.status(200).json({
        message: "Notification marked as read",
        notification: result.rows[0],
      });

    } catch (error) {
      console.error(
        "Mark notification as read error:",
        error.message
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// ============================================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================================

router.patch(
  "/read-all",
  authenticateToken,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        UPDATE notifications
        SET is_read = true
        WHERE user_id = $1
        AND is_read = false
        RETURNING id
        `,
        [req.user.id]
      );

      res.status(200).json({
        message: "All notifications marked as read",
        updated: result.rows.length,
      });

    } catch (error) {
      console.error(
        "Mark all notifications as read error:",
        error.message
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


module.exports = router;