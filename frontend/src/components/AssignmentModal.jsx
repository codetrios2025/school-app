import { useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";

const emptyAllocation = { classId: "", subjectId: "" };

export default function AssignmentModal({
  isOpen,
  onClose,
  onSubmit,
  teachers,
  classes,
  subjects,
  assignment,
}) {
  const [teacherId, setTeacherId] = useState(assignment?.teacherId?._id || "");
  const [allocations, setAllocations] = useState([
    assignment
      ? {
          classId: assignment.classId?._id || "",
          subjectId: assignment.subjectId?._id || "",
        }
      : { ...emptyAllocation },
  ]);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const updateAllocation = (index, field, value) => {
    setAllocations((current) =>
      current.map((allocation, itemIndex) =>
        itemIndex === index
          ? {
              ...allocation,
              [field]: value,
              ...(field === "classId" ? { subjectId: "" } : {}),
            }
          : allocation,
      ),
    );
  };

  const addAllocation = () => {
    setAllocations((current) => [...current, { ...emptyAllocation }]);
  };

  const removeAllocation = (index) => {
    setAllocations((current) =>
      current.filter((_allocation, itemIndex) => itemIndex !== index),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!teacherId) return toast.error("Select a teacher");
    if (
      allocations.some(
        (allocation) => !allocation.classId || !allocation.subjectId,
      )
    ) {
      return toast.error("Select a class and subject for each allocation");
    }

    const allocationKeys = allocations.map(
      ({ classId, subjectId }) => `${classId}:${subjectId}`,
    );
    if (new Set(allocationKeys).size !== allocationKeys.length) {
      return toast.error("Remove duplicate class and subject allocations");
    }

    setSaving(true);
    try {
      await onSubmit({
        teacherId,
        allocations,
        ...(assignment && {
          classId: allocations[0].classId,
          subjectId: allocations[0].subjectId,
          title: assignment.title,
          description: assignment.description || "",
        }),
      });
    } catch {
      return;
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <header className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-slate-900">
            {assignment ? "Edit subject assignment" : "Assign teaching subjects"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {assignment
              ? "Update the teacher, class, or subject for this allocation."
              : "Assign a teacher to one or more class and subject combinations."}
          </p>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          <label className="block text-sm font-medium text-slate-700">
            Teacher *
            <select
              required
              value={teacherId}
              onChange={(event) => setTeacherId(event.target.value)}
              className={`${inputClass} mt-1`}
            >
              <option value="">Select teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name} · {teacher.teacherProfile?.employeeId || teacher.email}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-800">
                Classes and subjects
              </h3>
              {!assignment && <button
                type="button"
                onClick={addAllocation}
                disabled={allocations.length >= 30}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
              >
                <FaPlus /> Add another
              </button>}
            </div>

            {allocations.map((allocation, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <label className="block text-xs font-medium text-slate-600">
                  Class *
                  <select
                    required
                    value={allocation.classId}
                    onChange={(event) =>
                      updateAllocation(index, "classId", event.target.value)
                    }
                    className={`${inputClass} mt-1`}
                  >
                    <option value="">Select class</option>
                    {classes.map((schoolClass) => (
                      <option key={schoolClass._id} value={schoolClass._id}>
                        {schoolClass.className} · Section {schoolClass.section}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Subject *
                  <select
                    required
                    value={allocation.subjectId}
                    onChange={(event) =>
                      updateAllocation(index, "subjectId", event.target.value)
                    }
                    className={`${inputClass} mt-1`}
                  >
                    <option value="">Select subject</option>
                    {subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => removeAllocation(index)}
                  disabled={assignment || allocations.length === 1}
                  aria-label={`Remove allocation ${index + 1}`}
                  className="self-end rounded-lg border border-rose-200 p-2.5 text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        </div>

        <footer className="flex shrink-0 justify-end gap-2 border-t border-slate-100 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : assignment
                ? "Save changes"
                : "Save assignments"}
          </button>
        </footer>
      </form>
    </div>
  );
}
