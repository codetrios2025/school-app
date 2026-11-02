import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaCheck, FaRegBell } from "react-icons/fa";
import toast from "react-hot-toast";
import { setCount, setNotifications } from "../../features/notification/notificationSlice";
import API from "../../services/api";

export default function NotificationDropdown({ onNavigate }) {
  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.notification.list);
  const unreadCount = useSelector((state) => state.notification.count);
  const userId = useSelector((state) => state.auth.user?.id);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await API.get("/notifications", {
        params: { page: 1, limit: 10 },
      });
      dispatch(setNotifications(response.data.data || []));
      dispatch(setCount(response.data.unreadCount || 0));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to load notifications",
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications, userId]);

  const isRead = (notification) =>
    notification.readBy?.some((id) => String(id) === String(userId));

  const markAsRead = async (id) => {
    setUpdating(true);
    try {
      await API.put(`/notifications/${id}/read`);
      await loadNotifications();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to mark notification as read",
      );
    } finally {
      setUpdating(false);
    }
  };

  const markAllAsRead = async () => {
    setUpdating(true);
    try {
      await API.put("/notifications/read-all");
      await loadNotifications();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to mark notifications as read",
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <section
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-full z-50 mt-3 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-xl"
    >
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="font-semibold text-slate-900">Notifications</h2>
          <p className="text-xs text-slate-500">Recent dashboard alerts</p>
        </div>
        <button
          type="button"
          disabled={updating || unreadCount === 0}
          onClick={markAllAsRead}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Mark all as read
        </button>
      </header>

      <div className="max-h-[min(65vh,30rem)] overflow-y-auto">
        {loading ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <FaRegBell className="mx-auto text-2xl text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">You are all caught up.</p>
          </div>
        ) : notifications.map((notification) => {
          const read = isRead(notification);
          return (
            <article
              key={notification._id}
              className={`border-b border-slate-100 px-4 py-3 last:border-0 ${
                read ? "bg-white" : "bg-indigo-50/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    read ? "bg-slate-200" : "bg-indigo-500"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {notification.title}
                    </h3>
                    {!read && (
                      <button
                        type="button"
                        aria-label="Mark as read"
                        disabled={updating}
                        onClick={() => markAsRead(notification._id)}
                        className="rounded p-1 text-slate-400 hover:bg-white hover:text-indigo-600"
                      >
                        <FaCheck />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {notification.sender?.name || "School"} ·{" "}
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <footer className="border-t border-slate-100 px-4 py-3 text-center">
        <Link
          to="/notification-inbox"
          onClick={onNavigate}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          View all notifications
        </Link>
      </footer>
    </section>
  );
}
