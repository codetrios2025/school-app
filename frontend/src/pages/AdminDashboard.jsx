import DashboardLayout from "../layouts/DashboardLayout";

export default function AdminDashboard() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 shadow rounded">Total Students</div>
        <div className="bg-white p-4 shadow rounded">Total Teachers</div>
        <div className="bg-white p-4 shadow rounded">Classes</div>
      </div>
    </>
  );
}
