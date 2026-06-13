import { useSelector, useDispatch } from "react-redux";
import { setCount, increment } from "../../features/notification/notificationSlice";
import socket from "../../socket";
import { useEffect } from "react";
import API from "../../services/api";
import notificationSound from "../../assets/notification.mp3";
import Style from '../../layouts/Header/Header.module.css';

import {
  FiBell,
  FiMail,
  FiMenu,
  FiSearch
} from "react-icons/fi";

export default function NotificationBell({ onClick }) {
  const dispatch = useDispatch();
  const count = useSelector((state) => state.notification.count);

  // ✅ Load initial count
  useEffect(() => {
    let mounted = true;

    const fetchCount = async () => {
      try {
        const res = await API.get("/notifications/count");
        if (mounted) dispatch(setCount(res.data.count));
      } catch {}
    };

    fetchCount();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Real-time updates
  useEffect(() => {
    socket.on("new_notification", () => {
      dispatch(increment());

      // 🔊 Sound
      const audio = new Audio(notificationSound);
      audio.play();

      // 💥 Animation trigger
      const bell = document.getElementById("bell-icon");
      if (bell) {
        bell.classList.add("animate-bounce");
        setTimeout(() => bell.classList.remove("animate-bounce"), 1000);
      }
    });

    return () => socket.off("new_notification");
  }, []);

  return (
    <div className="relative cursor-pointer" >
      <button type="button" className={"flex-align " + Style.iconBtn} onClick={onClick}>
        <span className={Style.icon}><FiBell /></span>
      </button>
      {count > 0 && (
        <span className={"flex-align " +  Style.bellAlert}>
          {count}
        </span>
      )}
    </div>
  );
}
