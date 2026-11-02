import { useEffect, useRef, useState } from "react";
import { FaCamera, FaMapMarkerAlt, FaSave, FaSchool } from "react-icons/fa";
import toast from "react-hot-toast";
import API from "../services/api";

const initialForm = {
  schoolName: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  mapUrl: "",
  whatsappNotificationsEnabled: false,
};

const fields = [
  ["schoolName", "School name", true],
  ["email", "Contact email"],
  ["phone", "Contact phone"],
  ["website", "Website"],
  ["address", "Street address"],
  ["city", "City"],
  ["state", "State / province"],
  ["country", "Country"],
  ["postalCode", "Postal code"],
  ["mapUrl", "Map location URL"],
];

export default function SchoolSettingsPage() {
  const [form, setForm] = useState(initialForm);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [hasLogo, setHasLogo] = useState(false);
  const [whatsappConfigured, setWhatsappConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const previewRef = useRef("");

  useEffect(() => {
    let active = true;
    let loadedLogoUrl = "";
    const loadSettings = async () => {
      try {
        const response = await API.get("/school-settings");
        const settings = response.data.data || {};
        if (!active) return;
        setForm({
          ...initialForm,
          ...Object.fromEntries(
            Object.keys(initialForm).map((field) => [
              field,
              field === "whatsappNotificationsEnabled"
                ? Boolean(settings[field])
                : settings[field] || "",
            ]),
          ),
        });
        setHasLogo(Boolean(settings.logoUrl));
        setWhatsappConfigured(Boolean(settings.whatsappConfigured));
        if (settings.logoUrl) {
          try {
            const logoResponse = await API.get(settings.logoUrl, {
              responseType: "blob",
            });
            loadedLogoUrl = URL.createObjectURL(logoResponse.data);
            if (active) {
              previewRef.current = loadedLogoUrl;
              setLogoPreview(loadedLogoUrl);
            }
          } catch (error) {
            if (active) {
              toast.error(
                error.response?.data?.message || "Unable to load the school logo",
              );
            }
          }
        }
      } catch (error) {
        if (active) {
          toast.error(
            error.response?.data?.message || "Unable to load school settings",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadSettings();
    return () => {
      active = false;
      if (loadedLogoUrl) URL.revokeObjectURL(loadedLogoUrl);
    };
  }, []);

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  const selectLogo = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      toast.error("Choose a JPG, PNG, or WebP logo up to 2 MB");
      return;
    }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const preview = URL.createObjectURL(file);
    previewRef.current = preview;
    setLogoPreview(preview);
    setLogoFile(file);
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        payload.append(key, String(value));
      });
      if (logoFile) payload.append("logo", logoFile);
      const response = await API.put("/school-settings", payload);
      setForm((current) => ({
        ...current,
        ...Object.fromEntries(
          Object.keys(initialForm).map((key) => [
            key,
            key === "whatsappNotificationsEnabled"
              ? Boolean(response.data.data[key])
              : response.data.data[key] || "",
          ]),
        ),
      }));
      setHasLogo(Boolean(response.data.data.logoUrl));
      setWhatsappConfigured(Boolean(response.data.data.whatsappConfigured));
      setLogoFile(null);
      toast.success("School settings saved");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to save school settings",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-10 text-center text-slate-500">
        Loading school settings...
      </div>
    );
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <section className="w-full space-y-6">
      <header>
        <h1 data-page-title className="text-2xl font-bold text-slate-900">School profile & settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure the school identity and contact information used in branded parent notifications.
        </p>
      </header>

      <form onSubmit={saveSettings} className="space-y-6">
        <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <FaSchool />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">School identity</h2>
              <p className="text-sm text-slate-500">The name and logo appear on school email notices.</p>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center">
              <span className="flex h-24 w-full items-center justify-center overflow-hidden rounded-lg bg-white">
                {logoPreview ? (
                  <img src={logoPreview} alt="School logo preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <FaSchool className="text-4xl text-slate-300" />
                )}
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700">
                <FaCamera /> {hasLogo ? "Change logo" : "Upload logo"}
              </span>
              <span className="text-xs text-slate-500">JPG, PNG, WebP · Max 2 MB</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={selectLogo}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.slice(0, 4).map(([field, label, required]) => (
                <label key={field} className="block text-sm font-medium text-slate-700">
                  {label}{required && <span className="ml-1 text-rose-500">*</span>}
                  <input
                    required={required}
                    maxLength={field === "schoolName" ? 120 : 300}
                    type={field === "email" ? "email" : field === "website" ? "url" : "text"}
                    value={form[field]}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, [field]: event.target.value }))
                    }
                    className={inputClass}
                  />
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <FaMapMarkerAlt />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">Contact & location</h2>
              <p className="text-sm text-slate-500">Contact details are added to notification email footers.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.slice(4).map(([field, label]) => (
              <label key={field} className="block text-sm font-medium text-slate-700 sm:last:col-span-2">
                {label}
                <input
                  maxLength={field === "mapUrl" ? 1000 : 500}
                  type={field === "mapUrl" ? "url" : "text"}
                  value={form[field]}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [field]: event.target.value }))
                  }
                  placeholder={field === "mapUrl" ? "https://maps.google.com/..." : ""}
                  className={inputClass}
                />
              </label>
            ))}
          </div>
          {form.mapUrl && (
            <a
              href={form.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Open configured school location
            </a>
          )}
        </section>

        <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Messaging channels</h2>
          <label className="mt-4 flex items-start gap-3">
            <input
              type="checkbox"
              checked={form.whatsappNotificationsEnabled}
              disabled={!whatsappConfigured && !form.whatsappNotificationsEnabled}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  whatsappNotificationsEnabled: event.target.checked,
                }))
              }
              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">
                Allow WhatsApp notifications
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                {!whatsappConfigured
                  ? "Twilio credentials are not configured on the server. Add them before enabling live WhatsApp delivery."
                  : "When enabled, authorized staff may select WhatsApp as an additional delivery channel. Recipients need a valid international phone number."}
              </span>
            </span>
          </label>
          {!whatsappConfigured && form.whatsappNotificationsEnabled && (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              WhatsApp cannot be enabled until the server has Twilio account credentials configured.
            </p>
          )}
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <FaSave /> {saving ? "Saving..." : "Save school settings"}
          </button>
        </div>
      </form>
    </section>
  );
}
