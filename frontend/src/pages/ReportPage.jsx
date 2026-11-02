import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCalendarCheck,
  FaDownload,
  FaFilter,
  FaUsers,
} from "react-icons/fa";
import toast from "react-hot-toast";
import API from "../services/api";
import { exportToExcel } from "../utils/exportExcel";

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const monthStart = () => `${today().slice(0, 7)}-01`;
const displayDate = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const cardClass =
  "rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03]";
const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50";

export default function ReportPage() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [status, setStatus] = useState("");
  const [report, setReport] = useState(null);
  const [classesLoading, setClassesLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedClass = classes.find((item) => item._id === classId);
  const subjects = selectedClass?.subjects || [];
  const detailRows = useMemo(
    () =>
      (report?.data || []).flatMap((attendance) =>
        attendance.records.map((record) => ({
          attendanceId: attendance._id,
          date: attendance.date,
          subject: attendance.subjectId?.name || "Subject",
          studentId: record.studentId?._id || record.studentId,
          student: record.studentName || "Student",
          rollNumber: record.studentId?.rollNumber || "",
          status: record.status,
        })),
      ),
    [report],
  );

  useEffect(() => {
    let active = true;
    API.get("/attendance/classes")
      .then((response) => {
        if (active) setClasses(response.data.data || []);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load report classes.",
          );
        }
      })
      .finally(() => {
        if (active) setClassesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const runReport = async (event) => {
    event.preventDefault();
    if (!classId) {
      toast.error("Select a class to generate the report");
      return;
    }
    if (!fromDate || !toDate || fromDate > toDate) {
      toast.error("Select a valid start and end date");
      return;
    }

    setReportLoading(true);
    setError("");
    try {
      const response = await API.get("/attendance/report", {
        params: {
          classId,
          fromDate,
          toDate,
          ...(subjectId ? { subjectId } : {}),
          ...(status ? { status } : {}),
        },
      });
      setReport(response.data);
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        "Unable to generate the attendance report.";
      setError(message);
      toast.error(message);
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  };

  const resetFilters = () => {
    setClassId("");
    setSubjectId("");
    setFromDate(monthStart());
    setToDate(today());
    setStatus("");
    setReport(null);
    setError("");
  };

  const exportReport = () => {
    if (!detailRows.length) {
      toast.error("There is no attendance data to export");
      return;
    }
    const classLabel = selectedClass
      ? `${selectedClass.className}_${selectedClass.section}`
      : "Class";
    exportToExcel(
      detailRows.map((row) => ({
        Date: row.date,
        Class: classLabel,
        Subject: row.subject,
        Student: row.student,
        "Roll number": row.rollNumber,
        Status: row.status,
      })),
      `Attendance_Report_${classLabel}_${fromDate}_${toDate}`,
    );
  };

  const summary = report?.summary;

  return (
    <section className="min-h-full space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
            School analytics
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Attendance reports
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Filter attendance by class, date range, subject, and student status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/attendance"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Take attendance
            <FaArrowRight className="text-xs" />
          </Link>
          <button
            type="button"
            onClick={exportReport}
            disabled={reportLoading || !detailRows.length}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaDownload />
            Export Excel
          </button>
        </div>
      </header>

      <form
        onSubmit={runReport}
        className={`${cardClass} grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6`}
      >
        <label className="text-sm font-semibold text-slate-700">
          Class and section
          <select
            value={classId}
            onChange={(event) => {
              setClassId(event.target.value);
              setSubjectId("");
            }}
            disabled={classesLoading}
            className={inputClass}
          >
            <option value="">
              {classesLoading ? "Loading classes..." : "Select a class"}
            </option>
            {classes.map((schoolClass) => (
              <option key={schoolClass._id} value={schoolClass._id}>
                {schoolClass.className} - {schoolClass.section}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          From
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) => setFromDate(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          To
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            max={today()}
            onChange={(event) => setToDate(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Subject
          <select
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            disabled={!classId}
            className={inputClass}
          >
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Attendance status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={inputClass}
          >
            <option value="">All statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={classesLoading || reportLoading || !classId}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaFilter />
            {reportLoading ? "Generating..." : "Generate report"}
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Attendance sessions", summary.sessions],
              ["Attendance entries", summary.total],
              ["Present", summary.present],
              ["Absent", summary.absent],
              ["Attendance rate", `${summary.percentage}%`],
            ].map(([label, value], index) => (
              <article
                key={label}
                className={`${cardClass} flex items-center gap-4 p-5`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    index === 3
                      ? "bg-rose-50 text-rose-600"
                      : index === 4
                        ? "bg-violet-50 text-violet-600"
                        : "bg-indigo-50 text-indigo-600"
                  }`}
                >
                  {index === 0 ? <FaCalendarCheck /> : <FaUsers />}
                </span>
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {value}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <section className={`${cardClass} overflow-hidden`}>
            <header className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <h3 className="font-bold text-slate-900">Student summary</h3>
              <p className="mt-1 text-sm text-slate-500">
                Attendance totals for each student in{" "}
                {selectedClass
                  ? `${selectedClass.className} - ${selectedClass.section}`
                  : "the selected class"}
                . Status filters only affect the detailed records below.
                Students without recorded sessions remain visible.
              </p>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Student</th>
                    <th className="px-5 py-3 font-semibold">Roll number</th>
                    <th className="px-5 py-3 font-semibold">Sessions</th>
                    <th className="px-5 py-3 font-semibold">Present</th>
                    <th className="px-5 py-3 font-semibold">Absent</th>
                    <th className="px-5 py-3 font-semibold">Attendance rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.students?.length ? (
                    report.students.map((student) => (
                      <tr key={student.studentId}>
                        <td className="px-5 py-3 font-medium text-slate-800">
                          {student.studentName}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {student.rollNumber || "—"}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {student.total}
                        </td>
                        <td className="px-5 py-3 text-emerald-700">
                          {student.present}
                        </td>
                        <td className="px-5 py-3 text-rose-700">
                          {student.absent}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-800">
                          {student.percentage}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        No students are currently listed in this class.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${cardClass} overflow-hidden`}>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h3 className="font-bold text-slate-900">
                  Attendance details
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {detailRows.length.toLocaleString()} matching attendance
                  {detailRows.length === 1 ? " entry" : " entries"} from{" "}
                  {fromDate ? displayDate(fromDate) : "—"} to{" "}
                  {toDate ? displayDate(toDate) : "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={exportReport}
                disabled={!detailRows.length}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaDownload />
                Export details
              </button>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Student</th>
                    <th className="px-5 py-3 font-semibold">Roll number</th>
                    <th className="px-5 py-3 font-semibold">Subject</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        Generating attendance report...
                      </td>
                    </tr>
                  ) : detailRows.length ? (
                    detailRows.map((row) => (
                      <tr
                        key={`${row.attendanceId}-${row.studentId}-${row.status}`}
                      >
                        <td className="px-5 py-3 text-slate-600">
                          {displayDate(row.date)}
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-800">
                          {row.student}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {row.rollNumber || "—"}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {row.subject}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                              row.status === "present"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
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
                        colSpan={5}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        No attendance records match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  );
}
