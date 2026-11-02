import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBell,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaUserGraduate,
} from "react-icons/fa";
import toast from "react-hot-toast";
import API from "../services/api";

const cardClass = "rounded-xl border border-slate-100 bg-white p-5 shadow-sm";

const money = (amount, currency = "INR") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount || 0);

export default function ParentDashboard() {
  const [data, setData] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    API.get("/parent/dashboard")
      .then((response) => {
        if (!active) return;
        const dashboard = response.data.data;
        setData(dashboard);
        setSelectedId(dashboard.students?.[0]?._id || "");
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message || "Failed to load family dashboard",
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
    return <div className={cardClass}>Loading family dashboard...</div>;
  }

  if (!data?.students?.length) {
    return (
      <section className={`${cardClass} text-center`}>
        <FaUserGraduate className="mx-auto text-3xl text-slate-300" />
        <h1 className="mt-3 text-xl font-bold text-slate-900">
          No student profiles linked
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
          Ask the school administrator to add your email address to your
          student&apos;s parent contact details.
        </p>
      </section>
    );
  }

  const child =
    data.students.find((student) => student._id === selectedId) ||
    data.students[0];
  const outstanding = child.fees.filter((fee) => fee.balance > 0);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {data.students.length > 1
              ? "Family dashboard"
              : `${child.name}'s dashboard`}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Attendance, fee balances, and school updates
          </p>
        </div>
        {data.students.length > 1 && (
          <label className="text-sm font-medium text-slate-600">
            Student
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
            >
              {data.students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} · {student.className} {student.section}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      <article className={`${cardClass} flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-2xl text-indigo-600">
            <FaUserGraduate />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{child.name}</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {child.className
                ? `Class ${child.className} · Section ${child.section}`
                : "Class not assigned"}
              {child.admissionNo ? ` · Admission ${child.admissionNo}` : ""}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            child.status === "inactive"
              ? "bg-slate-100 text-slate-600"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {child.status || "active"}
        </span>
      </article>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600">
            <FaCalendarCheck />
          </span>
          <div>
            <p className="text-sm text-slate-500">Attendance</p>
            <p className="text-xl font-bold text-slate-900">
              {child.attendance.percentage}%
            </p>
            <p className="text-xs text-slate-400">
              {child.attendance.present} of {child.attendance.total} sessions present
            </p>
          </div>
        </article>
        <article className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-lg text-amber-600">
            <FaMoneyBillWave />
          </span>
          <div>
            <p className="text-sm text-slate-500">Outstanding fees</p>
            <p className="text-xl font-bold text-slate-900">
              {money(child.feeBalance)}
            </p>
            <p className="text-xs text-slate-400">
              {child.overdueFees} overdue fee{child.overdueFees === 1 ? "" : "s"}
            </p>
          </div>
        </article>
        <article className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600">
            <FaBell />
          </span>
          <div>
            <p className="text-sm text-slate-500">School updates</p>
            <p className="text-xl font-bold text-slate-900">
              {data.notifications.length}
            </p>
            <p className="text-xs text-slate-400">Recent announcements</p>
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className={`${cardClass} overflow-hidden p-0`}>
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">Recent attendance</h2>
              <p className="mt-0.5 text-sm text-slate-500">{child.name}</p>
            </div>
            <Link
              to="/my-attendance"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Full history
            </Link>
          </header>
          {child.attendance.recent.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">
              Attendance records will appear here when entered by the teacher.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {child.attendance.recent.map((record) => (
                <div key={record._id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="font-medium text-slate-800">{record.subject}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {new Date(`${record.date}T00:00:00`).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      record.status === "present"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={`${cardClass} overflow-hidden p-0`}>
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">Fee details</h2>
              <p className="mt-0.5 text-sm text-slate-500">Charges and recorded payments</p>
            </div>
            <Link to="/fees" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              View fees
            </Link>
          </header>
          {child.fees.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">
              No fee records have been added.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {child.fees.slice(0, 6).map((fee) => (
                <article key={fee._id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div>
                    <p className="font-medium text-slate-800">{fee.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Due {new Date(fee.dueDate).toLocaleDateString()}
                      {fee.academicYear ? ` · ${fee.academicYear}` : ""}
                    </p>
                    {(fee.paymentSubmissions || []).slice(-2).reverse().map((submission) => (
                      <p
                        key={submission._id}
                        className={`mt-1 text-xs font-medium ${
                          submission.status === "approved"
                            ? "text-emerald-700"
                            : submission.status === "rejected"
                              ? "text-rose-700"
                              : "text-amber-700"
                        }`}
                      >
                        Manual payment {submission.status}
                        {submission.reviewNote ? ` · ${submission.reviewNote}` : ""}
                      </p>
                    ))}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800">
                      {money(fee.balance, fee.currency)} due
                    </p>
                    <p className={`text-xs capitalize ${fee.status === "overdue" ? "text-rose-600" : "text-slate-500"}`}>
                      {fee.status}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
          {outstanding.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3">
              <Link to="/fees" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                Open fee management
              </Link>
            </div>
          )}
        </section>
      </div>

      <section className={`${cardClass} overflow-hidden p-0`}>
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">School announcements</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Updates for {child.name} and their class
            </p>
          </div>
          <FaBell className="text-indigo-500" />
        </header>
        {data.notifications.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">
            No recent school updates.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.notifications.map((notification) => (
              <article key={notification._id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-800">{notification.title}</h3>
                  <time className="text-xs text-slate-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {notification.message}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
