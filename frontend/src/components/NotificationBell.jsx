import { useSelector, useDispatch } from "react-redux";
import {
  setCount,
  increment,
} from "../features/notification/notificationSlice";
import socket from "../socket";
import { useEffect } from "react";
import API from "../services/api";
import notificationSound from "../assets/notification.mp3";

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
    <div className="relative cursor-pointer" onClick={onClick}>
      🔔
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}
