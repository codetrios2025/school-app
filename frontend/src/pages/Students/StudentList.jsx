import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaEdit,
  FaEye,
  FaFilter,
  FaFileImport,
  FaPlus,
  FaSearch,
  FaTrash,
  FaUserCircle,
  FaUsers,
} from "react-icons/fa";
import toast from "react-hot-toast";
import API from "../../services/api";
import DataImportModal from "../../components/DataImportModal";

const studentImportColumns = [
  "admissionNo", "name", "email", "className", "section", "rollNumber",
  "gender", "dateOfBirth", "bloodGroup", "fatherName", "motherName",
  "parentName", "parentEmail", "contactNumber", "fatherContactNumber",
  "motherContactNumber", "guardianName", "guardianRelation",
  "guardianContactNumber", "emergencyContactName", "emergencyContactNumber",
  "emergencyContactRelation", "address.line1", "address.line2",
  "address.country", "address.state", "address.district", "address.city",
  "address.pincode", "category", "religion", "nationality", "aadhaarNumber",
  "apaarId", "pen", "srnNumber", "familyId", "status",
];
const studentImportRequiredColumns = [
  "admissionNo", "name", "email", "className", "section", "rollNumber",
  "gender", "dateOfBirth", "fatherName", "motherName", "contactNumber",
  "emergencyContactName", "emergencyContactNumber", "emergencyContactRelation",
  "address.line1", "address.country", "address.state", "address.district",
  "address.city", "address.pincode",
];
const studentImportSample = [
  "ADM-1001", "Aarav Sharma", "aarav@example.com", "Class 1", "A", "1",
  "male", "2016-05-12", "A+", "Raj Sharma", "Neha Sharma", "Raj Sharma",
  "parent@example.com", "9876543210", "", "", "", "", "", "Raj Sharma",
  "9876543210", "Father", "12 Main Street", "", "India", "Delhi", "New Delhi",
  "Delhi", "New Delhi", "110001", "", "", "Indian", "", "", "", "", "active",
];

export default function StudentList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [gender, setGender] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [photoUrls, setPhotoUrls] = useState({});
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    let active = true;
    API.get("/classes", { params: { limit: 100 } })
      .then((response) => {
        if (active) setClasses(response.data.data || []);
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message || "Failed to load classes",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    API.get("/students", {
      params: {
        page,
        limit: 10,
        search,
        ...(classId && { classId }),
        ...(gender && { gender }),
        ...(status && { status }),
      },
    })
      .then((response) => {
        if (!active) return;
        setStudents(response.data.data || []);
        setTotal(response.data.total || 0);
        setActiveCount(response.data.activeCount || 0);
        setTotalPages(Math.max(1, response.data.totalPages || 1));
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message || "Failed to load students",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, search, classId, gender, status, refresh]);

  useEffect(() => {
    let active = true;
    const createdUrls = [];
    const studentsWithPhotos = students.filter((student) => student.photo);

    Promise.all(
      studentsWithPhotos.map(async (student) => {
        try {
          const response = await API.get(
            `/students/${student._id}/files/photo`,
            { responseType: "blob" },
          );
          const url = URL.createObjectURL(response.data);
          createdUrls.push(url);
          return [student._id, url];
        } catch {
          return [student._id, null];
        }
      }),
    ).then((entries) => {
      if (active) setPhotoUrls(Object.fromEntries(entries));
    });

    return () => {
      active = false;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [students]);

  const resetFilters = () => {
    setSearch("");
    setClassId("");
    setGender("");
    setStatus("");
    setPage(1);
  };

  const handleDelete = async (student) => {
    if (
      !window.confirm(
        `Delete ${student.userId?.name || "this student"} and their student account?`,
      )
    ) {
      return;
    }

    try {
      await API.delete(`/students/${student._id}`);
      toast.success("Student deleted");
      if (students.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        setLoading(true);
        const response = await API.get("/students", {
          params: {
            page,
            limit: 10,
            search,
            ...(classId && { classId }),
            ...(gender && { gender }),
            ...(status && { status }),
          },
        });
        setStudents(response.data.data || []);
        setTotal(response.data.total || 0);
        setActiveCount(response.data.activeCount || 0);
        setTotalPages(Math.max(1, response.data.totalPages || 1));
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      toast.error(error.response?.data?.message || "Failed to delete student");
    }
  };

  const handleStatusChange = async (student) => {
    const status = student.status === "inactive" ? "active" : "inactive";
    try {
      await API.patch(`/students/${student._id}/status`, { status });
      toast.success(`Student marked ${status}`);
      setLoading(true);
      setRefresh((current) => current + 1);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update student status",
      );
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 data-page-title className="text-2xl font-bold text-slate-900">Students</h1>
          <nav className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <Link to="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>›</span>
            <span className="text-blue-600">Students</span>
          </nav>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            <FaFileImport /> Import
          </button>
          <button
            type="button"
            onClick={() => navigate("/students/add-student")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <FaPlus /> Add Student
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
            <FaUsers />
          </span>
          <div>
            <p className="text-sm text-slate-500">Students matching filters</p>
            <p className="mt-0.5 text-2xl font-bold text-slate-900">{total}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
            <FaUsers />
          </span>
          <div>
            <p className="text-sm text-slate-500">Active students matching filters</p>
            <p className="mt-0.5 text-2xl font-bold text-slate-900">{activeCount}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-[220px] flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, admission no, email, or roll..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <FaFilter />
            <span className="sr-only">Class</span>
            <select
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
            >
              <option value="">All classes</option>
              {classes.map((schoolClass) => (
                <option key={schoolClass._id} value={schoolClass._id}>
                  {schoolClass.className} - {schoolClass.section}
                </option>
              ))}
            </select>
          </label>
          <select
            aria-label="Filter by gender"
            value={gender}
            onChange={(event) => {
              setGender(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
          >
            <option value="">All genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <select
            aria-label="Filter by status"
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
            onClick={resetFilters}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Admission No</th>
                <th className="px-4 py-3">Class / Section</th>
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3">Parent / Guardian</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                    Loading students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                    No students found. Try changing your filters or add a student.
                  </td>
                </tr>
              ) : (
                students.map((student, index) => (
                  <tr key={student._id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 text-slate-500">
                      {(page - 1) * 10 + index + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-2xl text-slate-400">
                        {photoUrls[student._id] ? (
                          <img
                            src={photoUrls[student._id]}
                            alt={`${student.userId?.name || "Student"} profile`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FaUserCircle aria-label="Default student photo" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800">
                        {student.userId?.name || "-"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {student.userId?.email || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {student.admissionNo || "-"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {student.classId
                        ? `${student.classId.className} - ${student.classId.section}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {student.rollNumber || "-"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {student.fatherName || student.parentName || "-"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {student.contactNumber || "-"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          student.status === "inactive"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {student.status || "active"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/students/${student._id}`)}
                          aria-label={`View ${student.userId?.name || "student"} details`}
                          title="View details"
                          className="rounded-lg border border-slate-200 p-2 text-indigo-600 hover:bg-indigo-50"
                        >
                          <FaEye />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student)}
                          aria-label={`Mark ${student.userId?.name || "student"} ${student.status === "inactive" ? "active" : "inactive"}`}
                          className={`rounded-lg border px-2.5 py-2 text-xs font-semibold ${
                            student.status === "inactive"
                              ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              : "border-amber-200 text-amber-700 hover:bg-amber-50"
                          }`}
                        >
                          Mark {student.status === "inactive" ? "active" : "inactive"}
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/students/${student._id}/edit`)}
                          aria-label={`Edit ${student.userId?.name || "student"}`}
                          className="rounded-lg border border-slate-200 p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(student)}
                          aria-label={`Delete ${student.userId?.name || "student"}`}
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
            Showing {total === 0 ? 0 : (page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total} students
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                setLoading(true);
                setPage((current) => current - 1);
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 py-2">Page {page} of {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => {
                setLoading(true);
                setPage((current) => current + 1);
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </footer>
      </div>
      {importOpen && (
        <DataImportModal
          title="Students"
          endpoint="/students/import"
          columns={studentImportColumns}
          requiredColumns={studentImportRequiredColumns}
          sampleRow={studentImportSample}
          onComplete={() => {
            setLoading(true);
            setRefresh((current) => current + 1);
          }}
          onClose={() => setImportOpen(false)}
        />
      )}
    </section>
  );
}
