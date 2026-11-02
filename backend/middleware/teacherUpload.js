const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const uploadDirectory = path.join(__dirname, "..", "storage", "teachers");
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) =>
      callback(null, uploadDirectory),
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${crypto.randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedTypes[extension] !== file.mimetype) {
      return callback(
        new Error("Teacher photo must be a JPG, PNG, or WebP image"),
      );
    }
    callback(null, true);
  },
});

const removeUploadedFile = (file) => {
  if (!file?.path) return;
  fs.unlink(file.path, (error) => {
    if (error && error.code !== "ENOENT") {
      console.error("Unable to remove rejected teacher photo:", error);
    }
  });
};

module.exports = (req, res, next) => {
  upload.single("photo")(req, res, (error) => {
    if (error) {
      removeUploadedFile(req.file);
      return res.status(400).json({
        success: false,
        message:
          error instanceof multer.MulterError &&
          error.code === "LIMIT_FILE_SIZE"
            ? "Teacher photo must be 2 MB or smaller"
            : error.message,
      });
    }

    try {
      if (!req.body.teacherData) {
        removeUploadedFile(req.file);
        return res.status(400).json({
          success: false,
          message: "Teacher details are required",
        });
      }
      req.body = JSON.parse(req.body.teacherData);
      next();
    } catch {
      removeUploadedFile(req.file);
      return res.status(400).json({
        success: false,
        message: "Teacher details must be valid JSON",
      });
    }
  });
};

module.exports.removeUploadedFile = removeUploadedFile;
module.exports.uploadDirectory = uploadDirectory;
