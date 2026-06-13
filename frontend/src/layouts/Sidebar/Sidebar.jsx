import React from "react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import socket from "../../socket";
import Style from "./Sidebar.module.css";
import Logo from '../../assets/images/school-logo.png';
import {
  FaHome,
  FaBook,
  FaUsers,
  FaClipboard,
  FaEnvelope,
  FaUserTie,
  FaUserGraduate,
} from "react-icons/fa";

//ICON
import { RxDashboard } from "react-icons/rx";
import { TbSchool } from "react-icons/tb";
import { LiaBookReaderSolid } from "react-icons/lia";
import { PiStudentLight } from "react-icons/pi";
import { PiChalkboardTeacher } from "react-icons/pi";
import { MdOutlineAssignmentTurnedIn } from "react-icons/md";
import { HiOutlineUserGroup } from "react-icons/hi";
import { AiOutlineNotification } from "react-icons/ai";



export default function Sidebar({children}) {
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    if (user?.id) {
      socket.emit("join", user.id); // 🔥 IMPORTANT
    }
  }, [user]);

  // 🎯 ROLE-BASED MENU
  const menu1 = [
    { name: "Dashboard", path: "/dashboard", icon: <RxDashboard /> },

    // ✅ ADMIN ONLY
    ...(user?.role === "admin"
      ? [
          { name: "Classes", path: "/classes", icon: <FaBook /> },
          { name: "Subjects", path: "/subjects", icon: <FaBook /> },
          { name: "Students", path: "/students", icon: <FaUsers /> },
          { name: "Teachers", path: "/teachers", icon: <FaUserTie /> },
          { name: "Assignments", path: "/assignments", icon: <FaUserTie /> },
          {
            name: "Notification",
            path: "/notification",
            icon: <FaClipboard />,
          },
        ]
      : []),

    // ✅ TEACHER ONLY
    ...(user?.role === "teacher"
      ? [
          { name: "Assignments", path: "/assignments", icon: <FaUserTie /> },
          { name: "Attendance", path: "/attendance", icon: <FaClipboard /> },
          {
            name: "Notification",
            path: "/notification",
            icon: <FaClipboard />,
          },
        ]
      : []),

    // ✅ STUDENT / PARENT
    ...(user?.role === "student" || user?.role === "parent"
      ? [
          {
            name: "My Attendance",
            path: "/my-attendance",
            icon: <FaUserGraduate />,
          },
        ]
      : []),

    // ✅ COMMON (ADMIN + TEACHER)
    ...(user?.role === "admin" || user?.role === "teacher"
      ? [
          { name: "Reports", path: "/reports", icon: <FaClipboard /> },
          {
            name: "History",
            path: "/notification-history",
            icon: <FaClipboard />,
          },
        ]
      : []),

    // ✅ ALL USERS
    // { name: "Messages", path: "/messages", icon: <FaEnvelope /> },
  ];

  const menu = [
    { name: "Dashboard", path: "/dashboard", icon: <RxDashboard /> },

    // ✅ ADMIN ONLY
    ...(user?.role === "admin"
      ? [
          { name: "Classes", path: "/classes", icon: <TbSchool /> },
          { name: "Subjects", path: "/subjects", icon: <LiaBookReaderSolid /> },
          { name: "Students", path: "/students", icon: <PiStudentLight /> },
          { name: "Teachers", path: "/teachers", icon: <PiChalkboardTeacher /> },
          { name: "Assignments", path: "/assignments", icon: <MdOutlineAssignmentTurnedIn /> },
          { name: "Attendance", path: "/attendance-history", icon: <HiOutlineUserGroup />,},
          { name: "Notification", path: "/notification", icon: <AiOutlineNotification />,},
        ]
      : []),

    // ✅ TEACHER ONLY
    ...(user?.role === "teacher"
      ? [
          { name: "Assignments", path: "/assignments", icon: <MdOutlineAssignmentTurnedIn /> },
          { name: "Attendance", path: "/attendance", icon: <HiOutlineUserGroup /> },

          // 🔥 NEW
          { name: "Student Attendance", path: "/attendance-history", icon: <HiOutlineUserGroup />},
          { name: "Notification", path: "/notification", icon: <AiOutlineNotification /> },
        ]
      : []),

    // ✅ STUDENT / PARENT
    ...(user?.role === "student" || user?.role === "parent"
      ? [
          { name: "My Attendance", path: "/my-attendance", icon: <HiOutlineUserGroup />},
          { name: "My Attendance History", path: "/attendance-history", icon: <HiOutlineUserGroup />},
        ]
      : []),

    // ✅ COMMON (ADMIN + TEACHER)
    ...(user?.role === "admin" || user?.role === "teacher"
      ? [
          { name: "Reports", path: "/reports", icon: <FaClipboard /> },
          { name: "History", path: "/notification-history", icon: <FaClipboard />},
        ]
      : []),
  ];
  return (
    <div className={Style.sidebar}>
      <div className={Style.schoolInfo}>
        <div className={Style.logo}>
          <img src={Logo} alt="School Logo" />
        </div>
        <div className={Style.schoolName}>EduSmart <span>School Management</span></div>
      </div>
      <div className={Style.navLinks}>
        <ul>
          {menu.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={isActive ? Style.active : ""}
                  >
                  <span className={Style.icon}>{item.icon}</span>
                  {item.name}
                </Link>
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
}