import { BrowserRouter, Routes, Route } from "react-router-dom";
import socket from "./socket";
import { useSelector } from "react-redux";
import { useEffect } from "react";

import Login from "./components/Common/LoginScreen/Login";
//import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import ClassPage from "./pages/ClassPage";
import PrivateRoute from "./components/PrivateRoute";
import SubjectPage from "./pages/SubjectPage";
import StudentPage from "./pages/StudentPage";
import AssignmentPage from "./pages/AssignmentPage";
import TeacherPage from "./pages/TeacherPage";
import AttendancePage from "./pages/AttendancePage";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import NotificationPage from "./pages/NotificationPage";
import ReportPage from "./pages/ReportPage";
import DashboardLayout from "./layouts/DashboardLayout";
import NotificationHistory from "./pages/NotificationHistory";
import StudentAttendanceHistory from "./pages/StudentAttendanceHistory";
import MyAttendance from "./pages/MyAttendance";

import AppRoutes from "./Routing/AppRoute";

export default function App() {
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (user?.id) {
      socket.emit("join", user.id);
    }
  }, [user]);
  return (
    <AppRoutes />
    // <BrowserRouter>
    //   <Routes>
    //     <Route path="/" element={<Login />} />
    //     <Route path="/register" element={<Register />} />
    //     <Route
    //       path="/classes"
    //       element={
    //         <PrivateRoute>
    //           <ClassPage />
    //         </PrivateRoute>
    //       }
    //     />

    //     <Route
    //       path="/dashboard"
    //       element={
    //         <PrivateRoute>
    //           <Dashboard />
    //         </PrivateRoute>
    //       }
    //     />
    //     <Route
    //       path="/classes"
    //       element={
    //         <PrivateRoute>
    //           <ClassPage />
    //         </PrivateRoute>
    //       }
    //     />
    //     <Route
    //       path="/subjects"
    //       element={
    //         <PrivateRoute>
    //           <SubjectPage />
    //         </PrivateRoute>
    //       }
    //     />
    //     <Route
    //       path="/students"
    //       element={
    //         <PrivateRoute>
    //           <StudentPage />
    //         </PrivateRoute>
    //       }
    //     />
    //     <Route
    //       path="/assignments"
    //       element={
    //         <PrivateRoute>
    //           <AssignmentPage />
    //         </PrivateRoute>
    //       }
    //     />
    //     <Route path="/teachers" element={<TeacherPage />} />
    //     <Route
    //       path="/attendance"
    //       element={
    //         <PrivateRoute>
    //           <AttendancePage />
    //         </PrivateRoute>
    //       }
    //     />
    //     <Route path="/reports" element={<ReportPage />} />
    //     <Route path="/forgot-password" element={<ForgotPassword />} />
    //     <Route path="/reset-password/:token" element={<ResetPassword />} />
    //     <Route
    //       path="/notification"
    //       element={
    //         <DashboardLayout>
    //           <NotificationPage />
    //         </DashboardLayout>
    //       }
    //     />
    //     <Route path="/notification-history" element={<NotificationHistory />} />
    //     <Route
    //       path="/attendance-history"
    //       element={<StudentAttendanceHistory />}
    //     />
    //     <Route path="/my-attendance" element={<MyAttendance />} />
    //   </Routes>
    // </BrowserRouter>
  );
}
