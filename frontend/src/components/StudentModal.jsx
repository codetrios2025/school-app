import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function StudentModal({
  isOpen,
  onClose,
  onSubmit,
  editData,
  classes,
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    rollNumber: "",
    classId: "",
    parentName: "",
    parentEmail: "", // ✅ ADDED
    contactNumber: "",
  });

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.userId?.name || "",
        email: editData.userId?.email || "",
        rollNumber: editData.rollNumber || "",
        classId:
          typeof editData.classId === "object"
            ? editData.classId?._id
            : editData.classId || "",
        parentName: editData.parentName || "",
        parentEmail: editData.parentEmail || "", // ✅ ADDED
        contactNumber: editData.contactNumber || "",
      });
    } else {
      setForm({
        name: "",
        email: "",
        rollNumber: "",
        classId: "",
        parentName: "",
        parentEmail: "", // ✅ ADDED
        contactNumber: "",
      });
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name) return toast.error("Name required");
    if (!form.email) return toast.error("Email required");
    if (!form.rollNumber) return toast.error("Roll number required");
    if (!form.classId) return toast.error("Select class");

    // ✅ optional validation
    if (form.parentEmail && !/\S+@\S+\.\S+/.test(form.parentEmail)) {
      return toast.error("Invalid parent email");
    }

    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">
          {editData ? "Edit Student" : "Add Student"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* STUDENT NAME */}
          <input
            placeholder="Student Name"
            className="border p-2 w-full rounded"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          {/* EMAIL */}
          <input
            placeholder="Email"
            className="border p-2 w-full rounded"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          {/* ROLL */}
          <input
            placeholder="Roll Number"
            className="border p-2 w-full rounded"
            value={form.rollNumber}
            onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
          />

          {/* CLASS */}
          <select
            className="border p-2 w-full rounded"
            value={form.classId || ""}
            onChange={(e) => setForm({ ...form, classId: e.target.value })}
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.className} - {c.section}
              </option>
            ))}
          </select>

          {/* PARENT NAME */}
          <input
            placeholder="Parent Name"
            className="border p-2 w-full rounded"
            value={form.parentName}
            onChange={(e) => setForm({ ...form, parentName: e.target.value })}
          />

          {/* ✅ PARENT EMAIL (NEW FIELD) */}
          <input
            placeholder="Parent Email"
            className="border p-2 w-full rounded"
            value={form.parentEmail}
            onChange={(e) => setForm({ ...form, parentEmail: e.target.value })}
          />

          {/* CONTACT */}
          <input
            placeholder="Contact Number"
            className="border p-2 w-full rounded"
            value={form.contactNumber}
            onChange={(e) =>
              setForm({ ...form, contactNumber: e.target.value })
            }
          />

          {/* ACTIONS */}
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              type="button"
              className="border px-4 py-2 rounded"
            >
              Cancel
            </button>

            <button className="bg-indigo-600 text-white px-4 py-2 rounded">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
