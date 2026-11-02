import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaChalkboardTeacher,
  FaEdit,
  FaEnvelope,
  FaEye,
  FaFileImport,
  FaPlus,
  FaSearch,
  FaToggleOff,
  FaToggleOn,
  FaTrash,
  FaUserCircle,
} from "react-icons/fa";
import toast from "react-hot-toast";
import API from "../../services/api";
import TeacherFormModal from "../../components/TeacherFormModal";
import DataImportModal from "../../components/DataImportModal";

const teacherImportColumns = [
  "teacherProfile.employeeId", "name", "email", "teacherProfile.phone",
  "teacherProfile.gender", "teacherProfile.dateOfBirth",
  "teacherProfile.designation", "teacherProfile.department",
  "teacherProfile.qualification", "teacherProfile.specialization",
  "teacherProfile.joiningDate", "teacherProfile.employmentType",
  "teacherProfile.address", "teacherProfile.emergencyContactName",
  "teacherProfile.emergencyContactPhone", "status",
];
const teacherImportRequiredColumns = teacherImportColumns.filter(
  (column) => column !== "status",
);
const teacherImportSample = [
  "EMP-1001", "Priya Patel", "priya@example.com", "9876543210", "female",
  "1990-04-15", "Teacher", "Mathematics", "B.Ed", "Mathematics",
  "2020-06-01", "full_time", "12 Main Street, Delhi", "Amit Patel",
  "9876543211", "active",
];

export default function TeacherList() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);
  const [photoUrls, setPhotoUrls] = useState({});
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    let active = true;
    API.get("/teachers", {
      params: { page, limit: 10, search, ...(status && { status }) },
    })
      .then((response) => {
        if (!active) return;
        setTeachers(response.data.data || []);
        setTotal(response.data.total || 0);
        setActiveCount(response.data.activeCount || 0);
        setTotalPages(Math.max(1, response.data.totalPages || 1));
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message || "Failed to load teachers",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, search, status]);

  useEffect(() => {
    let active = true;
    const createdUrls = [];
    const teachersWithPhotos = teachers.filter(
      (teacher) => teacher.teacherProfile?.photo?.mimeType,
    );

    Promise.all(
      teachersWithPhotos.map(async (teacher) => {
        try {
          const response = await API.get(`/teachers/${teacher._id}/photo`, {
            responseType: "blob",
          });
          const url = URL.createObjectURL(response.data);
          createdUrls.push(url);
          return [teacher._id, url];
        } catch (error) {
          if (active && error.response?.status !== 404) {
            toast.error(
              error.response?.data?.message ||
                `Unable to load ${teacher.name}'s photo`,
            );
          }
          return [teacher._id, null];
        }
      }),
    ).then((entries) => {
      if (active) setPhotoUrls(Object.fromEntries(entries));
    });

    return () => {
      active = false;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [teachers]);

  const refreshList = async () => {
    setLoading(true);
    try {
      const response = await API.get("/teachers", {
        params: { page, limit: 10, search, ...(status && { status }) },
      });
      setTeachers(response.data.data || []);
      setTotal(response.data.total || 0);
      setActiveCount(response.data.activeCount || 0);
      setTotalPages(Math.max(1, response.data.totalPages || 1));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to refresh teachers");
    } finally {
      setLoading(false);
    }
  };

  const saveTeacher = async (form, photoFile) => {
    try {
      const teacherData = new FormData();
      teacherData.append("teacherData", JSON.stringify(form));
      if (photoFile) teacherData.append("photo", photoFile);

      const response = editTeacher
        ? await API.put(`/teachers/${editTeacher._id}`, teacherData)
        : await API.post("/teachers", teacherData);

      if (!editTeacher && response.data.credentialsSent === false) {
        toast.error(response.data.message);
      } else {
        toast.success(
          editTeacher
            ? "Teacher profile updated"
            : "Teacher added and credentials emailed",
        );
      }
      setModalOpen(false);
      setEditTeacher(null);
      await refreshList();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save teacher");
      throw error;
    }
  };

  const toggleStatus = async (teacher) => {
    const nextStatus = teacher.status === "inactive" ? "active" : "inactive";
    try {
      await API.patch(`/teachers/${teacher._id}/status`, {
        status: nextStatus,
      });
      toast.success(`Teacher marked ${nextStatus}`);
      await refreshList();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update teacher status",
      );
    }
  };

  const sendCredentials = async (teacher) => {
    if (
      !window.confirm(
        `Send new login credentials to ${teacher.name} at ${teacher.email}? This resets their password.`,
      )
    ) {
      return;
    }
    try {
      const response = await API.post(
        `/teachers/${teacher._id}/send-credentials`,
      );
      toast.success(response.data.message);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to send teacher credentials",
      );
    }
  };

  const deleteTeacher = async (teacher) => {
    if (
      !window.confirm(
        `Delete ${teacher.name}'s account and teaching assignments?`,
      )
    ) {
      return;
    }
    try {
      await API.delete(`/teachers/${teacher._id}`);
      toast.success("Teacher deleted");
      if (teachers.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await refreshList();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete teacher");
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 data-page-title className="text-2xl font-bold text-slate-900">Teacher management</h1>
          <nav className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <Link to="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
            <span>›</span>
            <span className="text-indigo-600">Teachers</span>
          </nav>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            <FaFileImport /> Import
          </button>
          <button
            type="button"
            onClick={() => {
              setEditTeacher(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <FaPlus /> Add teacher
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <article className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600">
            <FaChalkboardTeacher />
          </span>
          <div>
            <p className="text-sm text-slate-500">Teachers matching filters</p>
            <p className="text-2xl font-bold text-slate-900">{total}</p>
          </div>
        </article>
        <article className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
            <FaChalkboardTeacher />
          </span>
          <div>
            <p className="text-sm text-slate-500">Active teachers matching filters</p>
            <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
          </div>
        </article>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-[240px] flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, employee ID, subject..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <select
            aria-label="Filter by account status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatus("");
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Department / designation</th>
                <th className="px-4 py-3">Qualification</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    Loading teacher records...
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No teachers found. Add a teacher profile to get started.
                  </td>
                </tr>
              ) : (
                teachers.map((teacher, index) => (
                  <tr key={teacher._id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 text-slate-500">
                      {(page - 1) * 10 + index + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-3xl text-slate-300">
                          {photoUrls[teacher._id] ? (
                            <img
                              src={photoUrls[teacher._id]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FaUserCircle />
                          )}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800">{teacher.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{teacher.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-700">
                      {teacher.teacherProfile?.employeeId || "-"}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-700">
                        {teacher.teacherProfile?.department || "-"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {teacher.teacherProfile?.designation || "-"}
                        {teacher.teacherProfile?.specialization
                          ? ` · ${teacher.teacherProfile.specialization}`
                          : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {teacher.teacherProfile?.qualification || "-"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {teacher.teacherProfile?.phone || "-"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          teacher.status === "inactive"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {teacher.status || "active"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/teachers/${teacher._id}`)}
                          title="View teacher details"
                          aria-label={`View ${teacher.name} details`}
                          className="rounded-lg border border-slate-200 p-2 text-violet-600 hover:bg-violet-50"
                        >
                          <FaEye />
                        </button>
                        <button
                          type="button"
                          onClick={() => sendCredentials(teacher)}
                          disabled={teacher.status === "inactive"}
                          title="Send new login credentials"
                          aria-label={`Send login credentials to ${teacher.name}`}
                          className="rounded-lg border border-slate-200 p-2 text-indigo-600 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FaEnvelope />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditTeacher(teacher);
                            setModalOpen(true);
                          }}
                          title="Edit teacher"
                          aria-label={`Edit ${teacher.name}`}
                          className="rounded-lg border border-slate-200 p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(teacher)}
                          title={`Mark ${teacher.status === "inactive" ? "active" : "inactive"}`}
                          aria-label={`Mark ${teacher.name} ${teacher.status === "inactive" ? "active" : "inactive"}`}
                          className="rounded-lg border border-slate-200 p-2 text-amber-600 hover:bg-amber-50"
                        >
                          {teacher.status === "inactive" ? <FaToggleOff /> : <FaToggleOn />}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTeacher(teacher)}
                          title="Delete teacher"
                          aria-label={`Delete ${teacher.name}`}
                          className="rounded-lg border border-slate-200 p-2 text-rose-600 hover:bg-rose-50"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>
            Showing {total === 0 ? 0 : (page - 1) * 10 + 1}–
            {Math.min(page * 10, total)} of {total} teachers
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                setLoading(true);
                setPage((current) => current - 1);
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40"
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => {
                setLoading(true);
                setPage((current) => current + 1);
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </footer>
      </div>

      {modalOpen && (
        <TeacherFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={saveTeacher}
          teacher={editTeacher}
        />
      )}
      {importOpen && (
        <DataImportModal
          title="Teachers"
          endpoint="/teachers/import"
          columns={teacherImportColumns}
          requiredColumns={teacherImportRequiredColumns}
          sampleRow={teacherImportSample}
          onComplete={() => {
            setLoading(true);
            refreshList();
          }}
          onClose={() => setImportOpen(false)}
        />
      )}
    </section>
  );
}
