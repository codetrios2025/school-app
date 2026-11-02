import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBell,
  FaBookOpen,
  FaCalendarCheck,
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaUsers,
} from "react-icons/fa";
import toast from "react-hot-toast";
import API from "../services/api";

const cardClass =
  "rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03]";
const dateLabel = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    API.get("/dashboard/teacher")
      .then((response) => {
        if (active) setData(response.data.data);
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message || "Failed to load your dashboard",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="min-h-full space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="h-44 animate-pulse rounded-2xl bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
      </section>
    );
  }

  if (!data) {
    return (
      <section className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className={`${cardClass} p-6`}>
          <h1 className="text-xl font-bold text-slate-900">
            Dashboard unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Please refresh the page or contact your school administrator.
          </p>
        </div>
      </section>
    );
  }

  const summary = data.summary;
  const classes = data.classes || [];
  const assignments = data.assignments || [];
  const recentAttendance = data.recentAttendance || [];
  const notifications = data.notifications || [];
  const cards = [
    {
      label: "My classes",
      value: summary.classes,
      icon: <FaBookOpen />,
      color: "bg-indigo-100 text-indigo-700",
      accent: "border-l-indigo-500",
    },
    {
      label: "Active students",
      value: summary.students,
      icon: <FaUsers />,
      color: "bg-sky-100 text-sky-700",
      accent: "border-l-sky-500",
    },
    {
      label: "Teaching assignments",
      value: summary.assignments,
      icon: <FaClipboardList />,
      color: "bg-violet-100 text-violet-700",
      accent: "border-l-violet-500",
    },
    {
      label: "Attendance to complete",
      value: summary.attendancePending,
      icon: <FaCalendarCheck />,
      color:
        summary.attendancePending > 0
          ? "bg-amber-100 text-amber-700"
          : "bg-emerald-100 text-emerald-700",
      accent:
        summary.attendancePending > 0
          ? "border-l-amber-500"
          : "border-l-emerald-500",
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
              TEACHER WORKSPACE
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Welcome, {data.teacher?.name || "Teacher"}
            </h1>
            <p className="mt-2 text-sm text-indigo-100 sm:text-base">
              {dateLabel(data.today)} · Here is your teaching overview.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/attendance"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-indigo-800 shadow-sm transition hover:bg-indigo-50"
            >
              <FaCalendarCheck />
              Take attendance
              <FaArrowRight className="text-xs" />
            </Link>
            <Link
              to="/assignments"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <FaBookOpen />
              Assignments
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className={`${cardClass} flex items-center gap-4 border-l-4 ${card.accent} p-5`}
          >
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg ${card.color}`}
            >
              {card.icon}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-500">
                {card.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {card.value}
              </p>
            </div>
          </article>
        ))}
      </div>

      <section className={cardClass}>
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">My classes</h2>
            <p className="mt-1 text-sm text-slate-500">
              Your teaching allocations and class-teacher responsibilities
            </p>
          </div>
          <Link
            to="/attendance"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
          >
            Open attendance
            <FaArrowRight className="text-xs" />
          </Link>
        </header>
        {classes.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <FaBookOpen className="mx-auto text-3xl text-slate-300" />
            <h3 className="mt-3 font-semibold text-slate-800">
              No classes linked to your account yet
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Ask your administrator to assign a class or teaching subject.
            </p>
            <Link
              to="/assignments"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              View my assignments
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
            {classes.map((schoolClass) => (
              <article
                key={schoolClass._id}
                className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                      Class
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      {schoolClass.className}
                      <span className="ml-2 text-sm font-medium text-slate-500">
                        Section {schoolClass.section}
                      </span>
                    </h3>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <FaUsers />
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-xl font-bold text-slate-900">
                      {schoolClass.studentCount}
                    </p>
                    <p className="text-xs text-slate-500">Active students</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {schoolClass.isClassTeacher && (
                      <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                        Class teacher
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        schoolClass.attendanceMarked
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {schoolClass.attendanceMarked ? (
                        <FaCheckCircle />
                      ) : (
                        <FaClock />
                      )}
                      {schoolClass.attendanceMarked ? "Attendance marked" : "Pending today"}
                    </span>
                  </div>
                </div>
                <Link
                  to="/attendance"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                >
                  Take attendance
                  <FaArrowRight className="text-xs" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className={`${cardClass} overflow-hidden`}>
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-bold text-slate-900">Recent attendance</h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest registers you have recorded
              </p>
            </div>
            <Link
              to="/attendance-history"
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            >
              View reports
            </Link>
          </header>
          {recentAttendance.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500 sm:px-6">
              No attendance has been recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentAttendance.map((attendance) => (
                <article
                  key={attendance._id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
                >
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {attendance.className}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {attendance.subject} · {dateLabel(attendance.date)}
                    </p>
                  </div>
                  <div className="flex gap-3 text-xs font-semibold">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1.5 text-emerald-700">
                      {attendance.present} present
                    </span>
                    <span className="rounded-full bg-rose-50 px-2.5 py-1.5 text-rose-700">
                      {attendance.absent} absent
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={`${cardClass} overflow-hidden`}>
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-bold text-slate-900">Teaching assignments</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your assigned subjects and classes
              </p>
            </div>
            <Link
              to="/assignments"
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            >
              View all
            </Link>
          </header>
          {assignments.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500 sm:px-6">
              No subject assignments have been added yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {assignments.slice(0, 5).map((assignment) => (
                <article key={assignment._id} className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-slate-800">
                      {assignment.subject}
                    </h3>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      {assignment.className}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Assigned {new Date(assignment.createdAt).toLocaleDateString()}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className={`${cardClass} overflow-hidden`}>
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-bold text-slate-900">School notifications</h2>
            <p className="mt-1 text-sm text-slate-500">
              Recent updates from your school
            </p>
          </div>
          <Link
            to="/notification"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
          >
            <FaBell />
            Open notifications
          </Link>
        </header>
        {notifications.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500 sm:px-6">
            No recent school notifications.
          </p>
        ) : (
          <div className="grid divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
            {notifications.map((notification) => (
              <article key={notification._id} className="px-5 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-slate-800">
                    {notification.title}
                  </h3>
                  {!notification.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                  {notification.message}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
