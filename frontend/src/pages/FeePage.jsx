import { Fragment, useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  FaFileImport,
  FaMoneyBillWave,
  FaPlus,
  FaReceipt,
} from "react-icons/fa";
import toast from "react-hot-toast";
import API from "../services/api";
import FeeImportModal from "../components/FeeImportModal";

const methods = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "card", label: "Card" },
  { value: "online", label: "Online" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

const money = (amount, currency = "INR") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount || 0);

const feeStatus = {
  paid: "bg-emerald-100 text-emerald-700",
  partial: "bg-amber-100 text-amber-700",
  overdue: "bg-rose-100 text-rose-700",
  pending: "bg-slate-100 text-slate-700",
};

const initialFeeForm = () => ({
  studentId: "",
  title: "",
  academicYear: "",
  amount: "",
  dueDate: "",
  description: "",
});

export default function FeePage() {
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [paymentFee, setPaymentFee] = useState(null);
  const [reviewSubmission, setReviewSubmission] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [expandedFeeId, setExpandedFeeId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewStatusFilter, setReviewStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [feeForm, setFeeForm] = useState(initialFeeForm);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "cash",
    reference: "",
  });

  const fetchFees = useCallback(async () => {
    try {
      const response = await API.get("/fees", {
        params: {
          page,
          limit: 10,
          ...(statusFilter !== "all" && { status: statusFilter }),
          ...(reviewStatusFilter !== "all" && {
            reviewStatus: reviewStatusFilter,
          }),
          ...(classFilter && { classId: classFilter }),
          ...(academicYearFilter.trim() && {
            academicYear: academicYearFilter.trim(),
          }),
        },
      });
      setFees(response.data.data);
      setTotalPages(Math.max(1, response.data.totalPages));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load fees");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, reviewStatusFilter, classFilter, academicYearFilter]);

  useEffect(() => {
    let active = true;

    API.get("/fees", {
      params: {
        page,
        limit: 10,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(reviewStatusFilter !== "all" && {
          reviewStatus: reviewStatusFilter,
        }),
        ...(classFilter && { classId: classFilter }),
        ...(academicYearFilter.trim() && {
          academicYear: academicYearFilter.trim(),
        }),
      },
    })
      .then((response) => {
        if (!active) return;
        setFees(response.data.data);
        setTotalPages(Math.max(1, response.data.totalPages));
      })
      .catch((error) => {
        if (active) {
          toast.error(error.response?.data?.message || "Failed to load fees");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, statusFilter, reviewStatusFilter, classFilter, academicYearFilter]);

  useEffect(() => {
    if (!isAdmin) return;

    API.get("/students", { params: { page: 1, limit: 100 } })
      .then((response) => setStudents(response.data.data || []))
      .catch((error) => {
        toast.error(
          error.response?.data?.message || "Failed to load students",
        );
      });
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    API.get("/classes", { params: { page: 1, limit: 100 } })
      .then((response) => setClasses(response.data.data || []))
      .catch((error) => {
        toast.error(error.response?.data?.message || "Failed to load classes");
      });
  }, [isAdmin]);

  const submitFee = async (event) => {
    event.preventDefault();
    try {
      await API.post("/fees", feeForm);
      toast.success("Fee added successfully");
      setFeeModalOpen(false);
      setFeeForm(initialFeeForm());
      setLoading(true);
      setPage(1);
      if (page === 1) await fetchFees();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add fee");
    }
  };

  const openPaymentForm = (fee) => {
    setPaymentFee(fee);
    const pendingAmount = (fee.paymentSubmissions || [])
      .filter((submission) => submission.status === "pending")
      .reduce((sum, submission) => sum + Number(submission.amount || 0), 0);
    setPaymentForm({
      amount: Math.max(0, fee.balance - (isAdmin ? 0 : pendingAmount)).toFixed(2),
      method: "cash",
      reference: "",
    });
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    try {
      const isManualSubmission = !isAdmin;
      await API.post(
        `/fees/${paymentFee._id}/${isManualSubmission ? "submissions" : "payments"}`,
        paymentForm,
      );
      toast.success(
        isManualSubmission
          ? "Payment submitted for administrator review"
          : "Payment recorded successfully",
      );
      setPaymentFee(null);
      setLoading(true);
      await fetchFees();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to record payment");
    }
  };

  const reviewPayment = async (status) => {
    if (!reviewSubmission) return;
    if (status === "rejected" && !reviewNote.trim()) {
      toast.error("Add a reason before rejecting this payment");
      return;
    }
    try {
      await API.put(
        `/fees/${reviewSubmission.fee._id}/submissions/${reviewSubmission.submission._id}/review`,
        { status, reviewNote: reviewNote.trim() },
      );
      toast.success(`Payment submission ${status}`);
      setReviewSubmission(null);
      setReviewNote("");
      setLoading(true);
      await fetchFees();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to review payment");
    }
  };
  const paymentMaximum = paymentFee
    ? Math.max(
        0,
        paymentFee.balance -
          (isAdmin
            ? 0
            : (paymentFee.paymentSubmissions || [])
                .filter((submission) => submission.status === "pending")
                .reduce(
                  (sum, submission) => sum + Number(submission.amount || 0),
                  0,
                )),
      )
    : 0;

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 data-page-title className="text-2xl font-bold text-slate-900">Fee management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track fee charges, due dates, outstanding balances, and payments.
          </p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50"
            >
              <FaFileImport /> Import fees
            </button>
            <button
              type="button"
              onClick={() => setFeeModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <FaPlus /> Add fee
            </button>
          </div>
        )}
      </header>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <FaReceipt />
          </span>
          <div>
            <p className="font-semibold text-slate-800">Fee records</p>
            <p className="text-sm text-slate-500">
              {isAdmin
                ? "Filter charges, import fee schedules, and review manual payments."
                : "View fee balances and track submitted payments."}
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs font-medium text-slate-500">
            Fee status
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              value={statusFilter}
              onChange={(event) => {
                setLoading(true);
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="partial">Partially paid</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-500">
            Payment review
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              value={reviewStatusFilter}
              onChange={(event) => {
                setLoading(true);
                setReviewStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All submissions</option>
              <option value="pending">Awaiting review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          {isAdmin && (
            <label className="block text-xs font-medium text-slate-500">
              Class
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                value={classFilter}
                onChange={(event) => {
                  setLoading(true);
                  setClassFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All classes</option>
                {classes.map((schoolClass) => (
                  <option key={schoolClass._id} value={schoolClass._id}>
                    {schoolClass.className} - {schoolClass.section}
                  </option>
                ))}
              </select>
            </label>
          )}
          {isAdmin && (
            <label className="block text-xs font-medium text-slate-500">
              Academic year
              <input
                value={academicYearFilter}
                onChange={(event) => {
                  setLoading(true);
                  setAcademicYearFilter(event.target.value);
                  setPage(1);
                }}
                placeholder="e.g. 2026-2027"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
              />
            </label>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Fee</th>
                <th className="px-5 py-3">Academic year</th>
                <th className="px-5 py-3">Due date</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Paid</th>
                <th className="px-5 py-3">Outstanding</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Loading fee records...
                  </td>
                </tr>
              ) : fees.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    <FaMoneyBillWave className="mx-auto mb-2 text-xl text-slate-300" />
                    {statusFilter === "all"
                      ? "No fee records found."
                      : "No fee records match this status."}
                  </td>
                </tr>
              ) : (
                fees.map((fee) => {
                  const student = fee.studentId;
                  const submissions = fee.paymentSubmissions || [];
                  const pendingSubmissions = submissions.filter(
                    (submission) => submission.status === "pending",
                  );
                  const pendingAmount = pendingSubmissions.reduce(
                    (sum, submission) => sum + Number(submission.amount || 0),
                    0,
                  );
                  return (
                    <Fragment key={fee._id}>
                      <tr className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">
                            {student?.userId?.name || "Student"}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {student?.rollNumber || ""}
                            {student?.classId
                              ? ` · ${student.classId.className} - ${student.classId.section}`
                              : ""}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">
                            {fee.title}
                          </p>
                          {fee.description && (
                            <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">
                              {fee.description}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {fee.academicYear}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {new Date(fee.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-800">
                          {money(fee.amount, fee.currency)}
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-700">
                          {money(fee.paidAmount, fee.currency)}
                          {(fee.payments.length > 0 || submissions.length > 0) && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedFeeId(
                                  expandedFeeId === fee._id ? null : fee._id,
                                )
                              }
                              className="mt-1 block text-xs font-medium text-indigo-600 hover:text-indigo-800"
                            >
                              {expandedFeeId === fee._id
                                ? "Hide payment history"
                                : `View payment details (${fee.payments.length + submissions.length})`}
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {money(fee.balance, fee.currency)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${feeStatus[fee.status]}`}
                          >
                            {fee.status}
                          </span>
                          {pendingSubmissions.length > 0 && (
                            <span className="mt-1 block text-xs font-medium text-amber-700">
                              {pendingSubmissions.length} payment
                              {pendingSubmissions.length === 1 ? "" : "s"} awaiting review
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col items-start gap-1.5">
                            {isAdmin && pendingSubmissions.length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedFeeId(
                                    expandedFeeId === fee._id ? null : fee._id,
                                  )
                                }
                                className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                              >
                                Review {pendingSubmissions.length} submission
                                {pendingSubmissions.length === 1 ? "" : "s"}
                              </button>
                            )}
                            {isAdmin && fee.balance > 0 && (
                              <button
                                type="button"
                                onClick={() => openPaymentForm(fee)}
                                className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                              >
                                Record payment
                              </button>
                            )}
                            {!isAdmin && fee.balance > pendingAmount && (
                              <button
                                type="button"
                                onClick={() => openPaymentForm(fee)}
                                className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                              >
                                Submit payment
                              </button>
                            )}
                            {fee.balance <= 0 && (
                              <span className="text-xs text-slate-400">
                                Settled
                              </span>
                            )}
                            {!isAdmin &&
                              fee.balance > 0 &&
                              pendingAmount >= fee.balance && (
                                <span className="text-xs text-amber-700">
                                  Payment under review
                                </span>
                              )}
                          </div>
                        </td>
                      </tr>
                      {expandedFeeId === fee._id && (
                        <tr className="bg-slate-50">
                          <td
                            colSpan={9}
                            className="px-5 py-4"
                          >
                            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Confirmed payments
                            </h3>
                            <div className="space-y-2">
                              {fee.payments.map((payment) => (
                                <div
                                  key={payment._id}
                                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                >
                                  <div>
                                    <span className="font-semibold text-slate-800">
                                      {money(payment.amount, fee.currency)}
                                    </span>
                                    <span className="ml-2 capitalize text-slate-600">
                                      {payment.method.replace(/_/g, " ")}
                                    </span>
                                    {payment.reference && (
                                      <span className="ml-2 text-slate-500">
                                        Ref: {payment.reference}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-slate-500">
                                    {new Date(
                                      payment.receivedAt,
                                    ).toLocaleString()}
                                    {payment.receivedBy?.name
                                      ? ` · ${payment.receivedBy.name}`
                                      : ""}
                                  </span>
                                </div>
                              ))}
                              {fee.payments.length === 0 && (
                                <p className="text-sm text-slate-500">
                                  No confirmed payments yet.
                                </p>
                              )}
                            </div>
                            {submissions.length > 0 && (
                              <div className="mt-5 space-y-2">
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Manually submitted payments
                                </h3>
                                {submissions.map((submission) => (
                                  <div
                                    key={submission._id}
                                    className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
                                  >
                                    <div>
                                      <p className="font-semibold text-slate-800">
                                        {money(submission.amount, fee.currency)} ·{" "}
                                        <span className="capitalize">
                                          {submission.method.replace(/_/g, " ")}
                                        </span>
                                      </p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        Submitted by {submission.submittedBy?.name || "Student / parent"} ·{" "}
                                        {new Date(submission.submittedAt).toLocaleString()}
                                        {submission.reference
                                          ? ` · Ref: ${submission.reference}`
                                          : ""}
                                      </p>
                                      {submission.reviewNote && (
                                        <p className="mt-1 text-xs text-slate-600">
                                          Admin note: {submission.reviewNote}
                                        </p>
                                      )}
                                      {submission.reviewedAt && (
                                        <p className="mt-1 text-xs text-slate-400">
                                          Reviewed {new Date(submission.reviewedAt).toLocaleString()}
                                          {submission.reviewedBy?.name
                                            ? ` by ${submission.reviewedBy.name}`
                                            : ""}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                                          submission.status === "approved"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : submission.status === "rejected"
                                              ? "bg-rose-100 text-rose-700"
                                              : "bg-amber-100 text-amber-800"
                                        }`}
                                      >
                                        {submission.status}
                                      </span>
                                      {isAdmin && submission.status === "pending" && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReviewSubmission({ fee, submission });
                                            setReviewNote("");
                                          }}
                                          className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                                        >
                                          Review
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <footer className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                setLoading(true);
                setPage((current) => current - 1);
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => {
                setLoading(true);
                setPage((current) => current + 1);
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </footer>
      </div>

      {feeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form
            onSubmit={submitFee}
            className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900">Add fee</h2>
              <p className="mt-1 text-sm text-slate-500">
                Create a fee charge for an enrolled student.
              </p>
            </div>
            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Student
              <select
                required
                value={feeForm.studentId}
                onChange={(event) =>
                  setFeeForm({ ...feeForm, studentId: event.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.userId?.name} · {student.rollNumber}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                Fee name
                <input
                  required
                  maxLength={100}
                  value={feeForm.title}
                  onChange={(event) =>
                    setFeeForm({ ...feeForm, title: event.target.value })
                  }
                  placeholder="e.g. Term 1 tuition"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
                />
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                Academic year
                <input
                  required
                  maxLength={20}
                  value={feeForm.academicYear}
                  onChange={(event) =>
                    setFeeForm({ ...feeForm, academicYear: event.target.value })
                  }
                  placeholder="e.g. 2026-2027"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
                />
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                Amount (INR)
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={feeForm.amount}
                  onChange={(event) =>
                    setFeeForm({ ...feeForm, amount: event.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
                />
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                Due date
                <input
                  required
                  type="date"
                  value={feeForm.dueDate}
                  onChange={(event) =>
                    setFeeForm({ ...feeForm, dueDate: event.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
                />
              </label>
            </div>
            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Description <span className="font-normal text-slate-400">Optional</span>
              <textarea
                rows={3}
                maxLength={1000}
                value={feeForm.description}
                onChange={(event) =>
                  setFeeForm({ ...feeForm, description: event.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
              />
            </label>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setFeeModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Save fee
              </button>
            </div>
          </form>
        </div>
      )}

      {importOpen && (
        <FeeImportModal
          classes={classes}
          onClose={() => setImportOpen(false)}
          onComplete={async () => {
            setImportOpen(false);
            setLoading(true);
            setPage(1);
            await fetchFees();
          }}
        />
      )}

      {paymentFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form
            onSubmit={submitPayment}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isAdmin ? "Record payment" : "Submit manual payment"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {paymentFee.title} · Available{" "}
                {money(paymentMaximum, paymentFee.currency)}
              </p>
              {!isAdmin && (
                <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  Your payment details will be sent to the school administrator for verification. The fee balance changes only after approval.
                </p>
              )}
            </div>
            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Payment amount
              <input
                required
                type="number"
                min="0.01"
                max={paymentMaximum}
                step="0.01"
                value={paymentForm.amount}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, amount: event.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
              />
            </label>
            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Payment method
              <select
                value={paymentForm.method}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, method: event.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
              >
                {methods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Reference <span className="font-normal text-slate-400">Optional</span>
              <input
                maxLength={100}
                value={paymentForm.reference}
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    reference: event.target.value,
                  })
                }
                placeholder="Receipt, cheque, or transaction number"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
              />
            </label>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setPaymentFee(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                {isAdmin ? "Save payment" : "Submit for review"}
              </button>
            </div>
          </form>
        </div>
      )}

      {reviewSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-payment-title"
            className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <div>
              <h2 id="review-payment-title" className="text-xl font-bold text-slate-900">
                Review manual payment
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {reviewSubmission.fee.title} ·{" "}
                {money(reviewSubmission.submission.amount, reviewSubmission.fee.currency)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p>
                <span className="font-semibold">Student:</span>{" "}
                {reviewSubmission.fee.studentId?.userId?.name || "Student"}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Method:</span>{" "}
                {reviewSubmission.submission.method.replace(/_/g, " ")}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Submitted:</span>{" "}
                {new Date(reviewSubmission.submission.submittedAt).toLocaleString()}
              </p>
              {reviewSubmission.submission.reference && (
                <p className="mt-1">
                  <span className="font-semibold">Reference:</span>{" "}
                  {reviewSubmission.submission.reference}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Approving records this amount as a confirmed payment and updates the student/parent fee balance.
              </p>
            </div>
            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Admin review note
              <textarea
                rows={3}
                maxLength={500}
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                placeholder="Required when rejecting; visible to the student and parent."
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
              />
            </label>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setReviewSubmission(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => reviewPayment("rejected")}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => reviewPayment("approved")}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Approve payment
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
