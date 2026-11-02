import { useEffect, useRef, useState } from "react";
import { FaCamera, FaUserCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import API from "../services/api";

const emptyProfile = {
  employeeId: "",
  phone: "",
  gender: "",
  dateOfBirth: "",
  designation: "",
  department: "",
  qualification: "",
  specialization: "",
  joiningDate: "",
  employmentType: "full_time",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

const formatDate = (value) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

const formForTeacher = (teacher) => {
  const { photo: _photo, ...profile } = teacher?.teacherProfile || {};
  return {
    name: teacher?.name || "",
    email: teacher?.email || "",
    teacherProfile: {
      ...emptyProfile,
      ...profile,
      dateOfBirth: formatDate(teacher?.teacherProfile?.dateOfBirth),
      joiningDate: formatDate(teacher?.teacherProfile?.joiningDate),
    },
  };
};

export default function TeacherFormModal({
  isOpen,
  onClose,
  onSubmit,
  teacher,
}) {
  const [form, setForm] = useState(() => formForTeacher(teacher));
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const photoUrl = useRef(null);
  const photoFileRef = useRef(null);

  useEffect(() => {
    if (!teacher?.teacherProfile?.photo) return undefined;

    let active = true;
    let createdUrl;
    API.get(`/teachers/${teacher._id}/photo`, { responseType: "blob" })
      .then((response) => {
        if (!active || photoFileRef.current) return;
        createdUrl = URL.createObjectURL(response.data);
        photoUrl.current = createdUrl;
        setPhotoPreview(createdUrl);
      })
      .catch((error) => {
        if (active && error.response?.status !== 404) {
          toast.error(
            error.response?.data?.message || "Unable to load teacher photo",
          );
        }
      });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
        if (photoUrl.current === createdUrl) photoUrl.current = null;
      }
    };
  }, [teacher]);

  useEffect(
    () => () => {
      if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    },
    [],
  );

  if (!isOpen) return null;

  const updateProfile = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      teacherProfile: { ...current.teacherProfile, [name]: value },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        email: form.email.trim(),
        teacherProfile: {
          ...form.teacherProfile,
          employeeId: form.teacherProfile.employeeId.trim().toUpperCase(),
        },
      }, photoFile);
    } catch {
      return;
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      toast.error("Choose a JPG, PNG, or WebP image up to 2 MB");
      return;
    }

    if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    const preview = URL.createObjectURL(file);
    photoUrl.current = preview;
    photoFileRef.current = file;
    setPhotoFile(file);
    setPhotoPreview(preview);
  };

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
  const fields = [
    ["designation", "Designation", "text"],
    ["department", "Department", "text"],
    ["qualification", "Highest qualification", "text"],
    ["specialization", "Subject specialization", "text"],
    ["phone", "Phone number", "tel"],
    ["dateOfBirth", "Date of birth", "date"],
    ["joiningDate", "Joining date", "date"],
    ["address", "Address", "text"],
    ["emergencyContactName", "Emergency contact name", "text"],
    ["emergencyContactPhone", "Emergency contact phone", "tel"],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <header className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-slate-900">
            {teacher ? "Edit teacher profile" : "Add teacher"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {teacher
              ? "Update staff and employment information."
              : "Create a staff profile and email secure login credentials to the teacher."}
          </p>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          <section className="space-y-3">
            <h3 className="border-b border-slate-100 pb-2 text-sm font-semibold text-slate-800">
              Account details
            </h3>
            <div className="grid gap-4 sm:grid-cols-[104px_minmax(0,1fr)]">
              <label className="flex cursor-pointer flex-col items-center gap-1.5 text-center text-xs font-medium text-slate-600">
                <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-4xl text-slate-300">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Teacher profile preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FaUserCircle />
                  )}
                </span>
                <span className="inline-flex items-center gap-1 text-indigo-600">
                  <FaCamera /> {photoPreview ? "Change photo" : "Upload photo"}
                </span>
                <span className="text-[10px] font-normal text-slate-400">
                  JPG, PNG, WebP · Max 2 MB
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handlePhotoChange}
                />
              </label>

              <div className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-700">
                  Full name *
                  <input
                    required
                    maxLength={50}
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    className={inputClass}
                  />
                </label>
                <label className="block text-xs font-medium text-slate-700">
                  Work email *
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                    className={inputClass}
                  />
                </label>
                <label className="block text-xs font-medium text-slate-700">
                  Employee ID *
                  <input
                    required
                    maxLength={30}
                    value={form.teacherProfile.employeeId}
                    onChange={updateProfile}
                    name="employeeId"
                    className={inputClass}
                  />
                </label>
                <label className="block text-xs font-medium text-slate-700">
                  Gender *
                  <select
                    required
                    value={form.teacherProfile.gender}
                    onChange={updateProfile}
                    name="gender"
                    className={inputClass}
                  >
                    <option value="">Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="border-b border-slate-100 pb-2 text-sm font-semibold text-slate-800">
              Professional information
            </h3>
            <div className="grid gap-x-3 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map(([name, label, type]) => (
                <label
                  key={name}
                  className="block text-xs font-medium text-slate-700"
                >
                  {label} *
                  <input
                    required
                    type={type}
                    name={name}
                    value={form.teacherProfile[name]}
                    onChange={updateProfile}
                    maxLength={name === "address" ? 500 : undefined}
                    className={inputClass}
                  />
                </label>
              ))}
              <label className="block text-xs font-medium text-slate-700">
                Employment type *
                <select
                  required
                  name="employmentType"
                  value={form.teacherProfile.employmentType}
                  onChange={updateProfile}
                  className={inputClass}
                >
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                </select>
              </label>
            </div>
          </section>
        </div>

        <footer className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-white px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : teacher ? "Save changes" : "Create teacher"}
          </button>
        </footer>
      </form>
    </div>
  );
}
