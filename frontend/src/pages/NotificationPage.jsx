import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import API from "../services/api";
import toast from "react-hot-toast";

export default function NotificationPage() {
  const user = useSelector((state) => state.auth.user);

  const [form, setForm] = useState({
    title: "",
    message: "",
    target: "all",
    classId: "",
  });

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔄 Load classes
  // useEffect(() => {
  //   API.get("/classes").then((res) => setClasses(res.data.data));
  // }, []);

  useEffect(() => {
    if (!user) return;

    const fetchClasses = async () => {
      try {
        let res;

        if (user.role === "teacher") {
          res = await API.get("/notifications/teacher-classes");
        } else {
          res = await API.get("/classes");
        }

        const data = res.data.data || [];

        console.log("Loaded Classes:", data); // ✅ debug

        setClasses(data);
      } catch (err) {
        console.log("Class fetch error:", err.message);
        setClasses([]);
      }
    };

    fetchClasses();
  }, [user]);

  useEffect(() => {
    if (user?.role === "teacher") {
      setForm((prev) => ({
        ...prev,
        target: "class",
      }));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    if (!form.title || !form.message) {
      setLoading(false);
      return toast.error("All fields required");
    }

    if (
      (form.target === "class" || user?.role === "teacher") &&
      !form.classId
    ) {
      setLoading(false);
      return toast.error("Please select class");
    }

    try {
      await API.post("/notifications", form);
      toast.success("Notification sent");
      setForm({ title: "", message: "", target: "all", classId: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl font-bold mb-6">📢 Send Notification</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TARGET */}
          {user?.role === "admin" && (
            <select
              className="w-full border p-3 rounded-lg"
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
            >
              <option value="all">All Users</option>
              <option value="teachers">All Teachers</option>
              <option value="students">All Students</option>
              <option value="class">Class Wise</option>
            </select>
          )}

          {/* CLASS SELECT */}
          {/* {(form.target === "class" || user?.role === "teacher") && (
            <select
              className="w-full border p-3 rounded-lg"
              value={form.classId}
              onChange={(e) => setForm({ ...form, classId: e.target.value })}
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.className} - {c.section}
                </option>
              ))}
            </select>
          )} */}

          {(user?.role === "admin" && form.target === "class") ||
          user?.role === "teacher" ? (
            <>
              <select
                className="w-full border p-3 rounded-lg"
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
              >
                <option value="">Select Class</option>

                {classes.length === 0 ? (
                  <option disabled>No classes assigned</option>
                ) : (
                  classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.className} - {c.section}
                    </option>
                  ))
                )}
              </select>

              {/* ✅ Helpful message */}
              {classes.length === 0 && user?.role === "teacher" && (
                <p className="text-sm text-red-500 mt-1">
                  No classes assigned to you. Contact admin.
                </p>
              )}
            </>
          ) : null}

          {/* TITLE */}
          <input
            placeholder="Notification Title"
            className="w-full border p-3 rounded-lg"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          {/* MESSAGE */}
          <textarea
            placeholder="Write your message..."
            className="w-full border p-3 rounded-lg h-28"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />

          {/* BUTTON */}
          <button
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            {loading ? "Sending..." : "Send Notification"}
          </button>
        </form>
      </div>
    </div>
  );
}
