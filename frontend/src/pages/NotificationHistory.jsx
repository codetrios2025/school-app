import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaBell, FaSearch, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import API from "../services/api";

const initialFilters = {
  search: "",
  classId: "",
  type: "",
  startDate: "",
  endDate: "",
  page: 1,
};

const audienceLabel = {
  all_students: "All students",
  all_teachers: "All teachers",
  class: "Class",
  individual: "Individual",
};

export default function NotificationHistory() {
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";
  const [data, setData] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let active = true;
    const { page, ...filterParams } = filters;
    API.get("/notifications/history", {
      params: { ...filterParams, page, limit: 10 },
    })
      .then((response) => {
        if (!active) return;
        setData(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message || "Unable to load notification history",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters, refreshVersion]);

  useEffect(() => {
    let active = true;
    API.get("/notifications/classes")
      .then((response) => {
        if (active) setClasses(response.data.data || []);
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message || "Unable to load class filters",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const updateFilter = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));

  const deleteNotification = async (id) => {
    if (!window.confirm("Delete this sent notification record?")) return;
    try {
      await API.delete(`/notifications/${id}`);
      toast.success("Notification record deleted");
      setData((current) => current.filter((notification) => notification._id !== id));
      setRefreshVersion((current) => current + 1);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to delete notification",
      );
    }
  };

  return (
    <section className="w-full space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600">
            <FaBell />
            <span className="text-sm font-semibold">Communication center</span>
          </div>
          <h1 data-page-title className="mt-1 text-2xl font-bold text-slate-900">
            Notification history
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? "Review school-wide notification activity and delivery outcomes."
              : "Review notifications you have sent and their delivery outcomes."}
          </p>
        </div>
        <Link
          to="/notification"
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Compose notification
        </Link>
      </header>

      <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="relative sm:col-span-2 lg:col-span-1">
            <span className="sr-only">Search notification text</span>
            <FaSearch className="absolute left-3 top-3.5 text-slate-400" />
            <input
              value={filters.search}
              onChange={(event) => {
                setLoading(true);
                updateFilter("search", event.target.value);
              }}
              placeholder="Search title or message"
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm"
            />
          </label>
          <select
            value={filters.classId}
            onChange={(event) => {
              setLoading(true);
              updateFilter("classId", event.target.value);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">All classes</option>
            {classes.map((schoolClass) => (
              <option key={schoolClass._id} value={schoolClass._id}>
                {schoolClass.className} - {schoolClass.section}
              </option>
            ))}
          </select>
          <select
            value={filters.type}
            onChange={(event) => {
              setLoading(true);
              updateFilter("type", event.target.value);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">All audiences</option>
            <option value="all_students">All students</option>
            <option value="all_teachers">All teachers</option>
            <option value="class">Class</option>
            <option value="individual">Individual</option>
          </select>
          <input
            type="date"
            aria-label="Start date"
            value={filters.startDate}
            onChange={(event) => {
              setLoading(true);
              updateFilter("startDate", event.target.value);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
          />
          <input
            type="date"
            aria-label="End date"
            value={filters.endDate}
            onChange={(event) => {
              setLoading(true);
              updateFilter("endDate", event.target.value);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Notification</th>
                <th className="px-5 py-3.5">Audience</th>
                <th className="px-5 py-3.5">Sent by</th>
                <th className="px-5 py-3.5">Delivery</th>
                <th className="px-5 py-3.5">Date</th>
                {isAdmin && <th className="px-5 py-3.5">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-5 py-12 text-center text-slate-500">
                    Loading notification history...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-5 py-12 text-center text-slate-500">
                    No notifications match these filters.
                  </td>
                </tr>
              ) : data.map((notification) => (
                <tr key={notification._id} className="align-top hover:bg-slate-50/70">
                  <td className="max-w-md px-5 py-4">
                    <p className="font-semibold text-slate-900">{notification.title}</p>
                    <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-slate-600">
                      {notification.message}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                      {audienceLabel[notification.type] || notification.type}
                    </span>
                    {notification.classId && (
                      <p className="mt-1 text-xs text-slate-500">
                        {notification.classId.className} - {notification.classId.section}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {notification.recipients?.length || 0} dashboard recipients
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {notification.sender?.name || "School"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1 text-xs">
                      {(notification.channels || []).includes("inApp") && (
                        <p className="text-slate-600">Dashboard · saved</p>
                      )}
                      {(notification.channels || []).includes("email") && (
                        <p className="text-slate-600">
                          Email · {notification.deliverySummary?.email?.sent || 0} sent
                          {(notification.deliverySummary?.email?.failed || 0) > 0 &&
                            ` · ${notification.deliverySummary.email.failed} failed`}
                        </p>
                      )}
                      {(notification.channels || []).includes("whatsapp") && (
                        <p className="text-slate-600">
                          WhatsApp · {notification.deliverySummary?.whatsapp?.sent || 0} sent
                          {(notification.deliverySummary?.whatsapp?.failed || 0) > 0 &&
                            ` · ${notification.deliverySummary.whatsapp.failed} failed`}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                    {new Date(notification.createdAt).toLocaleString()}
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        aria-label={`Delete ${notification.title}`}
                        onClick={() => deleteNotification(notification._id)}
                        className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <p className="text-sm text-slate-500">
            Page {filters.page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={filters.page <= 1 || loading}
              onClick={() => {
                setLoading(true);
                setFilters((current) => ({ ...current, page: current.page - 1 }));
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={filters.page >= totalPages || loading}
              onClick={() => {
                setLoading(true);
                setFilters((current) => ({ ...current, page: current.page + 1 }));
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </footer>
      </section>
    </section>
  );
}
