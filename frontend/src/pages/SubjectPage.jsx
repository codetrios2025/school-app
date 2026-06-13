import { useEffect, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import toast from "react-hot-toast";
import SubjectModal from "../components/SubjectModal";

export default function SubjectPage() {
  const [subjects, setSubjects] = useState([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchSubjects = async () => {
    try {
      const res = await API.get(
        `/subjects?page=${page}&limit=6&search=${search}&sortField=${sortField}&sortOrder=${sortOrder}`,
      );

      setSubjects(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotalRecords(res.data.total);
    } catch {
      toast.error("Failed to fetch subjects");
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [page, search, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleSubmit = async (form) => {
    try {
      if (editData) {
        await API.put(`/subjects/${editData._id}`, form);
        toast.success("Subject Updated Successfully");
      } else {
        await API.post("/subjects", form);
        toast.success("Subject Added Successfully");
      }

      setModalOpen(false);
      setEditData(null);
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    }
  };

  const handleEdit = (item) => {
    setEditData(item);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this subject?")) return;

    await API.delete(`/subjects/${id}`);
    toast.success("Deleted");
    fetchSubjects();
  };

  return (
    <>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Subjects</h1>
          <p className="text-gray-500 text-sm">Dashboard › Subjects</p>
        </div>

        <button
          onClick={() => {
            setEditData(null);
            setModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-5 py-2 rounded flex items-center gap-2"
        >
          <FaPlus /> Add Subject
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <input
          placeholder="Search subject..."
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
                className="px-6 py-3 text-left cursor-pointer select-none"
              >
                Name {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>

              <th
                onClick={() => handleSort("createdAt")}
                className="px-6 py-3 text-left cursor-pointer select-none"
              >
                Created{" "}
                {sortField === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>

              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {subjects.map((s, index) => (
              <tr key={s._id} className="border-b hover:bg-gray-50 transition">
                <td className="px-6 py-3">{(page - 1) * 6 + index + 1}</td>

                <td className="px-6 py-3 font-medium">{s.name}</td>

                <td className="px-6 py-3 text-gray-500">
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>

                {/* ACTIONS */}
                <td className="px-6 py-3">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(s)}
                      className="p-2 rounded border text-blue-600 hover:bg-blue-50 transition"
                    >
                      <FaEdit size={14} />
                    </button>

                    <button
                      onClick={() => handleDelete(s._id)}
                      className="p-2 rounded border text-red-600 hover:bg-red-50 transition"
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
        <div className="flex justify-between items-center p-4">
          <span className="text-gray-500 text-sm">
            Showing {(page - 1) * 6 + 1} to {(page - 1) * 6 + subjects.length}{" "}
            of {totalRecords}
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Previous
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  page === i + 1
                    ? "bg-indigo-600 text-white"
                    : "border hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <SubjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        editData={editData}
      />
    </>
  );
}
