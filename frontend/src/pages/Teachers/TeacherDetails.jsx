import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft, FaEdit, FaUserCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import API from "../../services/api";
import TeacherFormModal from "../../components/TeacherFormModal";

const showValue = (value) => value || "—";
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "—";

function Detail({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-800">
        {showValue(value)}
      </dd>
    </div>
  );
}

export default function TeacherDetails() {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let active = true;
    let createdPhotoUrl;

    const loadTeacher = async () => {
      try {
        const response = await API.get(`/teachers/${id}`);
        const record = response.data.data;
        if (!active) return;
        setTeacher(record);
        if (record.teacherProfile?.photo?.mimeType) {
          const photoResponse = await API.get(`/teachers/${id}/photo`, {
            responseType: "blob",
          });
          if (!active) return;
          createdPhotoUrl = URL.createObjectURL(photoResponse.data);
          setPhotoUrl(createdPhotoUrl);
        }
      } catch (error) {
        if (active && error.response?.status !== 404) {
          toast.error(
            error.response?.data?.message || "Unable to load teacher details",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTeacher();
    return () => {
      active = false;
      if (createdPhotoUrl) URL.revokeObjectURL(createdPhotoUrl);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-10 text-center text-slate-500">
        Loading teacher details...
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="rounded-xl bg-white p-8 text-center">
        <p className="font-semibold text-slate-800">Teacher details unavailable</p>
        <Link to="/teachers" className="mt-4 inline-flex text-sm text-indigo-600">
          Return to teachers
        </Link>
      </div>
    );
  }

  const profile = teacher.teacherProfile || {};

  const saveTeacher = async (form, photoFile) => {
    try {
      const teacherData = new FormData();
      teacherData.append("teacherData", JSON.stringify(form));
      if (photoFile) teacherData.append("photo", photoFile);
      const response = await API.put(`/teachers/${teacher._id}`, teacherData);
      setTeacher(response.data.data);
      if (photoFile) {
        const photoResponse = await API.get(`/teachers/${teacher._id}/photo`, {
          responseType: "blob",
        });
        setPhotoUrl((currentUrl) => {
          if (currentUrl) URL.revokeObjectURL(currentUrl);
          return URL.createObjectURL(photoResponse.data);
        });
      }
      setEditOpen(false);
      toast.success("Teacher profile updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save teacher");
      throw error;
    }
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 data-page-title className="text-2xl font-bold text-slate-900">Teacher details</h1>
          <nav className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <Link to="/teachers" className="hover:text-indigo-600">Teachers</Link>
            <span>›</span>
            <span className="text-indigo-600">{teacher.name}</span>
          </nav>
        </div>
        <div className="flex gap-2">
          <Link
            to="/teachers"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
          >
            <FaArrowLeft /> Back
          </Link>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
          >
            <FaEdit /> Edit teacher
          </button>
        </div>
      </header>

      <section className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-5xl text-slate-300">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`${teacher.name} profile`}
              className="h-full w-full object-cover"
            />
          ) : (
            <FaUserCircle />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-slate-900">{teacher.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{teacher.email}</p>
          <p className="mt-1 text-sm text-slate-500">
            {profile.designation || "Teacher"}
            {profile.department ? ` · ${profile.department}` : ""}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            teacher.status === "inactive"
              ? "bg-slate-100 text-slate-600"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {teacher.status || "active"}
        </span>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
          Account details
        </h2>
        <dl className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Full name" value={teacher.name} />
          <Detail label="Work email" value={teacher.email} />
          <Detail label="Employee ID" value={profile.employeeId} />
          <Detail label="Gender" value={profile.gender} />
          <Detail label="Phone number" value={profile.phone} />
          <Detail label="Date of birth" value={formatDate(profile.dateOfBirth)} />
        </dl>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
          Professional information
        </h2>
        <dl className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Designation" value={profile.designation} />
          <Detail label="Department" value={profile.department} />
          <Detail label="Highest qualification" value={profile.qualification} />
          <Detail label="Subject specialization" value={profile.specialization} />
          <Detail label="Joining date" value={formatDate(profile.joiningDate)} />
          <Detail
            label="Employment type"
            value={profile.employmentType?.replace("_", " ")}
          />
          <Detail label="Address" value={profile.address} />
        </dl>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
          Emergency contact
        </h2>
        <dl className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Contact name" value={profile.emergencyContactName} />
          <Detail label="Contact phone" value={profile.emergencyContactPhone} />
        </dl>
      </section>

      {editOpen && (
        <TeacherFormModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSubmit={saveTeacher}
          teacher={teacher}
        />
      )}
    </section>
  );
}
