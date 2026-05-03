import DashboardLayout from "../layouts/DashboardLayout";

export default function ParentDashboard() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Parent Dashboard</h1>

      <div className="bg-white p-4 shadow rounded">
        Child Attendance Summary
      </div>
    </DashboardLayout>
  );
}
