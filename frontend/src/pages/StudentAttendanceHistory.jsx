import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import API from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";

export default function StudentAttendanceHistory() {
  const user = useSelector((state) => state.auth.user);

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ LOAD STUDENTS / SELF
  useEffect(() => {
    if (!user) return;

    if (user.role === "student") {
      setSelectedStudent(user._id);

      // 🔥 FIX classId object issue
      setSelectedClass(
        typeof user.classId === "object" ? user.classId._id : user.classId,
      );
    } else {
      fetchStudents();
    }
  }, [user]);

  const fetchStudents = async () => {
    try {
      const res = await API.get("/students");
      setStudents(res.data.data || []);
    } catch (err) {
      console.log(err.message);
      setError("Failed to load students");
    }
  };

  // ✅ FETCH DATA
  useEffect(() => {
    if (!selectedStudent || !selectedClass) return;

    fetchAllData();
  }, [selectedStudent, selectedClass]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError("");

      const [historyRes, summaryRes] = await Promise.all([
        API.get(
          `/attendance/student-history?studentId=${selectedStudent}&classId=${selectedClass}`,
        ),
        API.get(
          `/attendance/student-summary?studentId=${selectedStudent}&classId=${selectedClass}`,
        ),
      ]);

      setHistory(historyRes.data.data || []);
      setSummary(summaryRes.data || null);
    } catch (err) {
      console.log(err.message);
      setError("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            📊 Attendance History
          </h2>

          {/* ✅ SHOW DROPDOWN ONLY FOR ADMIN / TEACHER */}
          {(user?.role === "admin" || user?.role === "teacher") && (
            <select
              className="border px-4 py-2 rounded-lg shadow-sm focus:outline-indigo-500"
              value={selectedStudent}
              onChange={(e) => {
                const student = students.find((s) => s._id === e.target.value);

                if (!student) return;

                setSelectedStudent(student._id);

                // 🔥 FIX OBJECT ISSUE
                setSelectedClass(
                  typeof student.classId === "object"
                    ? student.classId._id
                    : student.classId,
                );
              }}
            >
              <option value="">Select Student</option>

              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name || s.userId?.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ❌ ERROR */}
        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* ⏳ LOADING */}
        {loading && (
          <div className="text-center py-10 text-gray-500">
            Loading attendance...
          </div>
        )}

        {/* 📊 SUMMARY */}
        {!loading && summary && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-gray-500 text-sm">Total Days</p>
              <p className="text-xl font-bold">{summary.total}</p>
            </div>

            <div className="bg-green-100 p-4 rounded-lg shadow text-center">
              <p className="text-gray-500 text-sm">Present</p>
              <p className="text-xl font-bold text-green-600">
                {summary.present}
              </p>
            </div>

            <div className="bg-indigo-100 p-4 rounded-lg shadow text-center">
              <p className="text-gray-500 text-sm">Attendance %</p>
              <p className="text-xl font-bold text-indigo-600">
                {summary.percentage}%
              </p>
            </div>
          </div>
        )}

        {/* 📋 TABLE */}
        {!loading && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Subject</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-6 text-gray-500">
                      No attendance data found
                    </td>
                  </tr>
                ) : (
                  history.map((h, i) => (
                    <tr
                      key={i}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="p-3">
                        {new Date(h.date).toLocaleDateString()}
                      </td>

                      <td className="p-3">{h.subject}</td>

                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            h.status === "present"
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
