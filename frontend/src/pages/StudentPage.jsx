import { useEffect, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import toast from "react-hot-toast";
import StudentModal from "../components/StudentModal";

export default function StudentPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // 🔄 Fetch Students
  const fetchStudents = async () => {
    const res = await API.get(
      `/students?page=${page}&limit=6&search=${search}&sortField=${sortField}&sortOrder=${sortOrder}`,
    );

    setStudents(res.data.data);
    setTotalPages(res.data.totalPages);
    setTotalRecords(res.data.total);
  };

  // 🔄 Fetch Classes (for dropdown)
  const fetchClasses = async () => {
    const res = await API.get("/classes");
    setClasses(res.data.data);
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [page, search, sortField, sortOrder]);

  // 🔀 Sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // ➕ Add / Update
  const handleSubmit = async (form) => {
    try {
      if (editData) {
        await API.put(`/students/${editData._id}`, form);
        toast.success("Student Updated Successfully");
      } else {
        await API.post("/students", form);
        toast.success("Student Added Successfully");
      }

      setModalOpen(false);
      setEditData(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    }
  };

  // ✏️ Edit
  const handleEdit = (item) => {
    setEditData({
      ...item,
      classId: item.classId?._id,
    });
    setModalOpen(true);
  };

  // ❌ Delete
  const handleDelete = async (id) => {
    if (!confirm("Delete student?")) return;

    await API.delete(`/students/${id}`);
    toast.success("Deleted");
    fetchStudents();
  };

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-gray-500 text-sm">Dashboard › Students</p>
        </div>

        <button
          onClick={() => {
            setEditData(null);
            setModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-5 py-2 rounded flex items-center gap-2"
        >
          <FaPlus /> Add Student
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <input
          placeholder="Search student..."
          className="border px-4 py-2 rounded w-80"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-sm">
          {/* HEADER */}
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-6 py-3 text-left">#</th>

              <th
                onClick={() => handleSort("name")}
                className="px-6 py-3 text-left cursor-pointer"
              >
                Name {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>

              <th
                onClick={() => handleSort("email")}
                className="px-6 py-3 text-left cursor-pointer"
              >
                Email{" "}
                {sortField === "email" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>

              <th className="px-6 py-3 text-left">Roll</th>

              <th className="px-6 py-3 text-left">Class</th>

              <th className="px-6 py-3 text-left">Parent Name</th>
              <th className="px-6 py-3 text-left">Parent Email</th>

              <th className="px-6 py-3 text-left">Contact</th>

              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {students.map((s, i) => (
              <tr key={s._id} className="border-b hover:bg-gray-50 transition">
                <td className="px-6 py-3 text-left">
                  {(page - 1) * 6 + i + 1}
                </td>

                <td className="px-6 py-3 text-left font-medium">
                  {s.userId?.name}
                </td>

                <td className="px-6 py-3 text-left">{s.userId?.email}</td>

                <td className="px-6 py-3 text-left">{s.rollNumber}</td>

                <td className="px-6 py-3 text-left">
                  {s.classId
                    ? `${s.classId.className} - ${s.classId.section}`
                    : "-"}
                </td>

                <td className="px-6 py-3 text-left">{s.parentName || "-"}</td>

                <td className="px-6 py-3 text-left">{s.parentEmail || "-"}</td>

                <td className="px-6 py-3 text-left">
                  {s.contactNumber || "-"}
                </td>

                {/* ACTIONS FIX */}
                <td className="px-6 py-3 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <button
                      onClick={() => handleEdit(s)}
                      className="p-2 border rounded-md text-blue-600 hover:bg-blue-50 transition"
                    >
                      <FaEdit size={14} />
                    </button>

                    <button
                      onClick={() => handleDelete(s._id)}
                      className="p-2 border rounded-md text-red-600 hover:bg-red-50 transition"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="flex justify-between items-center px-6 py-4 border-t">
          <span className="text-sm text-gray-500">
            Showing {(page - 1) * 6 + 1} to {(page - 1) * 6 + students.length}{" "}
            of {totalRecords}
          </span>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border rounded"
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 ${
                  page === i + 1 ? "bg-indigo-600 text-white" : "border"
                } rounded`}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border rounded"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <StudentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        editData={editData}
        classes={classes}
      />
    </DashboardLayout>
  );
}
