const fs = require("fs");
const path = require("path");
const SchoolSettings = require("../models/SchoolSettings");
const {
  removeUploadedFile,
  uploadDirectory,
} = require("../middleware/schoolLogoUpload");

const editableFields = [
  "schoolName",
  "email",
  "phone",
  "website",
  "address",
  "city",
  "state",
  "country",
  "postalCode",
  "mapUrl",
];

const removeStoredLogo = (filename) => {
  if (!filename || path.basename(filename) !== filename) return;
  fs.unlink(path.join(uploadDirectory, filename), (error) => {
    if (error && error.code !== "ENOENT") {
      console.error("Unable to remove replaced school logo:", error);
    }
  });
};

const serializeSettings = (settings) => {
  const data = settings?.toObject ? settings.toObject() : settings || {};
  if (data.logo) {
    data.logo = {
      originalName: data.logo.originalName,
      mimeType: data.logo.mimeType,
      size: data.logo.size,
    };
    data.logoUrl = "/school-settings/logo";
  } else {
    data.logo = null;
    data.logoUrl = null;
  }
  data.whatsappConfigured = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_NUMBER,
  );
  return data;
};

exports.getSchoolSettings = async (_req, res) => {
  try {
    const settings = await SchoolSettings.findOne({ key: "school" }).lean();
    return res.json({ success: true, data: serializeSettings(settings) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSchoolSettings = async (req, res) => {
  let logoSaved = false;
  try {
    const schoolName = String(req.body.schoolName || "").trim();
    if (!schoolName || schoolName.length > 120) {
      removeUploadedFile(req.file);
      return res.status(400).json({
        success: false,
        message: "School name is required and must be 120 characters or fewer",
      });
    }

    const updates = { schoolName };
    for (const field of editableFields.filter((name) => name !== "schoolName")) {
      if (req.body[field] !== undefined) {
        updates[field] = String(req.body[field]).trim();
      }
    }
    if (updates.email && !/^\S+@\S+\.\S+$/.test(updates.email)) {
      removeUploadedFile(req.file);
      return res.status(400).json({
        success: false,
        message: "Enter a valid school email address",
      });
    }
    for (const [field, label] of [
      ["mapUrl", "map"],
      ["website", "website"],
    ]) {
      if (!updates[field]) continue;
      try {
        const url = new URL(updates[field]);
        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Invalid URL protocol");
        }
      } catch {
        removeUploadedFile(req.file);
        return res.status(400).json({
          success: false,
          message: `Enter a valid HTTP or HTTPS ${label} URL`,
        });
      }
    }
    if (req.body.whatsappNotificationsEnabled !== undefined) {
      if (!["true", "false"].includes(req.body.whatsappNotificationsEnabled)) {
        removeUploadedFile(req.file);
        return res.status(400).json({
          success: false,
          message: "WhatsApp setting must be true or false",
        });
      }
      updates.whatsappNotificationsEnabled =
        req.body.whatsappNotificationsEnabled === "true";
      if (
        updates.whatsappNotificationsEnabled &&
        !(
          process.env.TWILIO_ACCOUNT_SID &&
          process.env.TWILIO_AUTH_TOKEN &&
          process.env.TWILIO_WHATSAPP_NUMBER
        )
      ) {
        removeUploadedFile(req.file);
        return res.status(400).json({
          success: false,
          message: "Configure Twilio credentials before enabling WhatsApp notifications",
        });
      }
    }

    const current = await SchoolSettings.findOne({ key: "school" });
    const previousLogo = current?.logo?.filename;
    if (req.file) {
      updates.logo = {
        originalName: path.basename(req.file.originalname.replace(/\\/g, "/")).slice(0, 255),
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
      };
    }
    const settings = await SchoolSettings.findOneAndUpdate(
      { key: "school" },
      { $set: updates },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    logoSaved = Boolean(req.file);
    if (req.file && previousLogo !== req.file.filename) {
      removeStoredLogo(previousLogo);
    }
    return res.json({ success: true, data: serializeSettings(settings) });
  } catch (error) {
    if (!logoSaved) removeUploadedFile(req.file);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSchoolLogo = async (_req, res) => {
  try {
    const settings = await SchoolSettings.findOne({ key: "school" })
      .select("logo.filename logo.mimeType")
      .lean();
    const filename = settings?.logo?.filename;
    if (!filename || path.basename(filename) !== filename) {
      return res.status(404).json({
        success: false,
        message: "School logo has not been configured",
      });
    }
    return res.sendFile(
      path.join(uploadDirectory, filename),
      {
        headers: {
          "Content-Type": settings.logo.mimeType,
          "Cache-Control": "private, no-store",
        },
      },
      (error) => {
        if (error && !res.headersSent) {
          res.status(error.code === "ENOENT" ? 404 : 500).json({
            success: false,
            message:
              error.code === "ENOENT"
                ? "School logo file is unavailable"
                : "Unable to load school logo",
          });
        }
      },
    );
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
