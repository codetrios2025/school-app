import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaCheck, FaRegBell } from "react-icons/fa";
import toast from "react-hot-toast";
import { setCount } from "../features/notification/notificationSlice";
import API from "../services/api";

export default function NotificationInbox() {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.user?.id);
  const unreadCount = useSelector((state) => state.notification.count);
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let active = true;
    API.get("/notifications", {
      params: { page, limit: 20 },
    })
      .then((response) => {
        if (!active) return;
        setNotifications(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
        dispatch(setCount(response.data.unreadCount || 0));
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message || "Unable to load your notifications",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dispatch, page, refreshVersion, userId]);

  const isRead = (notification) =>
    notification.readBy?.some((id) => String(id) === String(userId));

  const markAsRead = async (id) => {
    setUpdating(true);
    try {
      await API.put(`/notifications/${id}/read`);
      setRefreshVersion((current) => current + 1);
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
      setRefreshVersion((current) => current + 1);
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
    <section className="w-full space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600">
            <FaRegBell />
            <span className="text-sm font-semibold">Your dashboard</span>
          </div>
          <h1 data-page-title className="mt-1 text-2xl font-bold text-slate-900">
            Notification inbox
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Important messages from your school and teachers.
          </p>
        </div>
        <button
          type="button"
          disabled={updating || unreadCount === 0}
          onClick={markAllAsRead}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          Mark all as read
        </button>
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        {loading ? (
          <p className="px-5 py-14 text-center text-sm text-slate-500">
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <FaRegBell className="mx-auto text-3xl text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">No notifications yet</p>
            <p className="mt-1 text-sm text-slate-500">
              School and teacher messages will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const read = isRead(notification);
              return (
                <article
                  key={notification._id}
                  className={`p-5 sm:px-6 ${read ? "" : "bg-indigo-50/40"}`}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                        read ? "bg-slate-200" : "bg-indigo-500"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h2 className="font-semibold text-slate-900">
                            {notification.title}
                          </h2>
                          <p className="mt-1 text-xs text-slate-500">
                            {notification.sender?.name || "School"} ·{" "}
                            {new Date(notification.createdAt).toLocaleString()}
                            {notification.classId &&
                              ` · ${notification.classId.className} - ${notification.classId.section}`}
                          </p>
                        </div>
                        {!read && (
                          <button
                            type="button"
                            disabled={updating}
                            onClick={() => markAsRead(notification._id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                          >
                            <FaCheck /> Mark read
                          </button>
                        )}
                      </div>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <footer className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
          <Link
            to="/dashboard"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Back to dashboard
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => {
                setLoading(true);
                setPage((current) => current - 1);
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => {
                setLoading(true);
                setPage((current) => current + 1);
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </footer>
      </section>
    </section>
  );
}
