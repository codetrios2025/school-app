import { useEffect, useState } from "react";

export default function TeacherModal({ isOpen, onClose, onSubmit, editData }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name || "",
        email: editData.email || "",
        password: "", // don't preload password
      });
    } else {
      setForm({ name: "", email: "", password: "" });
    }
  }, [editData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name) return toast.error("Name required");
    if (!form.email) return toast.error("Email required");

    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white p-6 rounded w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {editData ? "Edit Teacher" : "Add Teacher"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={form.name}
            placeholder="Name"
            className="border p-2 w-full"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            value={form.email}
            placeholder="Email"
            className="border p-2 w-full"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          {!editData && (
            <input
              type="password"
              placeholder="Password"
              className="border p-2 w-full"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          )}

          <div className="flex justify-end gap-2">
            <button onClick={onClose} type="button">
              Cancel
            </button>

            <button className="bg-indigo-600 text-white px-4 py-2">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
