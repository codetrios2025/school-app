import { useEffect, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";

export default function MyAttendance() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await API.get("/attendance/my");
      setData(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">📅 My Attendance</h2>

        <div className="bg-white shadow rounded p-4">
          {data.length === 0 ? (
            <p>No attendance records</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((a) => (
                  <tr key={a._id}>
                    <td>{new Date(a.date).toLocaleDateString()}</td>
                    <td>{a.subjectId?.name}</td>
                    <td
                      className={
                        a.status === "Present"
                          ? "text-green-600"
                          : "text-red-500"
                      }
                    >
                      {a.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
