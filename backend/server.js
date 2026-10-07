const express = require("express");
const cors = require("cors");
const path = require("path");

const pool = require("./db");

const authRoutes = require("./routes/authRoutes");
const problemRoutes = require("./routes/problemRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

const PORT = 5000;


// ==================================================
// MIDDLEWARE
// ==================================================

app.use(cors());

app.use(express.json());


// ==================================================
// SERVE UPLOADED FILES
// ==================================================

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);


// ==================================================
// HOME ROUTE
// ==================================================

app.get("/", (req, res) => {
  res.send(
    "VillageConnect Backend is running!"
  );
});


// ==================================================
// DATABASE TEST
// ==================================================

app.get(
  "/db-test",
  async (req, res) => {

    try {

      const result =
        await pool.query(
          "SELECT NOW()"
        );

      res.json({
        message:
          "Database connected successfully!",

        time:
          result.rows[0].now,
      });

    } catch (error) {

      console.error(
        "Database connection error:",
        error.message
      );

      res.status(500).json({
        message:
          "Database connection failed",
      });

    }

  }
);


// ==================================================
// AUTH ROUTES
// ==================================================

app.use(
  "/api/auth",
  authRoutes
);


// ==================================================
// PROBLEM ROUTES
// ==================================================

app.use(
  "/api/problems",
  problemRoutes
);


// ==================================================
// NOTIFICATION ROUTES
// ==================================================

app.use(
  "/api/notifications",
  notificationRoutes
);


// ==================================================
// START SERVER
// ==================================================

app.listen(
  PORT,
  () => {

    console.log(
      `Server running on http://localhost:${PORT}`
    );

  }
);