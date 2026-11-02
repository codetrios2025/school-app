import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import Style from "./Header.module.css";
import UserImg from "../../assets/images/user.png";
import NotificationBell from "../../components/Notifications/NotificationBell";
import NotificationDropdown from "../../components/Notifications/NotificationDropdown";
import { LuLogOut } from "react-icons/lu";

const routeConfig = {
  "/dashboard": {
    title: "Dashboard",
  },
  "/organization": {
    title: "Organization",
  },
  "/subjects": {
    title: "Subjects",
  },
  "/students": {
    title: "Students",
  },
  "/teachers": { title: "Teachers" },
  "/classes": { title: "Classes" },
  "/assignments": { title: "Assignments" },
  "/attendance": { title: "Take Attendance" },
  "/attendance-history": { title: "Attendance Reports" },
  "/reports": { title: "Reports" },
  "/my-attendance": { title: "My Attendance" },
  "/fees": { title: "Fee Management" },
  "/notification": { title: "School Communications" },
  "/notification-history": { title: "Notification History" },
  "/notification-inbox": { title: "Notification Inbox" },
  "/school-settings": { title: "School Profile & Setting" },
};

const getPageTitle = (pathname) => {
  const exactMatch = routeConfig[pathname];
  if (exactMatch) return exactMatch.title;
  if (/^\/students\/[^/]+\/edit$/.test(pathname)) return "Edit Student";
  if (/^\/students\/[^/]+$/.test(pathname)) return "Student Details";
  if (/^\/teachers\/[^/]+$/.test(pathname)) return "Teacher Details";

  const lastSegment = pathname.split("/").filter(Boolean).pop();
  return lastSegment
    ? lastSegment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Dashboard";
};

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;
  const pageTitle = getPageTitle(location.pathname);

//Logout
  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };
  return (
    <header className={Style.header}>
      <div className={Style.headInfo}>
        <div className={Style.headTitle}>
          <h1>{pageTitle}</h1>
        </div>
        <ul className={Style.rightSide}>
          <li ref={notifRef} className="relative">
              <NotificationBell onClick={() => setShowNotif((prev) => !prev)} />
              {showNotif && (
                <NotificationDropdown onNavigate={() => setShowNotif(false)} />
              )}
          </li>
          <li>
            <button onClick={handleLogout} className={"flex-align " + Style.iconBtn}><LuLogOut /></button>
          </li>
          <li className={Style.user}>
            <button type="button" className={"flex-align " + Style.iconBtn}>
              <img
                src={UserImg}
                alt="User Avatar"
                className={Style.avatar}
              />
            </button>
            <div className={Style.name}>{user?.name || "User"} <span>{user?.role}</span></div>
          </li>
        </ul>
      </div>
    </header>
  );
}