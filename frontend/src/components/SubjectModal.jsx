import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function SubjectModal({ isOpen, onClose, onSubmit, editData }) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (editData) setName(editData.name || "");
    else setName("");
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      return toast.error("Subject name is required");
    }

    onSubmit({ name: name.trim() });
    setName("");
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">
          {editData ? "Edit Subject" : "Add Subject"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Subject name"
            className="border p-2 rounded w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
