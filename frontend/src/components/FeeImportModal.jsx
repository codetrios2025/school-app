import { useState } from "react";
import { FaDownload, FaFileImport, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import API from "../services/api";

const columns = [
  "admissionNo",
  "rollNumber",
  "studentEmail",
  "title",
  "academicYear",
  "amount",
  "dueDate",
  "currency",
  "description",
];

const sampleRow = [
  "ADM-001",
  "1",
  "student@example.com",
  "Tuition fee",
  "2026-2027",
  5000,
  "2026-11-30",
  "INR",
  "Term 1 tuition",
];

const readDate = (value) => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
    }
  }
  return value;
};

export default function FeeImportModal({ classes, onComplete, onClose }) {
  const [scope, setScope] = useState("all");
  const [classId, setClassId] = useState("");
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([columns, sampleRow]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fees");
    XLSX.writeFile(workbook, "school-fees-import-template.xlsx");
  };

  const importFile = async (event) => {
    event.preventDefault();
    if (!file) {
      toast.error("Choose an Excel or CSV file first");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Import files must be 5 MB or smaller");
      return;
    }
    if (scope === "class" && !classId) {
      toast.error("Select a class for class-wise import");
      return;
    }

    setImporting(true);
    setResult(null);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: "array",
        cellDates: true,
      });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!worksheet) throw new Error("The selected file has no worksheet");
      const [headerRow, ...dataRows] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        raw: true,
      });
      const headers = (headerRow || []).map((value) => String(value).trim());
      const requiredColumns = [
        "title",
        "academicYear",
        "amount",
        "dueDate",
      ];
      const missingHeaders = requiredColumns.filter(
        (column) => !headers.includes(column),
      );
      if (missingHeaders.length) {
        throw new Error(`Missing required columns: ${missingHeaders.join(", ")}`);
      }

      const rows = dataRows
        .map((row, index) => ({ row, rowNumber: index + 2 }))
        .filter(({ row }) => row.some((value) => value !== "" && value !== null))
        .map(({ row, rowNumber }) => {
          const record = {};
          headers.forEach((header, index) => {
            if (!columns.includes(header)) return;
            const value = header === "dueDate" ? readDate(row[index]) : row[index];
            if (value === "" || value === null || value === undefined) return;
            record[header] = String(value).trim();
          });
          record.__rowNumber = rowNumber;
          return record;
        });
      if (!rows.length) throw new Error("The selected file contains no data rows");
      if (rows.length > 500) throw new Error("Imports are limited to 500 spreadsheet rows");
      if (new Blob([JSON.stringify({ rows })]).size > 900 * 1024) {
        throw new Error("This import is too large; split it into smaller files");
      }

      const response = await API.post("/fees/import", {
        rows,
        ...(scope === "class" && { classId }),
      });
      setResult(response.data.data);
      if (response.data.data.failed) {
        toast.error(
          `Imported ${response.data.data.created} new and ${response.data.data.updated} updated fee records; ${response.data.data.failed} rows need attention`,
        );
      } else {
        toast.success(
          `Import complete: ${response.data.data.created} created, ${response.data.data.updated} updated`,
        );
      }
      onComplete();
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Unable to import fees",
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="fee-import-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id="fee-import-title" className="text-xl font-bold text-slate-900">
              Import student fees
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload fee charges for individual students or apply a fee row to a whole class.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close import dialog"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <FaTimes />
          </button>
        </header>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Import scope
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5"
            >
              <option value="all">All school students (identify each student)</option>
              <option value="class">Class-wise</option>
            </select>
          </label>
          {scope === "class" && (
            <label className="block text-sm font-medium text-slate-700">
              Class and section
              <select
                required
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5"
              >
                <option value="">Select class</option>
                {classes.map((schoolClass) => (
                  <option key={schoolClass._id} value={schoolClass._id}>
                    {schoolClass.className} - {schoolClass.section}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
          <p className="text-sm font-semibold text-slate-800">Spreadsheet format</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Required columns: <code>title</code>, <code>academicYear</code>, <code>amount</code>, <code>dueDate</code>.
            Identify students with <code>admissionNo</code>, <code>rollNumber</code>, or <code>studentEmail</code>.
            For class-wide import, leave all three student columns blank to apply each fee row to every active student in that class.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Matching fee title and academic year updates an unpaid fee record. Records with payments or pending reviews are protected from import changes.
          </p>
          <button
            type="button"
            onClick={downloadTemplate}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            <FaDownload /> Download Excel template
          </button>
        </div>

        <form onSubmit={importFile} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Excel or CSV file (max 500 rows, 5 MB)
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setResult(null);
              }}
              className="mt-2 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold"
            />
          </label>

          {result && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-800">
                {result.created} created · {result.updated} updated · {result.failed} failed
              </p>
              {result.errors?.length > 0 && (
                <ul className="max-h-36 space-y-1 overflow-y-auto text-rose-700">
                  {result.errors.map((item) => (
                    <li key={`${item.row}-${item.message}`}>
                      Row {item.row}: {item.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <footer className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={importing || !file || (scope === "class" && !classId)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaFileImport /> {importing ? "Importing..." : "Import fees"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
