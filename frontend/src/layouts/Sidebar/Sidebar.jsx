import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import Style from "./Sidebar.module.css";
import Logo from "../../assets/images/school-logo.png";
import API from "../../services/api";
//ICON
import { RxDashboard } from "react-icons/rx";
import { TbSchool } from "react-icons/tb";
import { LiaBookReaderSolid } from "react-icons/lia";
import { PiStudentLight } from "react-icons/pi";
import { PiChalkboardTeacher } from "react-icons/pi";
import { MdOutlineAssignmentTurnedIn } from "react-icons/md";
import { HiOutlineUserGroup } from "react-icons/hi";
import { AiOutlineNotification } from "react-icons/ai";
import { FaMoneyBillWave, FaClipboard, FaRegBell, FaSlidersH } from "react-icons/fa";

export default function Sidebar() {
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const [schoolName, setSchoolName] = useState("EduSmart");
  const [schoolLogo, setSchoolLogo] = useState(Logo);

  useEffect(() => {
    let active = true;
    let logoUrl = "";
    const loadSchoolIdentity = async () => {
      try {
        const response = await API.get("/school-settings");
        const settings = response.data.data || {};
        if (!active) return;
        if (settings.schoolName) setSchoolName(settings.schoolName);
        if (settings.logoUrl) {
          try {
            const logoResponse = await API.get(settings.logoUrl, {
              responseType: "blob",
            });
            const loadedLogoUrl = URL.createObjectURL(logoResponse.data);
            if (active) {
              logoUrl = loadedLogoUrl;
              setSchoolLogo(loadedLogoUrl);
            } else {
              URL.revokeObjectURL(loadedLogoUrl);
            }
          } catch (error) {
            if (active) {
              toast.error(
                error.response?.data?.message || "Unable to load school logo",
              );
            }
          }
        }
      } catch (error) {
        if (active) {
          toast.error(
            error.response?.data?.message || "Unable to load school branding",
          );
        }
      }
    };
    loadSchoolIdentity();
    return () => {
      active = false;
      if (logoUrl) URL.revokeObjectURL(logoUrl);
    };
  }, []);

  const menu = [
    { name: "Dashboard", path: "/dashboard", icon: <RxDashboard /> },

    // ✅ ADMIN ONLY
    ...(user?.role === "admin"
      ? [
          { name: "Classes", path: "/classes", icon: <TbSchool /> },
          { name: "Subjects", path: "/subjects", icon: <LiaBookReaderSolid /> },
          { name: "Students", path: "/students", icon: <PiStudentLight /> },
          {
            name: "Teachers",
            path: "/teachers",
            icon: <PiChalkboardTeacher />,
          },
          {
            name: "Assignments",
            path: "/assignments",
            icon: <MdOutlineAssignmentTurnedIn />,
          },
          {
            name: "Attendance Reports",
            path: "/attendance-history",
            icon: <HiOutlineUserGroup />,
          },
          { name: "Fees", path: "/fees", icon: <FaMoneyBillWave /> },
          {
            name: "Notification",
            path: "/notification",
            icon: <AiOutlineNotification />,
          },
          {
            name: "School settings",
            path: "/school-settings",
            icon: <FaSlidersH />,
          },
        ]
      : []),

    // ✅ TEACHER ONLY
    ...(user?.role === "teacher"
      ? [
          {
            name: "Assignments",
            path: "/assignments",
            icon: <MdOutlineAssignmentTurnedIn />,
          },
          {
            name: "Take Attendance",
            path: "/attendance",
            icon: <HiOutlineUserGroup />,
          },
          {
            name: "Attendance Reports",
            path: "/attendance-history",
            icon: <HiOutlineUserGroup />,
          },
          {
            name: "Notification",
            path: "/notification",
            icon: <AiOutlineNotification />,
          },
        ]
      : []),

    // ✅ STUDENT / PARENT
    ...(user?.role === "student" || user?.role === "parent"
      ? [
          {
            name: "My Attendance",
            path: "/my-attendance",
            icon: <HiOutlineUserGroup />,
          },
          { name: "Fees", path: "/fees", icon: <FaMoneyBillWave /> },
        ]
      : []),

    {
      name: "Notification inbox",
      path: "/notification-inbox",
      icon: <FaRegBell />,
    },

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
    <div className={Style.sidebar}>
      <div className={Style.schoolInfo}>
        <div className={Style.logo}>
          <img src={schoolLogo} alt={`${schoolName} logo`} />
        </div>
        <div className={Style.schoolName}>
          {schoolName} <span>School Management</span>
        </div>
      </div>
      <div className={Style.navLinks}>
        <ul>
          {menu.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path === "/students" &&
                location.pathname.startsWith("/students/")) ||
              (item.path === "/teachers" &&
                location.pathname.startsWith("/teachers/"));
            return (
              <li key={item.path}>
                <Link to={item.path} className={isActive ? Style.active : ""}>
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
