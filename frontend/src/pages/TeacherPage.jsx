import { useEffect, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";
import { FaTrash, FaPlus, FaEdit } from "react-icons/fa";
import toast from "react-hot-toast";
import TeacherModal from "../components/TeacherModal";

export default function TeacherPage() {
  const [teachers, setTeachers] = useState([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // 🔄 Fetch Teachers
  const fetchTeachers = async () => {
    try {
      const res = await API.get(
        `/teachers?page=${page}&limit=6&search=${search}&sortField=${sortField}&sortOrder=${sortOrder}`,
      );

      setTeachers(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotalRecords(res.data.total);
    } catch {
      toast.error("Failed to fetch teachers");
    }
  };

  useEffect(() => {
    fetchTeachers();
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
        await API.put(`/teachers/${editData._id}`, form);
        toast.success("Updated");
      } else {
        await API.post("/teachers", form);
        toast.success("Teacher added");
      }

      setModalOpen(false);
      setEditData(null);
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    }
  };

  // ✏️ Edit
  const handleEdit = (item) => {
    setEditData(item);
    setModalOpen(true);
  };

  // ❌ Delete
  const handleDelete = async (id) => {
    if (!confirm("Delete teacher?")) return;

    await API.delete(`/teachers/${id}`);
    toast.success("Deleted");
    fetchTeachers();
  };

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Teachers</h1>
          <p className="text-gray-500 text-sm">Dashboard › Teachers</p>
        </div>

        <button
          onClick={() => {
            setEditData(null);
            setModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-5 py-2 rounded flex items-center gap-2"
        >
          <FaPlus /> Add Teacher
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <input
          placeholder="Search teacher..."
          className="border px-4 py-2 rounded w-80"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
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

              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {teachers.map((t, i) => (
              <tr key={t._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 text-left">
                  {(page - 1) * 6 + i + 1}
                </td>

                <td className="px-6 py-3 text-left font-medium">{t.name}</td>

                <td className="px-6 py-3 text-left">{t.email}</td>

                <td className="px-6 py-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(t)}
                      className="p-2 border rounded text-blue-600 hover:bg-blue-50"
                    >
                      <FaEdit size={14} />
                    </button>

                    <button
                      onClick={() => handleDelete(t._id)}
                      className="p-2 border rounded text-red-600 hover:bg-red-50"
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
            Showing {(page - 1) * 6 + 1} to {(page - 1) * 6 + teachers.length}{" "}
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
                className={`px-3 py-1 rounded ${
                  page === i + 1 ? "bg-indigo-600 text-white" : "border"
                }`}
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
      <TeacherModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        editData={editData}
      />
    </DashboardLayout>
  );
}
