import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";
import { exportToExcel } from "../utils/exportExcel";

const currentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const displayDate = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function StudentAttendanceHistory() {
  const user = useSelector((state) => state.auth.user);
  const [period, setPeriod] = useState(currentPeriod);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [mobileEnabled, setMobileEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingSetting, setSavingSetting] = useState(false);
  const [error, setError] = useState("");
  const [classesLoading, setClassesLoading] = useState(true);

  const [year, month] = useMemo(
    () => period.split("-").map(Number),
    [period],
  );
  const isStaff = user?.role === "admin" || user?.role === "teacher";

  useEffect(() => {
    if (!isStaff) return;
    let active = true;
    const loadFilters = async () => {
      try {
        if (user.role === "admin") {
          const classResponse = await API.get("/attendance/classes");
          if (!active) return;
          setClasses(classResponse.data.data || []);
          try {
            const settingResponse = await API.get(
              "/attendance/settings/notifications",
            );
            if (active) {
              setMobileEnabled(
                Boolean(
                  settingResponse.data.data?.mobileNotificationsEnabled,
                ),
              );
            }
          } catch (settingError) {
            if (active) {
              toast.error(
                settingError.response?.data?.message ||
                  "Unable to load mobile alert settings",
              );
            }
          }
        } else {
          const response = await API.get("/attendance/classes");
          if (!active) return;
          setClasses(response.data.data || []);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Failed to load attendance filters",
          );
        }
      } finally {
        if (active) setClassesLoading(false);
      }
    };
    loadFilters();
    return () => {
      active = false;
    };
  }, [isStaff, user?.role]);

  useEffect(() => {
    if (isStaff && !classId) {
      return;
    }

    let active = true;
    const loadAttendance = async () => {
      setLoading(true);
      setError("");
      try {
        if (isStaff) {
          const response = await API.get("/attendance/report", {
            params: { classId, month, year },
          });
          if (!active) return;
          const reportRows = (response.data.data || []).flatMap((attendance) =>
            attendance.records.map((record) => ({
              date: attendance.date,
              subject: attendance.subjectId?.name || "",
              name: record.studentName || "",
              studentId: record.studentId?._id || "",
              rollNumber: record.studentId?.rollNumber || "",
              class: classes.find((schoolClass) => schoolClass._id === classId),
              status: record.status,
            })),
          );
          setRows(reportRows);
          setSummary(response.data.summary);
        } else if (user?.role === "student" || user?.role === "parent") {
          const response = await API.get("/attendance/my", {
            params: { month, year },
          });
          if (!active) return;
          setRows(response.data.data || []);
          setSummary(response.data.summary);
        } else if (active) {
          setRows([]);
          setSummary(null);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Failed to load attendance history",
          );
          setRows([]);
          setSummary(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadAttendance();
    return () => {
      active = false;
    };
  }, [user?.role, isStaff, classId, month, year, classes]);

  const updateMobileNotifications = async (enabled) => {
    setSavingSetting(true);
    try {
      const response = await API.put("/attendance/settings/notifications", {
        mobileNotificationsEnabled: enabled,
      });
      setMobileEnabled(
        Boolean(response.data.data?.mobileNotificationsEnabled),
      );
      toast.success(
        enabled ? "Mobile absence alerts enabled" : "Mobile absence alerts disabled",
      );
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.message ||
          "Unable to update mobile notifications",
      );
    } finally {
      setSavingSetting(false);
    }
  };

  const exportRows = () => {
    if (!rows.length) {
      toast.error("There is no attendance data to export");
      return;
    }
    const formattedRows = rows.map((row) => ({
      Date: row.date,
      Student: row.name || row.studentName || "",
      "Roll number": row.rollNumber || "",
      Class: row.class
        ? `${row.class.className} - ${row.class.section}`
        : "",
      Subject: row.subject || "",
      Status: row.status,
    }));
    exportToExcel(formattedRows, `Attendance_${period}`);
  };

  const pageTitle = isStaff ? "Class attendance report" : "My attendance";
  const visibleRows = isStaff && !classId ? [] : rows;
  const visibleSummary = isStaff && !classId ? null : summary;

  return (
    <section className="min-h-full space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
            Attendance management
          </p>
          <h1 data-page-title className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review attendance history, monthly totals, and absence records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user?.role === "teacher" && (
            <Link
              to="/attendance"
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Take attendance
            </Link>
          )}
          <button
            type="button"
            onClick={exportRows}
            disabled={loading || !visibleRows.length}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export Excel
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {isStaff && (
          <label className="min-w-56 flex-1 text-sm font-medium text-slate-700">
            Class
            <select
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              disabled={classesLoading}
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
            >
              <option value="">
                {classesLoading ? "Loading assigned classes..." : "Select a class"}
              </option>
              {classes.map((schoolClass) => (
                <option key={schoolClass._id} value={schoolClass._id}>
                  {schoolClass.className} - {schoolClass.section}
                  {schoolClass.isClassTeacher ? " · Class teacher" : ""}
                </option>
              ))}
            </select>
            {!classesLoading && !classes.length && !error && (
              <span className="mt-1 block text-xs font-normal text-amber-700">
                No classes are assigned to your account. Contact your administrator.
              </span>
            )}
          </label>
        )}
        <label className="text-sm font-medium text-slate-700">
          Month
          <input
            type="month"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        {user?.role === "admin" && (
          <label className="ml-auto flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={mobileEnabled}
              disabled={savingSetting}
              onChange={(event) =>
                updateMobileNotifications(event.target.checked)
              }
              className="h-4 w-4 accent-indigo-600"
            />
            Enable mobile (WhatsApp) absence alerts
          </label>
        )}
      </div>

      {user?.role === "admin" && (
        <p className="text-xs text-slate-500">
          Email absence alerts are sent when attendance is first marked absent.
          Mobile alerts are off by default and require valid Twilio WhatsApp
          credentials and guardian phone numbers.
        </p>
      )}

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {visibleSummary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Attendance entries", visibleSummary.total],
            ["Present", visibleSummary.present],
            ["Absent", visibleSummary.absent],
            ["Attendance rate", `${visibleSummary.percentage}%`],
          ].map(([label, value]) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
            </article>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Date</th>
              {isStaff && <th className="px-4 py-3 font-semibold">Student</th>}
              {isStaff && <th className="px-4 py-3 font-semibold">Roll no.</th>}
              {!isStaff && user?.role === "parent" && (
                <th className="px-4 py-3 font-semibold">Student</th>
              )}
              {isStaff && <th className="px-4 py-3 font-semibold">Subject</th>}
              {!isStaff && <th className="px-4 py-3 font-semibold">Class</th>}
              {!isStaff && <th className="px-4 py-3 font-semibold">Subject</th>}
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan={isStaff ? 5 : user?.role === "parent" ? 5 : 4}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  Loading attendance...
                </td>
              </tr>
            ) : visibleRows.length ? (
              visibleRows.map((row) => (
                <tr
                  key={`${row.date}-${row.studentId || row.name || row.studentName}-${row.subject}-${row.status}`}
                >
                  <td className="px-4 py-3">{displayDate(row.date)}</td>
                  {isStaff && <td className="px-4 py-3">{row.name}</td>}
                  {isStaff && <td className="px-4 py-3">{row.rollNumber}</td>}
                  {!isStaff && user?.role === "parent" && (
                    <td className="px-4 py-3">{row.studentName}</td>
                  )}
                  {isStaff && <td className="px-4 py-3">{row.subject}</td>}
                  {!isStaff && (
                    <td className="px-4 py-3">
                      {row.class
                        ? `${row.class.className} - ${row.class.section}`
                        : ""}
                    </td>
                  )}
                  {!isStaff && <td className="px-4 py-3">{row.subject}</td>}
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        row.status === "present"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={isStaff ? 5 : user?.role === "parent" ? 5 : 4}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  {isStaff && !classId
                    ? "Select a class to view its attendance report."
                    : "No attendance records for this month."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
