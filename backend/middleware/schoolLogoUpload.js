const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const uploadDirectory = path.join(__dirname, "..", "storage", "school");
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const removeUploadedFile = (file) => {
  if (!file?.path) return;
  fs.unlink(file.path, (error) => {
    if (error && error.code !== "ENOENT") {
      console.error("Unable to remove rejected school logo:", error);
    }
  });
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${crypto.randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedTypes[extension] !== file.mimetype) {
      return callback(new Error("School logo must be a JPG, PNG, or WebP image"));
    }
    callback(null, true);
  },
});

module.exports = (req, res, next) => {
  upload.single("logo")(req, res, (error) => {
    if (error) {
      removeUploadedFile(req.file);
      return res.status(400).json({
        success: false,
        message:
          error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
            ? "School logo must be 2 MB or smaller"
            : error.message,
      });
    }
    next();
  });
};

module.exports.removeUploadedFile = removeUploadedFile;
module.exports.uploadDirectory = uploadDirectory;
