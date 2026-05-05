import { useEffect, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";

export default function ParentDashboard() {
  const [data, setData] = useState({
    student: null,
    attendance: [],
    notifications: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await API.get("/parent/dashboard");
      setData(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold">👨‍👩‍👧 Parent Dashboard</h2>

        {/* STUDENT INFO */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Student Info</h3>
          {data.student ? (
            <p>
              {data.student.name} ({data.student.className} -{" "}
              {data.student.section})
            </p>
          ) : (
            <p>No student found</p>
          )}
        </div>

        {/* ATTENDANCE */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Recent Attendance</h3>
          {data.attendance.length === 0 ? (
            <p>No records</p>
          ) : (
            data.attendance.map((a) => (
              <div key={a._id} className="border-b py-2">
                {new Date(a.date).toLocaleDateString()} -{" "}
                <span
                  className={
                    a.status === "Present" ? "text-green-600" : "text-red-500"
                  }
                >
                  {a.status}
                </span>
              </div>
            ))
          )}
        </div>

        {/* NOTIFICATIONS */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Notifications</h3>
          {data.notifications.length === 0 ? (
            <p>No notifications</p>
          ) : (
            data.notifications.map((n) => (
              <div key={n._id} className="border-b py-2">
                <p className="font-medium">{n.title}</p>
                <p className="text-sm">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
