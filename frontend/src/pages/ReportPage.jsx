import { useEffect, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";
import { exportToExcel } from "../utils/exportExcel";

export default function ReportPage() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [data, setData] = useState([]);

  // 🔄 Fetch Classes
  const fetchClasses = async () => {
    const res = await API.get("/classes");
    setClasses(res.data.data);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // 🔄 Fetch Report
  const fetchReport = async () => {
    const res = await API.get(
      `/reports/class?classId=${classId}&fromDate=${fromDate}&toDate=${toDate}`,
    );
    setData(res.data.data);
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Attendance Report</h1>

      {/* FILTERS */}
      <div className="flex gap-3 mb-4">
        <select onChange={(e) => setClassId(e.target.value)}>
          <option>Select Class</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.className} - {c.section}
            </option>
          ))}
        </select>

        <input type="date" onChange={(e) => setFromDate(e.target.value)} />
        <input type="date" onChange={(e) => setToDate(e.target.value)} />

        <button
          onClick={fetchReport}
          className="bg-indigo-600 text-white px-4 py-2"
        >
          Get Report
        </button>
        <button
          onClick={() => exportToExcel(data, "Attendance_Report")}
          className="bg-green-600 text-white px-4 py-2"
        >
          Export Excel
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white p-4 rounded shadow">
        {data.map((att, i) => (
          <div key={i} className="mb-3 border-b pb-2">
            <p className="font-bold">Date: {att.date}</p>

            {att.records.map((r) => (
              <div key={r._id} className="flex justify-between">
                <span>{r.studentId?.name}</span>
                <span
                  className={
                    r.status === "present" ? "text-green-600" : "text-red-600"
                  }
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
