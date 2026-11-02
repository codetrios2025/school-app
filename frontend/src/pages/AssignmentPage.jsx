import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import API from "../services/api";
import { FaEdit, FaPlus, FaSearch, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import AssignmentModal from "../components/AssignmentModal";

const classLabel = (schoolClass) =>
  `${schoolClass.className} - ${schoolClass.section}`;
const pageSize = 10;
const classPageSize = 8;

export default function AssignmentPage() {
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const [classTeacherFilter, setClassTeacherFilter] = useState("");
  const [classPage, setClassPage] = useState(1);
  const [search, setSearch] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingClassTeacher, setSavingClassTeacher] = useState(false);

  useEffect(() => {
    let active = true;
    const optionRequests = [
      API.get("/classes", { params: { page: 1, limit: 100 } }),
      API.get("/subjects", { params: { limit: 100 } }),
    ];
    if (isAdmin) {
      optionRequests.push(
        API.get("/teachers", {
          params: { page: 1, limit: 100, status: "active" },
        }),
      );
    }

    Promise.all(optionRequests)
      .then(([classResponse, subjectResponse, teacherResponse]) => {
        if (!active) return;
        setClasses(classResponse.data.data || []);
        setSubjects(subjectResponse.data.data || []);
        if (isAdmin) setTeachers(teacherResponse.data.data || []);
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message ||
              "Failed to load assignment options",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    let active = true;
    API.get("/assignments", {
      params: {
        page,
        limit: pageSize,
        search,
        ...(teacherFilter && { teacherId: teacherFilter }),
        ...(classFilter && { classId: classFilter }),
        ...(subjectFilter && { subjectId: subjectFilter }),
      },
    })
      .then((response) => {
        if (!active) return;
        setAssignments(response.data.data || []);
        setTotal(response.data.total || 0);
        setTotalPages(Math.max(1, response.data.totalPages || 1));
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message ||
              "Failed to load teacher assignments",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, search, teacherFilter, classFilter, subjectFilter, refresh]);

  const resetAssignmentFilters = () => {
    setSearch("");
    setTeacherFilter("");
    setClassFilter("");
    setSubjectFilter("");
    setPage(1);
  };

  const openCreateModal = () => {
    setEditAssignment(null);
    setModalOpen(true);
  };

  const handleSubmit = async (form) => {
    try {
      if (editAssignment) {
        const response = await API.put(
          `/assignments/${editAssignment._id}`,
          {
            teacherId: form.teacherId,
            classId: form.classId,
            subjectId: form.subjectId,
            description: form.description,
          },
        );
        if (response.data.emailSent === false) {
          toast.error(response.data.message);
        } else {
          toast.success(response.data.message);
        }
      } else {
        const response = await API.post("/assignments", form);
        if (response.data.emailSent === false) {
          toast.error(response.data.message);
        } else {
          toast.success(response.data.message);
        }
      }

      setModalOpen(false);
      setEditAssignment(null);
      setRefresh((value) => value + 1);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          `Unable to ${editAssignment ? "update" : "save"} subject assignment`,
      );
    }
  };

  const updateClassTeacher = async (classId, teacherId) => {
    const response = await API.patch(`/classes/${classId}/class-teacher`, {
      teacherId: teacherId || null,
    });
    setClasses((current) =>
      current.map((schoolClass) =>
        schoolClass._id === classId ? response.data.data : schoolClass,
      ),
    );
    return response.data.data;
  };

  const handleClassTeacherSave = async (event) => {
    event.preventDefault();
    if (!selectedClassId) {
      toast.error("Select a class");
      return;
    }

    setSavingClassTeacher(true);
    try {
      await updateClassTeacher(selectedClassId, selectedTeacherId);
      toast.success(
        selectedTeacherId
          ? "Class teacher assignment saved"
          : "Class teacher assignment removed",
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update class teacher",
      );
    } finally {
      setSavingClassTeacher(false);
    }
  };

  const editClassTeacher = (schoolClass) => {
    setSelectedClassId(schoolClass._id);
    setSelectedTeacherId(schoolClass.classTeacherId?._id || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeClassTeacher = async (schoolClass) => {
    if (!schoolClass.classTeacherId) return;
    if (
      !window.confirm(
        `Remove ${schoolClass.classTeacherId.name} as class teacher for ${classLabel(schoolClass)}?`,
      )
    ) {
      return;
    }
    try {
      const updatedClass = await updateClassTeacher(schoolClass._id, "");
      if (selectedClassId === schoolClass._id) setSelectedTeacherId("");
      toast.success(`Class teacher removed from ${classLabel(updatedClass)}`);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to remove class teacher",
      );
    }
  };

  const handleDelete = async (assignment) => {
    if (
      !window.confirm(
        `Remove ${assignment.subjectId?.name || "this subject"} from ${
          assignment.teacherId?.name || "the teacher"
        }?`,
      )
    ) {
      return;
    }

    try {
      await API.delete(`/assignments/${assignment._id}`);
      toast.success("Subject assignment removed");
      if (assignments.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        setRefresh((value) => value + 1);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to remove subject assignment",
      );
    }
  };

  const handleEdit = (assignment) => {
    setEditAssignment(assignment);
    setModalOpen(true);
  };

  const handleClassChange = (classId) => {
    setSelectedClassId(classId);
    const schoolClass = classes.find((item) => item._id === classId);
    setSelectedTeacherId(schoolClass?.classTeacherId?._id || "");
  };

  const selectedClass = classes.find(
    (schoolClass) => schoolClass._id === selectedClassId,
  );
  const filteredClasses = classes.filter((schoolClass) => {
    const query = classSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      classLabel(schoolClass).toLowerCase().includes(query) ||
      schoolClass.classTeacherId?.name?.toLowerCase().includes(query);
    const matchesTeacher =
      !classTeacherFilter ||
      (classTeacherFilter === "unassigned"
        ? !schoolClass.classTeacherId
        : schoolClass.classTeacherId?._id === classTeacherFilter);
    return matchesSearch && matchesTeacher;
  });
  const classTotalPages = Math.max(
    1,
    Math.ceil(filteredClasses.length / classPageSize),
  );
  const visibleClasses = filteredClasses.slice(
    (classPage - 1) * classPageSize,
    classPage * classPageSize,
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 data-page-title className="text-2xl font-bold text-slate-900">
            Teacher assignments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage class teachers and subject teaching allocations.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <FaPlus /> Assign subjects
          </button>
        )}
      </header>

      {isAdmin && (
        <section className="space-y-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div>
            <h2 className="font-semibold text-slate-900">
              Class teacher assignment
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Assign a class teacher to each class. A teacher can be assigned to
              multiple classes.
            </p>
          </div>
          <form
            onSubmit={handleClassTeacherSave}
            className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
          >
            <label className="block text-sm font-medium text-slate-700">
              Class
              <select
                required
                value={selectedClassId}
                onChange={(event) => handleClassChange(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">Select class</option>
                {classes.map((schoolClass) => (
                  <option key={schoolClass._id} value={schoolClass._id}>
                    {classLabel(schoolClass)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Class teacher
              <select
                value={selectedTeacherId}
                onChange={(event) => setSelectedTeacherId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">No class teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={!selectedClassId || savingClassTeacher}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingClassTeacher
                  ? "Saving..."
                  : selectedClass?.classTeacherId
                    ? "Update"
                    : "Assign"}
              </button>
              {selectedClass?.classTeacherId && (
                <button
                  type="button"
                  onClick={() => setSelectedTeacherId("")}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <label className="relative min-w-[220px] flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={classSearch}
                onChange={(event) => {
                  setClassSearch(event.target.value);
                  setClassPage(1);
                }}
                placeholder="Search class or class teacher..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm"
              />
            </label>
            <select
              aria-label="Filter class teacher assignments"
              value={classTeacherFilter}
              onChange={(event) => {
                setClassTeacherFilter(event.target.value);
                setClassPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">All class teacher statuses</option>
              <option value="unassigned">Unassigned</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Class teacher</th>
                  <th className="px-4 py-3">Employee ID</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleClasses.map((schoolClass) => (
                  <tr key={schoolClass._id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {classLabel(schoolClass)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {schoolClass.classTeacherId?.name || "Not assigned"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {schoolClass.classTeacherId?.teacherProfile?.employeeId || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => editClassTeacher(schoolClass)}
                          title="Edit class teacher"
                          aria-label={`Edit class teacher for ${classLabel(schoolClass)}`}
                          className="rounded-lg border border-slate-200 p-2 text-indigo-600 hover:bg-indigo-50"
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          disabled={!schoolClass.classTeacherId}
                          onClick={() => removeClassTeacher(schoolClass)}
                          title="Remove class teacher"
                          aria-label={`Remove class teacher from ${classLabel(schoolClass)}`}
                          className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleClasses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No classes match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <span>
              Showing{" "}
              {filteredClasses.length
                ? (classPage - 1) * classPageSize + 1
                : 0}
              –{Math.min(classPage * classPageSize, filteredClasses.length)} of{" "}
              {filteredClasses.length} classes
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={classPage <= 1}
                onClick={() => setClassPage((current) => current - 1)}
                className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {classPage} of {classTotalPages}
              </span>
              <button
                type="button"
                disabled={classPage >= classTotalPages}
                onClick={() => setClassPage((current) => current + 1)}
                className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </footer>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Subject allocations</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search, filter, edit, or remove subject assignments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <label className="relative min-w-[220px] flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search teacher, class, subject..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm"
            />
          </label>
          {isAdmin && (
            <select
              aria-label="Filter by teacher"
              value={teacherFilter}
              onChange={(event) => {
                setTeacherFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">All teachers</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Filter by class"
            value={classFilter}
            onChange={(event) => {
              setClassFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">All classes</option>
            {classes.map((schoolClass) => (
              <option key={schoolClass._id} value={schoolClass._id}>
                {classLabel(schoolClass)}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by subject"
            value={subjectFilter}
            onChange={(event) => {
              setSubjectFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={resetAssignmentFilters}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Teacher</th>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Assigned</th>
                {isAdmin && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    Loading subject allocations...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No subject allocations match your filters.
                  </td>
                </tr>
              ) : (
                assignments.map((assignment) => (
                  <tr key={assignment._id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {assignment.teacherId?.name || "Teacher"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {assignment.classId
                        ? classLabel(assignment.classId)
                        : "Class unavailable"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {assignment.subjectId?.name || "Subject unavailable"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(assignment.createdAt).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(assignment)}
                            title="Edit subject assignment"
                            aria-label={`Edit ${assignment.subjectId?.name || "subject"} assignment`}
                            className="rounded-lg border border-slate-200 p-2 text-indigo-600 hover:bg-indigo-50"
                          >
                            <FaEdit />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(assignment)}
                            aria-label="Remove subject assignment"
                            title="Remove subject assignment"
                            className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
          <span>
            Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, total)} of {total} subject allocations
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-slate-200 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-slate-200 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </footer>
      </section>

      {isAdmin && modalOpen && (
        <AssignmentModal
          key={editAssignment?._id || "new-assignment"}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditAssignment(null);
          }}
          onSubmit={handleSubmit}
          teachers={teachers}
          classes={classes}
          subjects={subjects}
          assignment={editAssignment}
        />
      )}
    </section>
  );
}
