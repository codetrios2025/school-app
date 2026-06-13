import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import socket from "../../socket";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import Style from "./Header.module.css";
import UserImg from '../../assets/images/user.png'
//Screen
import Logout from "../../components/Common/Logout";
import NotificationBell from "../../components/Notifications/NotificationBell";
import NotificationDropdown from "../../components/Notifications/NotificationDropdown";
//icon
import { IoMdNotifications, IoMdSettings  } from "react-icons/io";
import { IoChatbox } from "react-icons/io5";
import { LuLogOut } from "react-icons/lu";

const routeConfig = {
  "/dashboard": {
    title: "Dashboard",
    breadcrumbs: [{ label: "Dashboard" }]
  },
  "/organization": {
    title: "Organization",
    breadcrumbs: [
      { label: "Dashboard", link: "/" },
      { label: "Organization" }
    ]
  },
  "/subjects": {
    title: "Subjects",
    breadcrumbs: [
      { label: "Dashboard", link: "/" },
      { label: "Subjects" }
    ]
  },
  "/students": {
    title: "Students",
    breadcrumbs: [
      { label: "Dashboard", link: "/" },
      { label: "Students" }
    ]
  }
};

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null)
  useEffect(() => {
    if (user?.id) {
      socket.emit("join", user.id);
    }
  }, [user]);
  if (!user) return null;
  const location = useLocation();
  const config = routeConfig[location.pathname] || {
    title: "Page",
    breadcrumbs: [{ label: "Dashboard", link: "/" }, { label: "Page" }]
  };
  console.log(config)
//Logout
  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

//Close Notification Dropdown on body click
  useEffect(() =>{
    const handleClickOutside = (event) =>{
      if(notifRef.current && !notifRef.current.contains(event.target)){
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return()=>{
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [])
  console.log(user);
  return (
    <header className={Style.header}>
      <div className={Style.headInfo}>
        <div className={Style.headTitle}>
          <h1>{config.title}</h1>
          {/* <ul className={Style.navLinks}>
            {config.breadcrumbs.map((item, index) => (
              <li key={index}>
                {item.link ? (
                  <Link to={item.link}>{item.label}</Link>
                ) : (
                  item.label
                )}
              </li>
            ))}
          </ul> */}
        </div>
        <ul className={Style.rightSide}>
          <li ref={notifRef}>
              <NotificationBell onClick={() => setShowNotif((prev) => !prev)} />
              {showNotif && <NotificationDropdown />}
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