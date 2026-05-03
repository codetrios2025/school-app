import { useEffect, useState } from "react";
import API from "../services/api";

export default function NotificationHistory() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await API.get("/notifications");
    setData(res.data.data);
  };

  const filtered = data.filter((n) =>
    n.title.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Notification History</h2>

      <input
        placeholder="Search..."
        className="border p-2 rounded mb-4 w-full"
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="space-y-3">
        {filtered.map((n) => (
          <div key={n._id} className="bg-white p-4 shadow rounded">
            <p className="font-semibold">{n.title}</p>
            <p className="text-sm">{n.message}</p>
            <p className="text-xs text-gray-400">
              {new Date(n.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
