import { useEffect, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";
import toast from "react-hot-toast";

export default function AttendancePage() {
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const [records, setRecords] = useState([]);

  // ✅ NEW: selected students
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 🔄 Load assignments
  const fetchAssignments = async () => {
    const res = await API.get("/assignments");
    setAssignments(res.data.data);
  };

  // 🔄 Load students
  const fetchStudents = async (cid) => {
    try {
      // 🔹 Get students
      const res = await API.get(`/attendance/students/${cid}`);
      const studentList = res.data.data;

      setStudents(studentList);

      // 🔹 Get saved attendance
      const attendanceRes = await API.get(
        `/attendance/by-date?classId=${cid}&date=${date}`,
      );

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
      setSelected([]);
    } catch (err) {
      console.log(err.message);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

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
    if (saving) return;

    setSaving(true);

    const updated = records.map((r) =>
      selected.includes(r.studentId) ? { ...r, status } : r,
    );

    setRecords(updated);

    try {
      await API.post("/attendance", {
        classId,
        subjectId,
        date,
        records: updated,
      });

      toast.success(`Updated to ${status}`);
    } catch (err) {
      toast.error("Error updating");
    } finally {
      setSaving(false);
    }
  };

  // 💾 Submit
  const handleSubmit = async () => {
    if (loading) return;

    setLoading(true);
    if (!classId || !subjectId) {
      return toast.error("Select class and subject");
    }

    const confirmSave = window.confirm(
      "Do you want to save/update attendance?",
    );
    if (!confirmSave) return;

    try {
      await API.post("/attendance", {
        classId,
        subjectId,
        date,
        records,
      });

      toast.success("Attendance saved");
    } catch (err) {
      toast.error(err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-gray-500 text-sm">Dashboard › Attendance</p>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded shadow mb-6 flex gap-4 flex-wrap">
        <select
          className="border px-4 py-2 rounded"
          onChange={(e) => {
            const value = e.target.value;
            setClassId(value);

            const selected = assignments.find((a) => a.classId._id === value);
            setSubjectId(selected?.subjectId?._id || "");

            fetchStudents(value);
          }}
        >
          <option value="">Select Class</option>
          {assignments.map((a) => (
            <option key={a._id} value={a.classId._id}>
              {a.classId.className} - {a.classId.section}
            </option>
          ))}
        </select>

        <select
          className="border px-4 py-2 rounded"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        >
          <option value="">Select Subject</option>
          {assignments.map((a) => (
            <option key={a._id} value={a.subjectId._id}>
              {a.subjectId.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="border px-4 py-2 rounded"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* BULK ACTIONS */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => markSelected("present")}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Mark Selected Present
        </button>

        <button
          onClick={() => markSelected("absent")}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Mark Selected Absent
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    selected.length === students.length && students.length > 0
                  }
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-6 py-3 text-left">#</th>
              <th className="px-6 py-3 text-left">Student Name</th>
              <th className="px-6 py-3 text-center">Status</th>
            </tr>
          </thead>

          <tbody>
            {students.map((s, i) => (
              <tr key={s._id} className="border-b hover:bg-gray-50">
                {/* CHECKBOX */}
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(s._id)}
                    onChange={() => toggleSelect(s._id)}
                  />
                </td>

                <td className="px-6 py-3">{i + 1}</td>

                <td className="px-6 py-3 font-medium">
                  {s.userId?.name || "N/A"}
                </td>

                <td className="px-6 py-3 text-center">
                  <select
                    value={records[i]?.status}
                    onChange={(e) => updateStatus(i, e.target.value)}
                    className={`px-3 py-1 rounded ${
                      records[i]?.status === "present"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
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

      {/* SAVE */}
      <div className="mt-4">
        <button
          onClick={handleSubmit}
          className="bg-indigo-600 text-white px-6 py-2 rounded"
        >
          Save Attendance
        </button>
      </div>
    </DashboardLayout>
  );
}
