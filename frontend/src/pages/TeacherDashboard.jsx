import DashboardLayout from "../layouts/DashboardLayout";

export default function TeacherDashboard() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Teacher Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 shadow rounded">My Classes</div>
        <div className="bg-white p-4 shadow rounded">Assignments</div>
      </div>
    </>
  );
}
