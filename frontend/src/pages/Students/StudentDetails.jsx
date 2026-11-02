import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { saveAs } from "file-saver";
import { FaArrowLeft, FaDownload, FaEdit, FaUserCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import API from "../../services/api";

const formatValue = (value) => value || "—";
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "—";

function Detail({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-800">
        {formatValue(value)}
      </dd>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <h2 className="border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
        {title}
      </h2>
      <dl className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </dl>
    </section>
  );
}

export default function StudentDetails() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let createdPhotoUrl;

    const loadStudent = async () => {
      try {
        const response = await API.get(`/students/${id}`);
        const record = response.data.data;
        if (!active) return;
        setStudent(record);

        if (record.photo) {
          const photoResponse = await API.get(
            `/students/${id}/files/photo`,
            { responseType: "blob" },
          );
          if (!active) return;
          createdPhotoUrl = URL.createObjectURL(photoResponse.data);
          setPhotoUrl(createdPhotoUrl);
        }
      } catch (error) {
        if (active) {
          toast.error(
            error.response?.data?.message || "Unable to load student details",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadStudent();
    return () => {
      active = false;
      if (createdPhotoUrl) URL.revokeObjectURL(createdPhotoUrl);
    };
  }, [id]);

  const downloadDocument = async (document) => {
    try {
      const response = await API.get(
        `/students/${id}/files/${document._id}`,
        { responseType: "blob" },
      );
      saveAs(response.data, document.originalName);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to download student document",
      );
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-10 text-center text-slate-500">
        Loading student details...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="rounded-xl bg-white p-8 text-center">
        <p className="font-semibold text-slate-800">Student details unavailable</p>
        <Link to="/students" className="mt-4 inline-flex text-sm text-blue-600">
          Return to students
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 data-page-title className="text-2xl font-bold text-slate-900">Student details</h1>
          <nav className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <Link to="/students" className="hover:text-blue-600">Students</Link>
            <span>›</span>
            <span className="text-blue-600">{student.userId?.name || "Profile"}</span>
          </nav>
        </div>
        <div className="flex gap-2">
          <Link
            to="/students"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
          >
            <FaArrowLeft /> Back
          </Link>
          <Link
            to={`/students/${student._id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
          >
            <FaEdit /> Edit student
          </Link>
        </div>
      </header>

      <section className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-5xl text-slate-300">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`${student.userId?.name || "Student"} profile`}
              className="h-full w-full object-cover"
            />
          ) : (
            <FaUserCircle />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-slate-900">
            {student.userId?.name || "Student"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {student.userId?.email || "No email"}
            {student.admissionNo ? ` · Admission ${student.admissionNo}` : ""}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {student.classId
              ? `Class ${student.classId.className} · Section ${student.classId.section}`
              : "Class not assigned"}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            student.status === "inactive"
              ? "bg-slate-100 text-slate-600"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {student.status || "active"}
        </span>
      </section>

      <Section title="Personal information">
        <Detail label="Admission number" value={student.admissionNo} />
        <Detail label="Roll number" value={student.rollNumber} />
        <Detail label="Gender" value={student.gender} />
        <Detail label="Date of birth" value={formatDate(student.dateOfBirth)} />
        <Detail label="Blood group" value={student.bloodGroup} />
        <Detail label="Category" value={student.category} />
        <Detail label="Religion" value={student.religion} />
        <Detail label="Nationality" value={student.nationality} />
        <Detail label="Aadhaar number" value={student.aadhaarNumber} />
        <Detail label="APAAR ID" value={student.apaarId} />
        <Detail label="PEN" value={student.pen} />
        <Detail label="SRN number" value={student.srnNumber} />
        <Detail label="Family ID" value={student.familyId} />
      </Section>

      <Section title="Parent and guardian information">
        <Detail label="Father name" value={student.fatherName} />
        <Detail label="Father contact" value={student.fatherContactNumber} />
        <Detail label="Mother name" value={student.motherName} />
        <Detail label="Mother contact" value={student.motherContactNumber} />
        <Detail label="Parent email" value={student.parentEmail} />
        <Detail label="Primary contact" value={student.contactNumber} />
        <Detail label="Guardian name" value={student.guardianName} />
        <Detail label="Guardian relation" value={student.guardianRelation} />
        <Detail label="Guardian contact" value={student.guardianContactNumber} />
      </Section>

      <Section title="Address and emergency contact">
        <Detail label="Address line 1" value={student.address?.line1} />
        <Detail label="Address line 2" value={student.address?.line2} />
        <Detail label="City" value={student.address?.city} />
        <Detail label="District" value={student.address?.district} />
        <Detail label="State" value={student.address?.state} />
        <Detail label="Country" value={student.address?.country} />
        <Detail label="Pincode" value={student.address?.pincode} />
        <Detail label="Emergency contact" value={student.emergencyContactName} />
        <Detail label="Emergency phone" value={student.emergencyContactNumber} />
        <Detail label="Emergency relation" value={student.emergencyContactRelation} />
      </Section>

      <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
          Documents
        </h2>
        {!student.documents?.length ? (
          <p className="pt-4 text-sm text-slate-500">No documents uploaded.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {student.documents.map((document) => (
              <li
                key={document._id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <span className="text-sm font-medium text-slate-700">
                  {document.originalName}
                </span>
                <button
                  type="button"
                  onClick={() => downloadDocument(document)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                >
                  <FaDownload /> Download
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
