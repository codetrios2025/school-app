import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { saveAs } from "file-saver";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaCloudUploadAlt,
  FaDownload,
  FaTimes,
} from "react-icons/fa";
import toast from "react-hot-toast";
import API from "../../services/api";

const steps = [
  "Personal Information",
  "Parent Information",
  "Address Information",
  "Documents Upload",
];

const initialForm = {
  name: "",
  email: "",
  admissionNo: "",
  classId: "",
  rollNumber: "",
  gender: "",
  dateOfBirth: "",
  bloodGroup: "",
  category: "",
  religion: "",
  nationality: "",
  aadhaarNumber: "",
  apaarId: "",
  pen: "",
  srnNumber: "",
  familyId: "",
  fatherName: "",
  motherName: "",
  parentName: "",
  parentEmail: "",
  contactNumber: "",
  fatherContactNumber: "",
  motherContactNumber: "",
  guardianName: "",
  guardianRelation: "",
  guardianContactNumber: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  emergencyContactRelation: "",
  address: {
    line1: "",
    line2: "",
    country: "",
    state: "",
    district: "",
    city: "",
    pincode: "",
  },
  status: "active",
};

const requiredByStep = {
  1: [
    ["admissionNo", "Admission number"],
    ["name", "Student name"],
    ["email", "Student email"],
    ["classId", "Class"],
    ["rollNumber", "Roll number"],
    ["gender", "Gender"],
    ["dateOfBirth", "Date of birth"],
  ],
  2: [
    ["fatherName", "Father name"],
    ["motherName", "Mother name"],
    ["contactNumber", "Parent mobile number"],
    ["emergencyContactName", "Emergency contact name"],
    ["emergencyContactNumber", "Emergency contact number"],
    ["emergencyContactRelation", "Emergency contact relation"],
  ],
  3: [
    ["address.line1", "Address line 1"],
    ["address.country", "Country"],
    ["address.state", "State"],
    ["address.district", "District"],
    ["address.city", "City"],
    ["address.pincode", "Pincode"],
  ],
};

const getValue = (object, path) =>
  path.split(".").reduce((value, key) => value?.[key], object);

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function Field({ label, name, value, onChange, type = "text", required = false, ...props }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="ml-1 text-rose-500">*</span>}
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        required={required}
        className={inputClass}
        {...props}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  disabled = false,
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="ml-1 text-rose-500">*</span>}
      <select
        value={value || ""}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-50`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function AddStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [classes, setClasses] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [existingPhoto, setExistingPhoto] = useState(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState("");
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const classNames = useMemo(
    () => [...new Set(classes.map((item) => item.className))].sort(),
    [classes],
  );
  const selectedClass = classes.find((item) => item._id === form.classId);
  const sections = classes.filter(
    (item) => item.className === selectedClass?.className,
  );

  useEffect(() => {
    let active = true;

    const loadFormData = async () => {
      try {
        const [classResponse, studentResponse] = await Promise.all([
          API.get("/classes", { params: { limit: 100 } }),
          isEditing ? API.get(`/students/${id}`) : Promise.resolve(null),
        ]);
        if (!active) return;

        setClasses(classResponse.data.data || []);
        if (studentResponse) {
          const student = studentResponse.data.data;
          const studentForm = { ...initialForm };
          Object.keys(initialForm).forEach((field) => {
            if (student[field] !== undefined) studentForm[field] = student[field];
          });
          setForm({
            ...studentForm,
            name: student.userId?.name || "",
            email: student.userId?.email || "",
            classId: student.classId?._id || "",
            dateOfBirth: student.dateOfBirth
              ? new Date(student.dateOfBirth).toISOString().slice(0, 10)
              : "",
            address: { ...initialForm.address, ...student.address },
          });
          setExistingPhoto(student.photo || null);
          setExistingDocuments(student.documents || []);
        }
      } catch (error) {
        if (active) {
          toast.error(
            error.response?.data?.message || "Failed to load student details",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadFormData();
    return () => {
      active = false;
    };
  }, [id, isEditing]);

  useEffect(() => {
    if (!id || !existingPhoto) return undefined;
    let active = true;
    let photoUrl;
    API.get(`/students/${id}/files/photo`, { responseType: "blob" })
      .then((response) => {
        photoUrl = URL.createObjectURL(response.data);
        if (active) setExistingPhotoUrl(photoUrl);
        else URL.revokeObjectURL(photoUrl);
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message || "Unable to load current student photo",
          );
        }
      });

    return () => {
      active = false;
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [id, existingPhoto]);

  useEffect(
    () => () => {
      if (photo?.preview) URL.revokeObjectURL(photo.preview);
    },
    [photo],
  );

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateAddress = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      address: { ...current.address, [name]: value },
    }));
  };

  const selectClass = (event) => {
    const className = event.target.value;
    const classForName = classes.find((item) => item.className === className);
    setForm((current) => ({
      ...current,
      classId: classForName?._id || "",
    }));
  };

  const validateStep = (stepToCheck = step) => {
    const requiredFields = requiredByStep[stepToCheck] || [];
    const missing = requiredFields.find(
      ([field]) => !String(getValue(form, field) || "").trim(),
    );
    if (missing) {
      toast.error(`${missing[1]} is required`);
      return false;
    }
    if (stepToCheck === 1 && !/^\S+@\S+\.\S+$/.test(form.email)) {
      toast.error("Enter a valid student email");
      return false;
    }
    if (
      stepToCheck === 1 &&
      form.dateOfBirth &&
      new Date(form.dateOfBirth) >= new Date()
    ) {
      toast.error("Date of birth must be in the past");
      return false;
    }
    if (
      stepToCheck === 2 &&
      form.parentEmail &&
      !/^\S+@\S+\.\S+$/.test(form.parentEmail)
    ) {
      toast.error("Enter a valid parent email");
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (validateStep()) setStep((current) => Math.min(current + 1, steps.length));
  };

  const goToStep = (targetStep) => {
    if (targetStep <= step) {
      setStep(targetStep);
      return;
    }

    for (let currentStep = step; currentStep < targetStep; currentStep += 1) {
      if (!validateStep(currentStep)) return;
    }
    setStep(targetStep);
  };

  const setPhotoFile = (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Photo must be a JPG, PNG, or WebP image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo must be 2 MB or smaller");
      return;
    }
    setPhoto({ file, preview: URL.createObjectURL(file) });
  };

  const addDocuments = (files) => {
    const selected = Array.from(files || []);
    const invalid = selected.find(
      (file) =>
        !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(
          file.type,
        ) ||
        file.size > 5 * 1024 * 1024,
    );
    if (invalid) {
      toast.error("Documents must be JPG, PNG, WebP, or PDF files up to 5 MB");
      return;
    }
    if (documents.length + selected.length + existingDocuments.length > 8) {
      toast.error("You can upload up to 8 documents");
      return;
    }
    setDocuments((current) => [...current, ...selected]);
  };

  const downloadFile = async (fileId, fileName) => {
    try {
      const response = await API.get(`/students/${id}/files/${fileId}`, {
        responseType: "blob",
      });
      saveAs(response.data, fileName);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to download file");
    }
  };

  const submitStudent = async () => {
    for (const stepNumber of [1, 2, 3]) {
      const missing = requiredByStep[stepNumber].find(
        ([field]) => !String(getValue(form, field) || "").trim(),
      );
      if (missing) {
        setStep(stepNumber);
        toast.error(`${missing[1]} is required`);
        return;
      }
    }

    const formData = new FormData();
    const studentData = { ...form };
    delete studentData.photo;
    delete studentData.documents;
    formData.append("studentData", JSON.stringify(studentData));
    if (photo) formData.append("photo", photo.file);
    documents.forEach((file) => formData.append("documents", file));

    setSaving(true);
    try {
      if (isEditing) {
        await API.put(`/students/${id}`, formData);
        toast.success("Student updated successfully");
      } else {
        const response = await API.post("/students", formData);
        if (response.data.emailSent === false) {
          toast.error(
            "Student was added, but the account email could not be sent",
          );
        } else {
          toast.success("Student added successfully");
        }
      }
      navigate("/students");
    } catch (error) {
      const validationMessage = error.response?.data?.errors?.[0]?.msg;
      toast.error(
        validationMessage ||
          error.response?.data?.message ||
          "Unable to save student",
      );
    } finally {
      setSaving(false);
    }
  };

  const rowClass = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";

  if (loading) {
    return <div className="rounded-xl bg-white p-10 text-center text-slate-500">Loading student details...</div>;
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 data-page-title className="text-2xl font-bold text-slate-900">
            {isEditing ? "Edit Student" : "Add Student"}
          </h1>
          <nav className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <Link to="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>›</span>
            <Link to="/students" className="hover:text-blue-600">Students</Link>
            <span>›</span>
            <span className="text-blue-600">{isEditing ? "Edit Student" : "Add Student"}</span>
          </nav>
        </div>
      </header>

      <form
        onSubmit={(event) => event.preventDefault()}
        className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm"
      >
        <div className="grid min-h-[520px] lg:grid-cols-[218px_minmax(0,1fr)]">
          <aside className="border-b border-slate-100 bg-white p-4 lg:border-b-0 lg:border-r lg:p-0">
            <div className="grid grid-cols-2 gap-2 lg:block lg:space-y-0">
              {steps.map((title, index) => {
                const number = index + 1;
                const active = number === step;
                const complete = number < step;
                return (
                  <button
                    key={title}
                    type="button"
                    onClick={() => goToStep(number)}
                    className={`flex w-full items-center gap-3 px-3 py-3 text-left text-sm transition lg:px-4 ${
                      active
                        ? "rounded-lg bg-blue-50 font-semibold text-blue-700 lg:rounded-none"
                        : "rounded-lg text-slate-600 hover:bg-slate-50 lg:rounded-none"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        active
                          ? "bg-blue-600 text-white"
                          : complete
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {complete ? <FaCheck /> : number}
                    </span>
                    <span className="leading-5">{title}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="min-w-0 p-5 sm:p-7">
            {step === 1 && (
              <div>
                <h2 className="mb-5 text-lg font-semibold text-slate-900">
                  Personal Information
                </h2>
                <div className="grid gap-6 xl:grid-cols-[168px_minmax(0,1fr)]">
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Student Photo</p>
                    <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-center hover:border-blue-400 hover:bg-blue-50/40">
                      {photo?.preview || existingPhotoUrl ? (
                        <img
                          src={photo?.preview || existingPhotoUrl}
                          alt={photo ? "Selected student" : "Current student"}
                          className="h-full w-full rounded-lg object-cover"
                        />
                      ) : (
                        <>
                          <FaCloudUploadAlt className="mb-2 text-3xl text-slate-400" />
                          <span className="text-sm font-semibold text-slate-700">Upload Photo</span>
                          <span className="mt-1 text-xs text-slate-500">JPG, PNG, WebP · Max 2 MB</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(event) => setPhotoFile(event.target.files?.[0])}
                      />
                    </label>
                    {existingPhoto && !photo && (
                      <button
                        type="button"
                        onClick={() => downloadFile("photo", existingPhoto.originalName)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600"
                      >
                        <FaDownload /> Download current photo
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className={rowClass}>
                      <Field label="Admission No" name="admissionNo" value={form.admissionNo} onChange={updateField} required />
                      <SelectField
                        label="Class"
                        value={selectedClass?.className || ""}
                        onChange={selectClass}
                        options={classNames.map((name) => ({ value: name, label: name }))}
                        placeholder="Select class"
                        required
                      />
                      <SelectField
                        label="Section"
                        value={selectedClass?.section || ""}
                        onChange={(event) => {
                          const selected = sections.find((item) => item.section === event.target.value);
                          setForm((current) => ({ ...current, classId: selected?._id || "" }));
                        }}
                        options={sections.map((item) => ({ value: item.section, label: item.section }))}
                        placeholder="Select section"
                        required
                        disabled={!selectedClass}
                      />
                    </div>
                    <div className={rowClass}>
                      <Field label="Student Name" name="name" value={form.name} onChange={updateField} required maxLength={50} placeholder="Enter student full name" />
                      <SelectField
                        label="Gender"
                        value={form.gender}
                        onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                        options={[
                          { value: "male", label: "Male" },
                          { value: "female", label: "Female" },
                          { value: "other", label: "Other" },
                        ]}
                        placeholder="Select gender"
                        required
                      />
                      <Field label="Date of Birth" name="dateOfBirth" value={form.dateOfBirth} onChange={updateField} type="date" required />
                    </div>
                    <div className={rowClass}>
                      <SelectField
                        label="Blood Group"
                        value={form.bloodGroup}
                        onChange={(event) => setForm((current) => ({ ...current, bloodGroup: event.target.value }))}
                        options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((value) => ({ value, label: value }))}
                        placeholder="Select blood group"
                      />
                      <Field label="Category" name="category" value={form.category} onChange={updateField} />
                      <Field label="Religion" name="religion" value={form.religion} onChange={updateField} />
                    </div>
                    <div className={rowClass}>
                      <Field label="Nationality" name="nationality" value={form.nationality} onChange={updateField} />
                      <Field label="Aadhaar No" name="aadhaarNumber" value={form.aadhaarNumber} onChange={updateField} maxLength={20} />
                      <Field label="APAAR ID" name="apaarId" value={form.apaarId} onChange={updateField} maxLength={50} />
                    </div>
                    <div className={rowClass}>
                      <Field label="PEN" name="pen" value={form.pen} onChange={updateField} maxLength={50} />
                      <Field label="SRN No" name="srnNumber" value={form.srnNumber} onChange={updateField} maxLength={50} />
                      <Field label="Family ID" name="familyId" value={form.familyId} onChange={updateField} maxLength={50} />
                    </div>
                    <div className={rowClass}>
                      <Field label="Student Login Email" name="email" value={form.email} onChange={updateField} type="email" required autoComplete="email" />
                      <Field label="Roll Number" name="rollNumber" value={form.rollNumber} onChange={updateField} required maxLength={50} />
                      {isEditing && (
                        <SelectField
                          label="Enrollment Status"
                          value={form.status}
                          onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                          options={[
                            { value: "active", label: "Active" },
                            { value: "inactive", label: "Inactive" },
                          ]}
                          placeholder="Select status"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="mb-5 text-lg font-semibold text-slate-900">Parent Information</h2>
                <div className="space-y-5">
                  <div className={rowClass}>
                    <Field label="Father Name" name="fatherName" value={form.fatherName} onChange={updateField} required />
                    <Field label="Mother Name" name="motherName" value={form.motherName} onChange={updateField} required />
                    <Field label="Parent Mobile Number" name="contactNumber" value={form.contactNumber} onChange={updateField} required type="tel" />
                  </div>
                  <div className={rowClass}>
                    <Field label="Parent Email" name="parentEmail" value={form.parentEmail} onChange={updateField} type="email" />
                    <Field label="Father Mobile Number" name="fatherContactNumber" value={form.fatherContactNumber} onChange={updateField} type="tel" />
                    <Field label="Mother Mobile Number" name="motherContactNumber" value={form.motherContactNumber} onChange={updateField} type="tel" />
                  </div>
                  <div className="border-t border-slate-100 pt-5">
                    <h3 className="mb-4 text-sm font-semibold text-slate-800">Guardian Details <span className="font-normal text-slate-400">Optional</span></h3>
                    <div className={rowClass}>
                      <Field label="Guardian Name" name="guardianName" value={form.guardianName} onChange={updateField} />
                      <Field label="Guardian Relation" name="guardianRelation" value={form.guardianRelation} onChange={updateField} />
                      <Field label="Guardian Mobile Number" name="guardianContactNumber" value={form.guardianContactNumber} onChange={updateField} type="tel" />
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-5">
                    <h3 className="mb-4 text-sm font-semibold text-slate-800">Emergency Contact</h3>
                    <div className={rowClass}>
                      <Field label="Contact Name" name="emergencyContactName" value={form.emergencyContactName} onChange={updateField} required />
                      <Field label="Contact Number" name="emergencyContactNumber" value={form.emergencyContactNumber} onChange={updateField} required type="tel" />
                      <Field label="Relation" name="emergencyContactRelation" value={form.emergencyContactRelation} onChange={updateField} required />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="mb-5 text-lg font-semibold text-slate-900">Address Information</h2>
                <div className="space-y-4">
                  <div className={rowClass}>
                    <Field label="Address Line 1" name="line1" value={form.address.line1} onChange={updateAddress} required maxLength={200} />
                    <Field label="Address Line 2" name="line2" value={form.address.line2} onChange={updateAddress} maxLength={200} />
                    <Field label="Country" name="country" value={form.address.country} onChange={updateAddress} required maxLength={80} />
                  </div>
                  <div className={rowClass}>
                    <Field label="State" name="state" value={form.address.state} onChange={updateAddress} required maxLength={80} />
                    <Field label="District" name="district" value={form.address.district} onChange={updateAddress} required maxLength={80} />
                    <Field label="City" name="city" value={form.address.city} onChange={updateAddress} required maxLength={80} />
                  </div>
                  <div className="max-w-sm">
                    <Field label="Pincode" name="pincode" value={form.address.pincode} onChange={updateAddress} required maxLength={20} />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="mb-2 text-lg font-semibold text-slate-900">Documents Upload</h2>
                <p className="mb-5 text-sm text-slate-500">
                  Add admission forms, identity documents, or other supporting files. Documents are optional.
                </p>
                <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
                  <FaCloudUploadAlt className="mb-2 text-3xl text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">Choose documents</span>
                  <span className="mt-1 text-xs text-slate-500">PDF, JPG, PNG, or WebP · Up to 5 MB each · 8 documents maximum</span>
                  <input
                    type="file"
                    multiple
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      addDocuments(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </label>
                {(existingDocuments.length > 0 || documents.length > 0) && (
                  <div className="mt-5 space-y-2">
                    <h3 className="text-sm font-semibold text-slate-700">Attached files</h3>
                    {existingDocuments.map((file) => (
                      <div key={file._id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                        <span className="truncate text-sm text-slate-700">{file.originalName}</span>
                        <button
                          type="button"
                          onClick={() => downloadFile(file._id, file.originalName)}
                          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-600"
                        >
                          <FaDownload /> Download
                        </button>
                      </div>
                    ))}
                    {documents.map((file, index) => (
                      <div key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                        <span className="truncate text-sm text-slate-700">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setDocuments((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                          aria-label={`Remove ${file.name}`}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => navigate("/students")}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <div className="flex gap-2">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((current) => current - 1)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <FaArrowLeft /> Back
                  </button>
                )}
                {step < steps.length ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Next <FaArrowRight />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submitStudent}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : isEditing
                        ? "Save Changes"
                        : "Add Student"}
                    {!saving && <FaCheck />}
                  </button>
                )}
              </div>
            </footer>
          </div>
        </div>
      </form>
    </section>
  );
}
