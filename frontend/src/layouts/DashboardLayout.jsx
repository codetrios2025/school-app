import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import socket from "../socket";
import {
  FaHome,
  FaBook,
  FaUsers,
  FaClipboard,
  FaEnvelope,
  FaUserTie,
  FaUserGraduate,
} from "react-icons/fa";
import LogoutButton from "../components/LogoutButton";
import NotificationBell from "../components/NotificationBell";
import NotificationDropdown from "../components/NotificationDropdown";

export default function DashboardLayout({ children }) {
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
    { name: "Dashboard", path: "/dashboard", icon: <FaHome /> },

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
    { name: "Dashboard", path: "/dashboard", icon: <FaHome /> },

    // ✅ ADMIN ONLY
    ...(user?.role === "admin"
      ? [
          { name: "Classes", path: "/classes", icon: <FaBook /> },
          { name: "Subjects", path: "/subjects", icon: <FaBook /> },
          { name: "Students", path: "/students", icon: <FaUsers /> },
          { name: "Teachers", path: "/teachers", icon: <FaUserTie /> },
          { name: "Assignments", path: "/assignments", icon: <FaUserTie /> },

          // 🔥 NEW
          {
            name: "Attendance History",
            path: "/attendance-history",
            icon: <FaClipboard />,
          },

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

          // 🔥 NEW
          {
            name: "Student Attendance",
            path: "/attendance-history",
            icon: <FaClipboard />,
          },

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

          // 🔥 NEW
          {
            name: "My Attendance History",
            path: "/attendance-history",
            icon: <FaClipboard />,
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
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* SIDEBAR */}
      <div className="w-64 bg-indigo-800 text-white flex flex-col justify-between">
        {/* TOP */}
        <div>
          <div className="p-6 text-xl font-bold">🎓 School App</div>

          <nav className="px-3 space-y-2">
            {menu.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                    isActive ? "bg-indigo-600 shadow" : "hover:bg-indigo-700"
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM USER INFO */}
        <div className="p-4 border-t border-indigo-700">
          <div className="flex items-center gap-3">
            <div className="bg-white text-indigo-700 rounded-full w-10 h-10 flex items-center justify-center">
              👤
            </div>

            <div>
              <p className="text-sm font-semibold">{user?.name || "User"}</p>
              <p className="text-xs text-gray-300">{user?.email || ""}</p>
              <p className="text-xs text-indigo-200 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm">
          {/* LEFT */}
          <h2 className="text-lg font-semibold capitalize">
            {user?.role} Dashboard
          </h2>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4 relative">
            {/* 🔔 Notification */}
            <div id="bell-icon" className="relative cursor-pointer">
              <NotificationBell onClick={() => setShowNotif(!showNotif)} />

              {showNotif && <NotificationDropdown />}
            </div>

            {/* Logout */}
            <LogoutButton />
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
