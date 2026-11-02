import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import PrivateRoute from "./PrivateRoute";
import DashboardLayout from "../layouts/DashboardLayout";
//Login or Registion
import Login from "../components/Common/LoginScreen/Login";
import Register from "../pages/Register";

//Dashboard
import Dashboard from "../pages/Dashboard/Dashboard";
//Student Screens
import StudentLayout from "../pages/Students/StudentLayout";
import StudentList from "../pages/Students/StudentList";
import AddStudent from "../pages/Students/AddStudent";
import StudentDetails from "../pages/Students/StudentDetails";

//Teacher Screens
import TeacherLayout from "../pages/Teachers/TeacherLayout";
import TeacherList from "../pages/Teachers/TeacherList";
import TeacherDetails from "../pages/Teachers/TeacherDetails";

import ClassPage from "../pages/ClassPage";
import SubjectPage from "../pages/SubjectPage";
import TeacherPage from "../pages/TeacherPage";
import NotificationPage from "../pages/NotificationPage";
import FeePage from "../pages/FeePage";
import AssignmentPage from "../pages/AssignmentPage";
import AttendancePage from "../pages/AttendancePage";
import StudentAttendanceHistory from "../pages/StudentAttendanceHistory";
import ReportPage from "../pages/ReportPage";
import NotificationHistory from "../pages/NotificationHistory";
import NotificationInbox from "../pages/NotificationInbox";
import SchoolSettingsPage from "../pages/SchoolSettingsPage";


export default function AppRoutes(){
  const user = useSelector((state) => state.auth.user);
  return(
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<DashboardLayout />}>
        {/* Dashboard Module */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>}/>

        {/* Classes Module */}
        <Route path="/classes" element={<PrivateRoute><ClassPage /></PrivateRoute>}/>

        {/* Subjects Module */}
        <Route path="/subjects" element={<PrivateRoute><SubjectPage /></PrivateRoute>}/>
        
        {/* Students Module */}
        <Route path='/students' element={<PrivateRoute><StudentLayout /></PrivateRoute>}>
          <Route index element={<StudentList />} />
          <Route path="add-student" element={<AddStudent />} />
          <Route path=":id" element={<StudentDetails />} />
          <Route path=":id/edit" element={<AddStudent />} />
        </Route>
        {/* Teachers Module */}
        <Route path='/teachers' element={<PrivateRoute><TeacherLayout /></PrivateRoute>}>
          <Route index element={<TeacherList />} />
          <Route path=":id" element={<TeacherDetails />} />
        </Route>
        <Route
          path="/notification"
          element={
            <PrivateRoute>
              {user?.role === "admin" || user?.role === "teacher"
                ? <NotificationPage />
                : <Navigate to="/dashboard" replace />}
            </PrivateRoute>
          }
        />
        <Route
          path="/notification-history"
          element={
            <PrivateRoute>
              {user?.role === "admin" || user?.role === "teacher"
                ? <NotificationHistory />
                : <Navigate to="/dashboard" replace />}
            </PrivateRoute>
          }
        />
        <Route
          path="/notification-inbox"
          element={<PrivateRoute><NotificationInbox /></PrivateRoute>}
        />
        <Route
          path="/school-settings"
          element={
            <PrivateRoute>
              {user?.role === "admin"
                ? <SchoolSettingsPage />
                : <Navigate to="/dashboard" replace />}
            </PrivateRoute>
          }
        />
        <Route path="/fees" element={<PrivateRoute><FeePage /></PrivateRoute>}/>
        <Route path="/assignments" element={<PrivateRoute><AssignmentPage /></PrivateRoute>}/>
        <Route path="/attendance" element={<PrivateRoute><AttendancePage /></PrivateRoute>}/>
        <Route path="/attendance-history" element={<PrivateRoute><StudentAttendanceHistory /></PrivateRoute>}/>
        <Route path="/my-attendance" element={<PrivateRoute><StudentAttendanceHistory /></PrivateRoute>}/>
        <Route
          path="/reports"
          element={
            <PrivateRoute>
              {user?.role === "admin" || user?.role === "teacher"
                ? <ReportPage />
                : <Navigate to="/dashboard" replace />}
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  )
}