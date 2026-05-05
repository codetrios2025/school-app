import { useEffect, useState } from "react";
import API from "../services/api";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import DashboardLayout from "../layouts/DashboardLayout";

export default function NotificationHistory() {
  const user = useSelector((state) => state.auth.user);

  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    classId: "",
    type: "",
    startDate: "",
    endDate: "",
    page: 1,
  });

  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await API.get(`/notifications?${query}`);

      setData(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  // 🗑 DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this notification?")) return;

    try {
      await API.delete(`/notifications/${id}`);
      toast.success("Deleted");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">📜 Notification History</h2>

          {/* FILTERS */}
          <div className="grid grid-cols-5 gap-3 mb-4">
            <input
              placeholder="Search..."
              className="border p-2 rounded"
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />

            <select
              className="border p-2 rounded"
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="all">All</option>
              <option value="teachers">Teachers</option>
              <option value="students">Students</option>
              <option value="class">Class</option>
            </select>

            <input
              type="date"
              className="border p-2 rounded"
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
            />

            <input
              type="date"
              className="border p-2 rounded"
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
            />
          </div>

          {/* TABLE */}
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Message</th>
                <th className="p-3 text-left">Sender</th>
                <th className="p-3 text-left">Class</th>
                <th className="p-3 text-left">Date</th>
                {user.role === "admin" && (
                  <th className="p-3 text-left">Action</th>
                )}
              </tr>
            </thead>

            <tbody>
              {data.map((n, i) => (
                <tr key={n._id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{i + 1}</td>
                  <td className="p-3 font-medium">{n.title}</td>
                  <td className="p-3 text-gray-600">{n.message}</td>
                  <td className="p-3">{n.sender?.name}</td>
                  <td className="p-3">
                    {n.classId
                      ? `${n.classId.className}-${n.classId.section}`
                      : "All"}
                  </td>
                  <td className="p-3">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </td>

                  {user.role === "admin" && (
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(n._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        🗑️
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              Showing page {filters.page} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                disabled={filters.page === 1}
                onClick={() =>
                  setFilters({ ...filters, page: filters.page - 1 })
                }
                className="px-3 py-1 border rounded"
              >
                Prev
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFilters({ ...filters, page: i + 1 })}
                  className={`px-3 py-1 rounded ${
                    filters.page === i + 1
                      ? "bg-indigo-600 text-white"
                      : "border"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={filters.page === totalPages}
                onClick={() =>
                  setFilters({ ...filters, page: filters.page + 1 })
                }
                className="px-3 py-1 border rounded"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
