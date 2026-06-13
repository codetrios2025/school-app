import { BrowserRouter, Routes, Route } from "react-router-dom";
import socket from "../socket";
import { useSelector } from "react-redux";
import { useEffect } from "react";

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

//Teacher Screens
import TeacherLayout from "../pages/Teachers/TeacherLayout";
import TeacherList from "../pages/Teachers/TeacherList";

import ClassPage from "../pages/ClassPage";
import SubjectPage from "../pages/SubjectPage";
import TeacherPage from "../pages/TeacherPage";
import NotificationPage from "../pages/NotificationPage";


export default function AppRoutes(){
  const user = useSelector((state) => state.auth.user);
  useEffect(() => {
    if (user?.id) {
      socket.emit("join", user.id);
    }
  }, [user]);
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
        </Route>
        {/* Teachers Module */}
        <Route path='/teachers' element={<PrivateRoute><TeacherLayout /></PrivateRoute>}>
          <Route index element={<TeacherList />} />
        </Route>
        <Route path="/notification" element={<PrivateRoute><NotificationPage /></PrivateRoute>}/>
      </Route>
    </Routes>
  )
}