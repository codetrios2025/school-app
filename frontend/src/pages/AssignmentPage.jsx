import { useEffect, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";
import { FaTrash, FaPlus } from "react-icons/fa";
import toast from "react-hot-toast";
import AssignmentModal from "../components/AssignmentModal";

export default function AssignmentPage() {
  const [assignments, setAssignments] = useState([]);

  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);

  // 🔄 Fetch Assignments
  const fetchAssignments = async () => {
    try {
      const res = await API.get("/assignments");
      setAssignments(res.data.data);
    } catch {
      toast.error("Failed to load assignments");
    }
  };

  // 🔄 Fetch Teachers
  const fetchTeachers = async () => {
    try {
      const res = await API.get("/teachers"); // ✅ FIXED
      setTeachers(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔄 Fetch Classes
  const fetchClasses = async () => {
    const res = await API.get("/classes");
    setClasses(res.data.data || []);
  };

  // 🔄 Fetch Subjects
  const fetchSubjects = async () => {
    const res = await API.get("/subjects");
    setSubjects(res.data.data || []);
  };

  useEffect(() => {
    fetchAssignments();
    fetchTeachers();
    fetchClasses();
    fetchSubjects();
  }, []);

  // ➕ Add Assignment
  const handleSubmit = async (form) => {
    try {
      await API.post("/assignments", form);
      toast.success("Assignment added");

      setModalOpen(false);
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    }
  };

  // ❌ Delete
  const handleDelete = async (id) => {
    if (!confirm("Delete assignment?")) return;

    try {
      await API.delete(`/assignments/${id}`);
      toast.success("Deleted");
      fetchAssignments();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Teacher Assignments</h1>
          <p className="text-gray-500 text-sm">Dashboard › Assignments</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 text-white px-5 py-2 rounded flex items-center gap-2"
        >
          <FaPlus /> Assign Teacher
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-6 py-3 text-left">#</th>
              <th className="px-6 py-3 text-left">Title</th>
              <th className="px-6 py-3 text-left">Teacher</th>
              <th className="px-6 py-3 text-left">Class</th>
              <th className="px-6 py-3 text-left">Subject</th>
              <th className="px-6 py-3 text-left">Description</th>
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {assignments.length > 0 ? (
              assignments.map((a, i) => (
                <tr key={a._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">{i + 1}</td>
                  <td className="px-6 py-3">{a.title}</td>
                  <td className="px-6 py-3 font-medium">
                    {a.teacherId?.name || "-"}
                  </td>

                  <td className="px-6 py-3">
                    {a.classId
                      ? `${a.classId.className} - ${a.classId.section}`
                      : "-"}
                  </td>

                  <td className="px-6 py-3">{a.subjectId?.name || "-"}</td>

                  <td className="px-6 py-3 max-w-[200px] truncate">
                    {" "}
                    {a.description || "-"}
                  </td>
                  <td className="px-6 py-3">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleDelete(a._id)}
                        className="p-2 border rounded text-red-600 hover:bg-red-50"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-500">
                  No assignments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      <AssignmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        teachers={teachers}
        classes={classes}
        subjects={subjects}
      />
    </DashboardLayout>
  );
}
