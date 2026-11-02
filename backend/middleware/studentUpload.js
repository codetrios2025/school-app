const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const uploadDirectory = path.join(__dirname, "..", "storage", "students");
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) =>
    callback(null, uploadDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 9 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const validType = allowedTypes[extension] === file.mimetype;
    const validField =
      file.fieldname === "photo"
        ? [".jpg", ".jpeg", ".png", ".webp"].includes(extension)
        : file.fieldname === "documents";

    if (!validType || !validField) {
      return callback(
        new Error("Only JPG, PNG, WebP, and PDF files are allowed"),
      );
    }

    callback(null, true);
  },
}).fields([
  { name: "photo", maxCount: 1 },
  { name: "documents", maxCount: 8 },
]);

const removeUploadedFiles = (files = {}) => {
  Object.values(files)
    .flat()
    .forEach((file) => {
      fs.unlink(file.path, (error) => {
        if (error && error.code !== "ENOENT") {
          console.error("Unable to remove rejected student upload:", error);
        }
      });
    });
};

module.exports = (req, res, next) => {
  upload(req, res, (error) => {
    if (error) {
      removeUploadedFiles(req.files);
      const message =
        error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
          ? "Each uploaded file must be 5 MB or smaller"
          : error.message;
      return res.status(400).json({ success: false, message });
    }

    const photo = req.files?.photo?.[0];
    if (photo && photo.size > 2 * 1024 * 1024) {
      removeUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: "Student photo must be 2 MB or smaller",
      });
    }

    next();
  });
};

module.exports.parseStudentData = (req, res, next) => {
  try {
    if (!req.body.studentData) {
      removeUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: "Student details are required",
      });
    }

    req.body = JSON.parse(req.body.studentData);
    next();
  } catch {
    removeUploadedFiles(req.files);
    return res.status(400).json({
      success: false,
      message: "Student details must be valid JSON",
    });
  }
};

module.exports.removeUploadedFiles = removeUploadedFiles;
module.exports.uploadDirectory = uploadDirectory;
