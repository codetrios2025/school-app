import { useState } from "react";
import toast from "react-hot-toast";

export default function AssignmentModal({
  isOpen,
  onClose,
  onSubmit,
  teachers,
  classes,
  subjects,
}) {
  const [form, setForm] = useState({
    teacherId: "",
    classId: "",
    subjectId: "",
    title: "",
    description: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.title) return toast.error("Title required");
    if (!form.description) return toast.error("Description required");
    if (!form.teacherId) return toast.error("Select teacher");
    if (!form.classId) return toast.error("Select class");
    if (!form.subjectId) return toast.error("Select subject");

    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Assign Teacher</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            placeholder="Assignment Title"
            className="border p-2 w-full rounded"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <textarea
            placeholder="Description"
            className="border p-2 w-full rounded"
            rows="3"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {/* Teacher */}

          <select
            className="border p-2 w-full"
            onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
          >
            <option value="">Select Teacher</option>

            {teachers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Class */}
          <select
            className="border p-2 w-full"
            onChange={(e) => setForm({ ...form, classId: e.target.value })}
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.className} - {c.section}
              </option>
            ))}
          </select>

          {/* Subject */}
          <select
            className="border p-2 w-full"
            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
          >
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              type="button"
              className="border px-4 py-2"
            >
              Cancel
            </button>

            <button className="bg-indigo-600 text-white px-4 py-2">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
