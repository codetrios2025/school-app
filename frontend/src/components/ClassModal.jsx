import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ClassModal({ isOpen, onClose, onSubmit, editData }) {
  const [form, setForm] = useState({ className: "", section: "" });

  // 🔄 Reset form properly
  useEffect(() => {
    if (editData) {
      setForm({
        className: editData.className || "",
        section: editData.section || "",
      });
    } else {
      setForm({ className: "", section: "" });
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  // ✅ Validation before submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.className.trim()) {
      return toast.error("Class is required");
    }

    if (!form.section.trim()) {
      return toast.error("Section is required");
    }

    onSubmit(form);

    // ✅ Reset form after submit
    setForm({ className: "", section: "" });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">
          {editData ? "Edit Class" : "Add Class"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Class"
            className="border p-2 rounded w-full"
            value={form.className}
            onChange={(e) => setForm({ ...form, className: e.target.value })}
          />

          <input
            placeholder="Section"
            className="border p-2 rounded w-full"
            value={form.section}
            onChange={(e) => setForm({ ...form, section: e.target.value })}
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
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
