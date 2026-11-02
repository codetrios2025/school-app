import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaBell,
  FaBullhorn,
  FaEnvelope,
  FaPaperPlane,
  FaUsers,
  FaWhatsapp,
} from "react-icons/fa";
import toast from "react-hot-toast";
import API from "../services/api";

const initialForm = {
  title: "",
  message: "",
  target: "all_students",
  classId: "",
  recipientId: "",
};

const channelClass = (selected) =>
  `flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
    selected
      ? "border-indigo-300 bg-indigo-50/60"
      : "border-slate-200 bg-white hover:bg-slate-50"
  }`;

export default function NotificationPage() {
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";
  const [form, setForm] = useState(initialForm);
  const [classes, setClasses] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [channels, setChannels] = useState(["email"]);
  const [settings, setSettings] = useState({
    schoolName: "School",
    whatsappNotificationsEnabled: false,
    whatsappConfigured: false,
  });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [sending, setSending] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState(null);

  const classRequired = form.target === "class" || (!isAdmin && form.target === "individual");
  const selectedRecipient = useMemo(
    () => recipients.find((recipient) => recipient.id === form.recipientId),
    [recipients, form.recipientId],
  );
  const whatsappAvailable =
    settings.whatsappNotificationsEnabled && settings.whatsappConfigured;

  useEffect(() => {
    let active = true;
    Promise.all([
      API.get("/notifications/classes"),
      API.get("/school-settings"),
    ])
      .then(([classResponse, settingsResponse]) => {
        if (!active) return;
        setClasses(classResponse.data.data || []);
        setSettings({
          schoolName: settingsResponse.data.data?.schoolName || "School",
          whatsappNotificationsEnabled: Boolean(
            settingsResponse.data.data?.whatsappNotificationsEnabled,
          ),
          whatsappConfigured: Boolean(
            settingsResponse.data.data?.whatsappConfigured,
          ),
        });
        if (!isAdmin) {
          setForm((current) => ({ ...current, target: "class" }));
        }
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message ||
              "Unable to load notification settings and classes",
          );
        }
      })
      .finally(() => {
        if (active) setLoadingOptions(false);
      });
    return () => {
      active = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (form.target !== "individual" || (classRequired && !form.classId)) {
      return undefined;
    }
    let active = true;
    const timeoutId = setTimeout(() => {
      API.get("/notifications/recipients", {
        params: {
          ...(form.classId && { classId: form.classId }),
          search: recipientSearch,
        },
      })
        .then((response) => {
          if (!active) return;
          const options = response.data.data || [];
          setRecipients(options);
          setForm((current) =>
            current.recipientId &&
            options.some((recipient) => recipient.id === current.recipientId)
              ? current
              : { ...current, recipientId: "" },
          );
        })
        .catch((error) => {
          if (active) {
            setRecipients([]);
            toast.error(
              error.response?.data?.message ||
                "Unable to load notification recipients",
            );
          }
        })
        .finally(() => {
          if (active) setLoadingRecipients(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [form.target, form.classId, classRequired, recipientSearch]);

  const toggleChannel = (channel) => {
    setChannels((current) =>
      current.includes(channel)
        ? current.filter((value) => value !== channel)
        : [...current, channel],
    );
  };

  const send = async (event) => {
    event.preventDefault();
    if (sending) return;
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Add a notification title and message");
      return;
    }
    if (classRequired && !form.classId) {
      toast.error("Select a class");
      return;
    }
    if (form.target === "individual" && !form.recipientId) {
      toast.error("Select an individual recipient");
      return;
    }
    if (!channels.includes("email") && !channels.includes("whatsapp")) {
      toast.error("Select email or WhatsApp in addition to the dashboard");
      return;
    }

    setSending(true);
    setDeliveryResult(null);
    try {
      const response = await API.post("/notifications", {
        ...form,
        title: form.title.trim(),
        message: form.message.trim(),
        channels: ["inApp", ...channels],
      });
      setDeliveryResult(
        response.data.data?.deliverySummary
          ? {
              ...response.data.data.deliverySummary,
              channels: response.data.data.channels || [],
            }
          : null,
      );
      if (response.data.data?.deliverySummary?.email?.failed ||
          response.data.data?.deliverySummary?.whatsapp?.failed) {
        toast.error(response.data.message);
      } else {
        toast.success(response.data.message || "Notification sent");
      }
      setForm({
        ...initialForm,
        target: isAdmin ? initialForm.target : "class",
      });
      setChannels(["email"]);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to send notification",
      );
    } finally {
      setSending(false);
    }
  };

  if (loadingOptions) {
    return (
      <div className="rounded-xl bg-white p-10 text-center text-slate-500">
        Loading notification tools...
      </div>
    );
  }

  const targetOptions = isAdmin
    ? [
        ["all_students", "All students and their linked parents"],
        ["all_teachers", "All teachers"],
        ["class", "Students in one class"],
        ["individual", "One individual"],
      ]
    : [
        ["class", "All students in an assigned class"],
        ["individual", "One student in an assigned class"],
      ];

  return (
    <section className="w-full space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 data-page-title className="text-2xl font-bold text-slate-900">
            School communications
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Send a professional message to dashboards, parent email, and enabled WhatsApp contacts.
          </p>
        </div>
        <Link
          to="/notification-history"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          View sent history
        </Link>
      </header>

      <form onSubmit={send} className="space-y-5">
        <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FaBullhorn />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">Compose notification</h2>
              <p className="text-sm text-slate-500">
                Messages are saved to recipient dashboards even if an external channel is unavailable.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Audience
              <select
                value={form.target}
                onChange={(event) => {
                  const target = event.target.value;
                  setRecipients([]);
                  setRecipientSearch("");
                  setLoadingRecipients(target === "individual" && isAdmin);
                  setForm((current) => ({
                    ...current,
                    target,
                    classId: "",
                    recipientId: "",
                  }));
                }}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5"
              >
                {targetOptions.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            {classRequired && (
              <label className="block text-sm font-medium text-slate-700">
                Class and section
                <select
                  required
                  value={form.classId}
                  onChange={(event) => {
                    setRecipients([]);
                    setRecipientSearch("");
                    setLoadingRecipients(
                      form.target === "individual" && Boolean(event.target.value),
                    );
                    setForm((current) => ({
                      ...current,
                      classId: event.target.value,
                      recipientId: "",
                    }));
                  }}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5"
                >
                  <option value="">Select a class</option>
                  {classes.map((schoolClass) => (
                    <option key={schoolClass._id} value={schoolClass._id}>
                      {schoolClass.className} - {schoolClass.section}
                    </option>
                  ))}
                </select>
                {classes.length === 0 && (
                  <span className="mt-1 block text-xs text-amber-700">
                    No classes are available for your account.
                  </span>
                )}
              </label>
            )}

            {form.target === "individual" && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">
                  Search recipients
                  <input
                    type="search"
                    maxLength={100}
                    value={recipientSearch}
                    onChange={(event) => {
                      setRecipientSearch(event.target.value);
                      setRecipients([]);
                      setLoadingRecipients(true);
                    }}
                    placeholder="Search by name, email, admission number, or roll number"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5"
                  />
                </label>
                <label className="mt-3 block text-sm font-medium text-slate-700">
                  Individual recipient
                <select
                  required
                  value={form.recipientId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      recipientId: event.target.value,
                    }))
                  }
                  disabled={loadingRecipients || recipients.length === 0}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 disabled:bg-slate-50"
                >
                  <option value="">
                    {loadingRecipients ? "Loading recipients..." : "Select recipient"}
                  </option>
                  {recipients.map((recipient) => (
                    <option key={recipient.id} value={recipient.id}>
                      {recipient.name} · {recipient.role}
                      {recipient.detail ? ` · ${recipient.detail}` : ""}
                    </option>
                  ))}
                </select>
                </label>
                {selectedRecipient && (
                  <span className="mt-1 block text-xs text-slate-500">
                    The in-app notification is delivered to the selected {selectedRecipient.role}.
                  </span>
                )}
                {!loadingRecipients && !recipients.length && (
                  <span className="mt-1 block text-xs text-slate-500">
                    No recipients match this search.
                  </span>
                )}
              </div>
            )}

            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Subject
              <input
                required
                maxLength={160}
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="e.g. Fee submission reminder"
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Message
              <textarea
                required
                maxLength={10000}
                rows={7}
                value={form.message}
                onChange={(event) =>
                  setForm((current) => ({ ...current, message: event.target.value }))
                }
                placeholder="Write a clear message for your school community..."
                className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 px-3.5 py-2.5 leading-6"
              />
              <span className="mt-1 block text-right text-xs text-slate-400">
                {form.message.length}/10,000
              </span>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-900">Delivery channels</h2>
            <p className="mt-1 text-sm text-slate-500">
              In-app dashboard alerts are always included. Choose one or both external channels.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className={`${channelClass(true)} cursor-not-allowed`}>
              <input type="checkbox" checked readOnly className="mt-1 h-4 w-4 accent-indigo-600" />
              <span>
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <FaBell className="text-indigo-600" /> Dashboard
                </span>
                <span className="mt-1 block text-xs text-slate-500">Always included</span>
              </span>
            </div>
            <label className={channelClass(channels.includes("email"))}>
              <input
                type="checkbox"
                checked={channels.includes("email")}
                onChange={() => toggleChannel("email")}
                className="mt-1 h-4 w-4 accent-indigo-600"
              />
              <span>
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <FaEnvelope className="text-indigo-600" /> Email
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  School-branded email with contact information.
                </span>
              </span>
            </label>
            <label
              className={`${channelClass(channels.includes("whatsapp"))} ${
                whatsappAvailable ? "" : "cursor-not-allowed opacity-60"
              }`}
            >
              <input
                type="checkbox"
                checked={channels.includes("whatsapp")}
                disabled={!whatsappAvailable}
                onChange={() => toggleChannel("whatsapp")}
                className="mt-1 h-4 w-4 accent-emerald-600"
              />
              <span>
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <FaWhatsapp className="text-emerald-600" /> WhatsApp
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {whatsappAvailable
                    ? "Requires a valid international mobile number."
                    : "Disabled by school settings or Twilio is not configured."}
                </span>
              </span>
            </label>
          </div>
        </section>

        {deliveryResult && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Delivery summary</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {["email", "whatsapp"]
                .filter((channel) => deliveryResult.channels.includes(channel))
                .map((channel) => (
                <div key={channel} className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm font-semibold capitalize text-slate-800">{channel}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {deliveryResult[channel].sent} sent · {deliveryResult[channel].failed} failed · {deliveryResult[channel].unavailable} without contact
                  </p>
                </div>
                ))}
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Sending as <span className="font-semibold text-slate-700">{user?.name}</span> · {settings.schoolName}
          </p>
          <button
            type="submit"
            disabled={sending || loadingRecipients || (classRequired && !classes.length)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaPaperPlane /> {sending ? "Sending..." : "Send notification"}
          </button>
        </div>
      </form>

      {isAdmin && (
        <Link
          to="/school-settings"
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-900"
        >
          <FaUsers /> Configure school contact details and WhatsApp permissions
        </Link>
      )}
    </section>
  );
}
