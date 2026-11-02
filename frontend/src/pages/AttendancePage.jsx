import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaCheck,
  FaClipboardCheck,
  FaSearch,
  FaUsers,
} from "react-icons/fa";
import API from "../services/api";
import toast from "react-hot-toast";

const today = () => {
  const date = new Date();
  const localOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - localOffset).toISOString().slice(0, 10);
};

export default function AttendancePage() {
  const user = useSelector((state) => state.auth.user);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [students, setStudents] = useState([]);

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(today);

  const [records, setRecords] = useState([]);
  const [savedRecords, setSavedRecords] = useState([]);
  const [search, setSearch] = useState("");

  // ✅ NEW: selected students
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // 🔄 Load assignments
  // 🔄 Load students
  const fetchStudents = async (cid, sid, attendanceDate, isCurrent) => {
    if (!cid || !sid) {
      setStudents([]);
      setRecords([]);
      setSavedRecords([]);
      setSelected([]);
      return;
    }

    setStudents([]);
    setRecords([]);
    setSavedRecords([]);
    setSelected([]);
    setStudentsLoading(true);
    try {
      // 🔹 Get students
      const res = await API.get(`/attendance/students/${cid}`);
      if (!isCurrent()) return;
      const studentList = res.data.data;

      setStudents(studentList);

      // 🔹 Get saved attendance
      const attendanceRes = await API.get("/attendance/by-date", {
        params: { classId: cid, subjectId: sid, date: attendanceDate },
      });
      if (!isCurrent()) return;

      const saved = attendanceRes.data.data;

      let initial;

      if (saved) {
        // ✅ LOAD FROM DB
        initial = studentList.map((s) => {
          const found = saved.records.find(
            (r) => r.studentId.toString() === s._id.toString(),
          );

          return {
            studentId: s._id,
            status: found ? found.status : "present",
          };
        });
      } else {
        // ✅ DEFAULT
        initial = studentList.map((s) => ({
          studentId: s._id,
          status: "present",
        }));
      }

      setRecords(initial);
      setSavedRecords(saved ? initial : []);
      setSelected([]);
    } catch (error) {
      if (!isCurrent()) return;
      toast.error(
        error.response?.data?.message ||
          "Failed to load students and saved attendance",
      );
    } finally {
      if (isCurrent()) setStudentsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!["admin", "teacher"].includes(user?.role)) return undefined;
    API.get("/attendance/classes")
      .then((response) => {
        if (!active) return;
        setAvailableClasses(response.data.data || []);
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message ||
              "Failed to load your assigned classes",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [user?.role]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      if (classId && subjectId && date) {
        fetchStudents(classId, subjectId, date, () => active);
      } else {
        setStudents([]);
        setRecords([]);
        setSavedRecords([]);
        setSelected([]);
        setStudentsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [classId, subjectId, date]);

  // 🔁 Update single status
  const updateStatus = (index, value) => {
    const updated = [...records];
    updated[index].status = value;
    setRecords(updated);
  };

  // ✅ SELECT TOGGLE
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // ✅ SELECT ALL
  const toggleSelectAll = () => {
    if (selected.length === students.length) {
      setSelected([]);
    } else {
      setSelected(students.map((s) => s._id));
    }
  };

  // ✅ BULK UPDATE
  const markSelected = async (status) => {
    const updated = records.map((r) =>
      selected.includes(r.studentId) ? { ...r, status } : r,
    );
    setRecords(updated);
    toast.success(
      `${selected.length} student${selected.length === 1 ? "" : "s"} marked ${status}. Save to apply.`,
    );
  };

  // 💾 Submit
  const handleSubmit = async () => {
    if (loading) return;

    setLoading(true);
    if (!classId || !subjectId) {
      setLoading(false);
      return toast.error("Select class and subject");
    }

    try {
      const response = await API.post("/attendance", {
        classId,
        subjectId,
        date,
        records,
      });
      setSavedRecords(records);
      setSelected([]);
      toast.success(
        response.data.notifications?.failed
          ? "Attendance saved, but some parent notifications could not be sent"
          : "Attendance saved successfully",
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to save attendance");
    } finally {
      setLoading(false);
    }
  };

  const selectedClass = availableClasses.find(
    (schoolClass) => schoolClass._id === classId,
  );
  const subjectOptions = selectedClass?.subjects || [];
  const presentCount = records.filter((record) => record.status === "present").length;
  const absentCount = records.filter((record) => record.status === "absent").length;
  const filteredStudents = students
    .map((student, index) => ({ student, index }))
    .filter(({ student }) => {
      const query = search.trim().toLowerCase();
      return (
        !query ||
        student.userId?.name?.toLowerCase().includes(query) ||
        student.rollNumber?.toLowerCase().includes(query) ||
        student.admissionNo?.toLowerCase().includes(query)
      );
    });
  const attendanceChanged =
    JSON.stringify(records) !== JSON.stringify(savedRecords);
  const selectedSubject = subjectOptions.find(
    (subject) => subject._id === subjectId,
  )?.name;

  return (
    <section className="w-full max-w-none space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">TEACHER WORKSPACE</p>
          <h1 data-page-title className="mt-1 text-2xl font-bold text-slate-900">
            Take attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Choose a class and subject, mark each student, then save the register.
          </p>
        </div>
        <Link
          to="/attendance-history"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          View attendance reports
        </Link>
      </header>

      <div className="rounded-2xl bg-gradient-to-r from-indigo-700 to-blue-600 p-5 text-white shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-xl">
            <FaCalendarAlt />
          </span>
          <div>
            <h2 className="font-semibold">Attendance register</h2>
            <p className="text-sm text-indigo-100">
              {date
                ? new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Select a date"}
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_190px]">
          <label className="text-xs font-semibold text-indigo-100">
            CLASS
        <select
              className="mt-1 w-full rounded-lg border border-white/20 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-white/60"
          value={classId}
          onChange={(e) => {
            const value = e.target.value;
            setClassId(value);
              const nextClass = availableClasses.find(
                (schoolClass) => schoolClass._id === value,
              );
              setSubjectId(nextClass?.subjects?.[0]?._id || "");
          }}
        >
              <option value="">Select class</option>
          {availableClasses.map((schoolClass) => (
            <option key={schoolClass._id} value={schoolClass._id}>
                  {schoolClass.className} · Section {schoolClass.section}
            </option>
          ))}
        </select>
          </label>
          <label className="text-xs font-semibold text-indigo-100">
            SUBJECT
        <select
              className="mt-1 w-full rounded-lg border border-white/20 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-white/60"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
              disabled={!classId}
        >
              <option value="">Select subject</option>
          {subjectOptions.map((subject) => (
            <option key={subject._id} value={subject._id}>
              {subject.name}
            </option>
          ))}
        </select>
          </label>
          <label className="text-xs font-semibold text-indigo-100">
            ATTENDANCE DATE
        <input
          type="date"
              className="mt-1 w-full rounded-lg border border-white/20 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-white/60"
          value={date}
          max={today()}
          onChange={(e) => setDate(e.target.value)}
        />
          </label>
        </div>
      </div>

      {students.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Students in class",
                value: students.length,
                icon: <FaUsers />,
                color: "bg-blue-50 text-blue-600",
              },
              {
                label: "Marked present",
                value: presentCount,
                icon: <FaCheck />,
                color: "bg-emerald-50 text-emerald-600",
              },
              {
                label: "Marked absent",
                value: absentCount,
                icon: <FaClipboardCheck />,
                color: "bg-rose-50 text-rose-600",
              },
            ].map((item) => (
              <article
                key={item.label}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.color}`}>
                  {item.icon}
                </span>
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="text-xl font-bold text-slate-900">{item.value}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
        <button
          disabled={loading || studentsLoading || !selected.length}
          onClick={() => markSelected("present")}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
        >
                  Mark selected present
        </button>
        <button
          disabled={loading || studentsLoading || !selected.length}
          onClick={() => markSelected("absent")}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
        >
                  Mark selected absent
        </button>
            </div>
            <label className="relative w-full sm:max-w-xs">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or roll number"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
      </div>

          <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <div>
                <h2 className="font-semibold text-slate-900">
                  {selectedSubject || "Class roster"}
                </h2>
                <p className="text-xs text-slate-500">
                  {studentsLoading
                    ? "Loading student roster..."
                    : `${students.length} students · ${absentCount} absent`}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <input
                  type="checkbox"
                  disabled={loading || studentsLoading}
                  checked={
                    selected.length === students.length && students.length > 0
                  }
                  onChange={toggleSelectAll}
                />
                Select all students
              </label>
            </div>
            {studentsLoading ? (
              <p className="px-4 py-12 text-center text-sm text-slate-500">
                Loading student roster...
              </p>
            ) : filteredStudents.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Select</th>
                      <th className="px-4 py-3">Roll no.</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3 text-right">Attendance status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map(({ student, index }) => (
                      <tr key={student._id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            disabled={loading || studentsLoading}
                            checked={selected.includes(student._id)}
                            onChange={() => toggleSelect(student._id)}
                            aria-label={`Select ${student.userId?.name || "student"}`}
                            className="h-4 w-4 accent-indigo-600"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-600">
                          {student.rollNumber || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800">
                            {student.userId?.name || "Student"}
                          </span>
                          {student.admissionNo && (
                            <span className="ml-2 text-xs text-slate-400">
                              ID {student.admissionNo}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <select
                            value={records[index]?.status || "present"}
                            disabled={loading || studentsLoading}
                            onChange={(event) =>
                              updateStatus(index, event.target.value)
                            }
                            aria-label={`Attendance status for ${student.userId?.name || "student"}`}
                            className={`rounded-lg border px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-100 ${
                              records[index]?.status === "present"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-rose-200 bg-rose-50 text-rose-700"
                            }`}
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-4 py-12 text-center text-sm text-slate-500">
                {search
                  ? "No students match your search."
                  : "No active students are assigned to this class."}
              </p>
            )}
          </div>

          <div className="sticky bottom-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
            <p className="text-sm text-slate-600">
              {attendanceChanged
                ? "You have unsaved attendance changes."
                : "All changes are saved."}
            </p>
        <button
          disabled={
            loading ||
            loading ||
            studentsLoading ||
            !students.length ||
            !attendanceChanged
          }
          onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
              <FaCheck />
              {loading ? "Saving register..." : "Save attendance"}
        </button>
      </div>
        </>
      )}

      {!classId && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <FaUsers className="mx-auto text-3xl text-slate-300" />
          <h2 className="mt-3 font-semibold text-slate-800">
            Select a class to get started
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Your assigned classes and subjects will appear in the register above.
          </p>
          {availableClasses.length === 0 && (
            <p className="mt-2 text-sm font-medium text-amber-700">
              No classes are assigned to your account yet. Ask your administrator
              to assign a teaching subject or class-teacher role.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
