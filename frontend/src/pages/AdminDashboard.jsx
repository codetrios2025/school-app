import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBell,
  FaBookOpen,
  FaCalendarCheck,
  FaChalkboard,
  FaClipboardList,
  FaMoneyBillWave,
  FaUserGraduate,
  FaUsers,
} from "react-icons/fa";
import toast from "react-hot-toast";
import API from "../services/api";

const cardClass =
  "rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03]";

const dateLabel = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
}).format(new Date());

const formatMoney = (amount, currency) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    return `${currency} ${(amount || 0).toLocaleString()}`;
  }
};

const shortcuts = [
  {
    label: "Add student",
    description: "Create a student profile",
    to: "/students/add-student",
    icon: <FaUserGraduate />,
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    label: "Add teacher",
    description: "Manage school staff",
    to: "/teachers",
    icon: <FaUsers />,
    color: "bg-sky-50 text-sky-600",
  },
  {
    label: "Manage classes",
    description: "View classes and sections",
    to: "/classes",
    icon: <FaChalkboard />,
    color: "bg-violet-50 text-violet-600",
  },
  {
    label: "Fee management",
    description: "Review fee records",
    to: "/fees",
    icon: <FaMoneyBillWave />,
    color: "bg-emerald-50 text-emerald-600",
  },
];

export default function AdminDashboard() {
  const user = useSelector((state) => state.auth.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    API.get("/dashboard/admin")
      .then((response) => {
        if (active) {
          setData(response.data.data);
          setError("");
        }
      })
      .catch((requestError) => {
        if (!active) return;
        const message =
          requestError.response?.data?.message ||
          "Unable to load the school dashboard. Please try again.";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retryKey]);

  const summary = data?.summary;
  const stats = [
    {
      label: "Active students",
      value: summary?.students,
      icon: <FaUserGraduate />,
      color: "bg-indigo-50 text-indigo-600",
      note: "Enrolled students",
    },
    {
      label: "Active teachers",
      value: summary?.teachers,
      icon: <FaUsers />,
      color: "bg-sky-50 text-sky-600",
      note: "Teaching staff",
    },
    {
      label: "Classes",
      value: summary?.classes,
      icon: <FaChalkboard />,
      color: "bg-violet-50 text-violet-600",
      note: "Classes and sections",
    },
    {
      label: "Attendance sessions",
      value: summary?.attendanceSessionsToday,
      icon: <FaCalendarCheck />,
      color: "bg-emerald-50 text-emerald-600",
      note: "Recorded today",
    },
  ];

  return (
    <section className="min-h-full space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8">
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 p-6 text-white shadow-lg shadow-indigo-950/10 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border-[36px] border-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-blue-400/10 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold tracking-wide text-indigo-200">
              SCHOOL OVERVIEW
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome, {user?.name || "Administrator"}
            </h2>
            <p className="mt-2 text-sm text-indigo-100 sm:text-base">
              {data?.schoolName ? `${data.schoolName} · ` : ""}
              {dateLabel}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/notification"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-indigo-800 shadow-sm transition hover:bg-indigo-50"
            >
              <FaBell />
              Send announcement
              <FaArrowRight className="text-xs" />
            </Link>
            <Link
              to="/attendance-history"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <FaClipboardList />
              Attendance reports
            </Link>
          </div>
        </div>
      </header>

      {error && !data ? (
        <section className={`${cardClass} p-6`}>
          <h2 className="font-bold text-slate-900">
            Dashboard data is unavailable
          </h2>
          <p className="mt-1 text-sm text-slate-500">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError("");
              setRetryKey((current) => current + 1);
            }}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Try again
          </button>
        </section>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <article
                key={stat.label}
                className={`${cardClass} flex items-center gap-4 p-5`}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg ${stat.color}`}
                >
                  {stat.icon}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>
                  {loading ? (
                    <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-100" />
                  ) : (
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {(stat.value ?? 0).toLocaleString()}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">{stat.note}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <section className={`${cardClass} overflow-hidden`}>
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div>
                  <h2 className="font-bold text-slate-900">
                    Attendance overview
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Student attendance recorded today
                  </p>
                </div>
                <Link
                  to="/attendance-history"
                  className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  View reports
                </Link>
              </header>
              <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-500">
                    Attendance sessions
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {loading
                      ? "—"
                      : (summary?.attendanceSessionsToday ?? 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Class registers submitted today
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                    <p className="text-sm font-medium text-emerald-700">
                      Present
                    </p>
                    <p className="mt-2 text-2xl font-bold text-emerald-800">
                      {loading ? "—" : (summary?.presentToday ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
                    <p className="text-sm font-medium text-rose-700">Absent</p>
                    <p className="mt-2 text-2xl font-bold text-rose-800">
                      {loading ? "—" : (summary?.absentToday ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <Link
                    to="/attendance"
                    className="col-span-2 inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200 px-3 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                  >
                    Open attendance
                    <FaArrowRight className="text-xs" />
                  </Link>
                </div>
              </div>
              <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-800">
                    Recent attendance
                  </h3>
                  <span className="text-xs text-slate-400">
                    Latest class registers
                  </span>
                </div>
                {loading ? (
                  <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
                ) : data?.recentAttendance?.length ? (
                  <div className="divide-y divide-slate-100">
                    {data.recentAttendance.map((record) => (
                      <article
                        key={record._id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {record.className}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {record.subject} ·{" "}
                            {new Date(`${record.date}T00:00:00`).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 text-xs font-semibold">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                            {record.present} present
                          </span>
                          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">
                            {record.absent} absent
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-sm text-slate-500">
                    No attendance records have been submitted yet.
                  </p>
                )}
              </div>
            </section>

            <section className={`${cardClass} overflow-hidden`}>
              <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                <div>
                  <h2 className="font-bold text-slate-900">Fee summary</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    School-wide fee collection and balances
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FaMoneyBillWave />
                </span>
              </header>
              {loading ? (
                <div className="space-y-3 p-5">
                  <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
                  <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
                </div>
              ) : data?.feeTotals?.length ? (
                <div className="divide-y divide-slate-100">
                  {data.feeTotals.map((fee) => (
                    <article
                      key={fee.currency}
                      className="grid grid-cols-2 gap-3 px-5 py-4 sm:px-6"
                    >
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Collected · {fee.currency}
                        </p>
                        <p className="mt-1 font-bold text-emerald-700">
                          {formatMoney(fee.collected, fee.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Outstanding
                        </p>
                        <p className="mt-1 font-bold text-amber-700">
                          {formatMoney(fee.outstanding, fee.currency)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="px-5 py-8 text-sm text-slate-500 sm:px-6">
                  No fee records have been added yet.
                </p>
              )}
              <Link
                to="/fees"
                className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm font-semibold text-indigo-700 hover:bg-slate-50 sm:px-6"
              >
                Open fee management
                <FaArrowRight className="text-xs" />
              </Link>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <section className={`${cardClass} overflow-hidden`}>
              <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                <div>
                  <h2 className="font-bold text-slate-900">Quick actions</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Common school administration tasks
                  </p>
                </div>
                <FaBookOpen className="text-indigo-500" />
              </header>
              <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
                {shortcuts.map((shortcut) => (
                  <Link
                    key={shortcut.label}
                    to={shortcut.to}
                    className="group flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40"
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${shortcut.color}`}
                    >
                      {shortcut.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-800">
                        {shortcut.label}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {shortcut.description}
                      </span>
                    </span>
                    <FaArrowRight className="text-xs text-slate-300 transition group-hover:text-indigo-600" />
                  </Link>
                ))}
              </div>
            </section>

            <section className={`${cardClass} overflow-hidden`}>
              <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                <div>
                  <h2 className="font-bold text-slate-900">Recent updates</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Latest school announcements
                  </p>
                </div>
                <Link
                  to="/notification-history"
                  className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  View all
                </Link>
              </header>
              {loading ? (
                <div className="space-y-3 p-5">
                  <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
                  <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
                </div>
              ) : data?.notifications?.length ? (
                <div className="divide-y divide-slate-100">
                  {data.notifications.map((notification) => (
                    <article key={notification._id} className="px-5 py-4 sm:px-6">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <FaBell className="text-sm" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800">
                            {notification.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                            {notification.message}
                          </p>
                          <p className="mt-2 text-xs text-slate-400">
                            {notification.sender} ·{" "}
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="px-5 py-8 text-sm text-slate-500 sm:px-6">
                  No school announcements have been sent yet.
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  );
}
