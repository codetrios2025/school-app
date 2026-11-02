import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiBell } from "react-icons/fi";
import toast from "react-hot-toast";
import { increment, setCount } from "../../features/notification/notificationSlice";
import socket from "../../socket";
import API from "../../services/api";
import notificationSound from "../../assets/notification.mp3";
import Style from "../../layouts/Header/Header.module.css";

export default function NotificationBell({ onClick }) {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.user?.id);
  const count = useSelector((state) => state.notification.count);

  useEffect(() => {
    let active = true;
    API.get("/notifications/count")
      .then((response) => {
        if (active) dispatch(setCount(response.data.count));
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message || "Unable to load unread notifications",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [dispatch, userId]);

  useEffect(() => {
    const handleNotification = () => {
      dispatch(increment());
      const audio = new Audio(notificationSound);
      audio.play().catch(() => {});
    };
    socket.on("new_notification", handleNotification);
    return () => socket.off("new_notification", handleNotification);
  }, [dispatch]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications${count ? `, ${count} unread` : ""}`}
        aria-haspopup="dialog"
        onClick={onClick}
        className={"flex-align " + Style.iconBtn}
      >
        <span className={Style.icon}><FiBell /></span>
      </button>
      {count > 0 && (
        <span className={"flex-align " + Style.bellAlert}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
}
