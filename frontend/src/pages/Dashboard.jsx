import { useSelector } from "react-redux";
import AdminDashboard from "./AdminDashboard";
import ParentDashboard from "./ParentDashboard";
import TeacherDashboard from "./TeacherDashboard";

export default function Dashboard() {
  const user = useSelector((state) => state.auth.user);

  if (!user) return null;

  if (user.role === "admin") return <AdminDashboard />;
  if (user.role === "teacher") return <TeacherDashboard />;
  if (user.role === "parent" || user.role === "student")
    return <ParentDashboard />;

  return <div>No dashboard available</div>;
}
