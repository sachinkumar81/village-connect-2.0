import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import CitizenDashboard from "./pages/CitizenDashboard";
import LeaderDashboard from "./pages/LeaderDashboard";

import ReportProblem from "./pages/ReportProblem";
import MyReports from "./pages/MyReports";
import Notifications from "./pages/Notifications";


// ========================================
// PROTECTED ROUTE
// ========================================

function ProtectedRoute({ children, allowedRole }) {

  const token = localStorage.getItem("token");

  const user = JSON.parse(
    localStorage.getItem("user")
  );


  // Not logged in
  if (!token || !user) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  // Role not allowed
  if (
    allowedRole &&
    user.role !== allowedRole
  ) {

    if (user.role === "LEADER") {

      return (
        <Navigate
          to="/leader-dashboard"
          replace
        />
      );

    }

    return (
      <Navigate
        to="/citizen-dashboard"
        replace
      />
    );

  }


  return children;
}


// ========================================
// APP
// ========================================

function App() {

  return (

    <BrowserRouter>

      <Routes>


        {/* ================================
            HOME
        ================================= */}

        <Route
          path="/"
          element={<Home />}
        />


        {/* ================================
            LOGIN
        ================================= */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* ================================
            REGISTER
        ================================= */}

        <Route
          path="/register"
          element={<Register />}
        />


        {/* ================================
            CITIZEN DASHBOARD
        ================================= */}

        <Route
          path="/citizen-dashboard"
          element={

            <ProtectedRoute
              allowedRole="CITIZEN"
            >

              <CitizenDashboard />

            </ProtectedRoute>

          }
        />


        {/* ================================
            REPORT PROBLEM
        ================================= */}

        <Route
          path="/report-problem"
          element={

            <ProtectedRoute
              allowedRole="CITIZEN"
            >

              <ReportProblem />

            </ProtectedRoute>

          }
        />


        {/* ================================
            MY REPORTS
        ================================= */}

        <Route
          path="/my-reports"
          element={

            <ProtectedRoute
              allowedRole="CITIZEN"
            >

              <MyReports />

            </ProtectedRoute>

          }
        />


        {/* ================================
            NOTIFICATIONS
        ================================= */}

        <Route
          path="/notifications"
          element={

            <ProtectedRoute
              allowedRole="CITIZEN"
            >

              <Notifications />

            </ProtectedRoute>

          }
        />


        {/* ================================
            LEADER DASHBOARD
        ================================= */}

        <Route
          path="/leader-dashboard"
          element={

            <ProtectedRoute
              allowedRole="LEADER"
            >

              <LeaderDashboard />

            </ProtectedRoute>

          }
        />


        {/* ================================
            UNKNOWN ROUTE
        ================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />


      </Routes>

    </BrowserRouter>

  );
}


export default App;