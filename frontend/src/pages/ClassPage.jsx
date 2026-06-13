import { useEffect, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import toast from "react-hot-toast";
import ClassModal from "../components/ClassModal";

export default function ClassPage() {
  const [classes, setClasses] = useState([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // 🔄 Fetch Data
  const fetchClasses = async () => {
    try {
      const res = await API.get(
        `/classes?page=${page}&limit=6&search=${search}&sortField=${sortField}&sortOrder=${sortOrder}`,
      );

      setClasses(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotalRecords(res.data.total);
    } catch (err) {
      toast.error("Failed to fetch classes");
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [page, search, sortField, sortOrder]);
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };
  // ➕ Add / ✏️ Update
  const handleSubmit = async (form) => {
    try {
      if (editData) {
        await API.put(`/classes/${editData._id}`, form);
        toast.success("Class updated successfully");
      } else {
        await API.post("/classes", form);
        toast.success("Class added successfully");
      }

      setModalOpen(false);
      setEditData(null);
      fetchClasses();
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Something went wrong";

      toast.error(message);
    }
  };

  // ✏️ Edit
  const handleEdit = (item) => {
    setEditData(item);
    setModalOpen(true);
  };

  // ❌ Delete
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this class?")) return;

    try {
      await API.delete(`/classes/${id}`);
      toast.success("Class deleted");
      fetchClasses();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <>
      {/* 🔝 HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Classes</h1>
          <p className="text-gray-500 text-sm">
            Dashboard <span className="mx-1">›</span> Classes
          </p>
        </div>

        <button
          onClick={() => {
            setEditData(null);
            setModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 shadow"
        >
          <FaPlus /> Add Class
        </button>
      </div>

      {/* 🔍 SEARCH + FILTER */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex justify-between items-center">
        <div className="flex gap-4">
          <input
            placeholder="Search class or section..."
            className="border px-4 py-2 rounded w-80"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />

          <select className="border px-3 py-2 rounded">
            <option>All Classes</option>
          </select>
        </div>
      </div>

      {/* 📊 TABLE */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th
                onClick={() => handleSort("_id")}
                className="px-6 py-3 text-left"
              >
                #
              </th>
              <th
                onClick={() => handleSort("className")}
                className="px-6 py-3 text-left cursor-pointer"
              >
                Class{" "}
                {sortField === "className" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                onClick={() => handleSort("section")}
                className="px-6 py-3 text-left cursor-pointer"
              >
                Section{" "}
                {sortField === "section" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                onClick={() => handleSort("createdAt")}
                className="px-6 py-3 text-left cursor-pointer"
              >
                Created At{" "}
                {sortField === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {classes.map((c, index) => (
              <tr key={c._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3">{(page - 1) * 6 + index + 1}</td>

                <td className="px-6 py-3">
                  <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-md text-xs font-semibold">
                    {c.className}
                  </span>
                </td>

                <td className="px-6 py-3">
                  <span className="bg-green-100 text-green-600 px-3 py-1 rounded-md text-xs font-semibold">
                    {c.section}
                  </span>
                </td>

                <td className="px-6 py-3 text-gray-500">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>

                <td className="px-6 py-3 text-center">
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => handleEdit(c)}
                      className="p-2 border rounded text-blue-600 hover:bg-blue-50"
                    >
                      <FaEdit />
                    </button>

                    <button
                      onClick={() => handleDelete(c._id)}
                      className="p-2 border rounded text-red-600 hover:bg-red-50"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 🔢 PAGINATION */}
        <div className="flex justify-between items-center p-4">
          <span className="text-gray-500 text-sm">
            Showing {(page - 1) * 6 + 1} to {(page - 1) * 6 + classes.length} of{" "}
            {totalRecords} results
          </span>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border rounded"
            >
              Previous
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

      {/* 🧾 MODAL */}
      <ClassModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        editData={editData}
      />
    </>
  );
}
