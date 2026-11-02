import { useState } from "react";
import { FaDownload, FaFileImport, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import API from "../services/api";

const dateColumns = new Set(["dateOfBirth", "joiningDate"]);

const formatImportValue = (column, value) => {
  if (value instanceof Date && dateColumns.has(column)) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && dateColumns.has(column)) {
    const dateParts = XLSX.SSF.parse_date_code(value);
    if (!dateParts) return String(value);
    return `${dateParts.y}-${String(dateParts.m).padStart(2, "0")}-${String(dateParts.d).padStart(2, "0")}`;
  }
  return typeof value === "number" ? String(value) : value;
};

const setNestedValue = (target, path, value) => {
  const keys = path.split(".");
  let current = target;
  keys.slice(0, -1).forEach((key) => {
    if (!current[key]) current[key] = {};
    current = current[key];
  });
  current[keys[keys.length - 1]] = value;
};

export default function DataImportModal({
  title,
  endpoint,
  columns,
  requiredColumns,
  sampleRow,
  onComplete,
  onClose,
}) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([columns, sampleRow]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Import");
    XLSX.writeFile(workbook, `${title.toLowerCase()}-import-template.xlsx`);
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
            const value = formatImportValue(header, row[index]);
            if (value === "" || value === null || value === undefined) return;
            setNestedValue(record, header, value);
          });
          record.__rowNumber = rowNumber;
          return record;
        });
      if (!rows.length) throw new Error("The selected file contains no data rows");
      if (rows.length > 500) throw new Error("Import files are limited to 500 records");
      if (new Blob([JSON.stringify({ rows })]).size > 900 * 1024) {
        throw new Error("This import is too large; split it into smaller files");
      }

      const response = await API.post(endpoint, { rows });
      setResult(response.data.data);
      onComplete();
      if (response.data.data.failed) {
        toast.error(
          `Imported ${response.data.data.created + response.data.data.updated} records; ${response.data.data.failed} rows need attention`,
        );
      } else {
        toast.success(
          `Import complete: ${response.data.data.created} created, ${response.data.data.updated} updated`,
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Unable to import file",
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
        aria-labelledby="data-import-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id="data-import-title" className="text-xl font-bold text-slate-900">
              Import {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Existing records are matched by their ID number first, then by email. Empty optional cells are left unchanged.
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

        <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
          <p className="text-sm font-semibold text-slate-800">Before you import</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
            <li>Use the template headings exactly. Required columns:</li>
            <li>For student imports, use an existing class name and section.</li>
            <li>New accounts are created for new records; their login details are sent by email.</li>
            <li>Existing accounts are updated without resetting their password.</li>
          </ul>
          <details className="mt-2 text-sm text-slate-600">
            <summary className="cursor-pointer font-medium">Show required columns</summary>
            <p className="mt-1 break-words">{requiredColumns.join(", ")}</p>
          </details>
          <button
            type="button"
            onClick={downloadTemplate}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            <FaDownload /> Download template
          </button>
        </div>

        <form onSubmit={importFile} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Excel or CSV file
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
              {result.emailWarnings > 0 && (
                <p className="text-amber-700">
                  {result.emailWarnings} account email(s) could not be sent.
                </p>
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
              disabled={importing || !file}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaFileImport /> {importing ? "Importing..." : "Import records"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
