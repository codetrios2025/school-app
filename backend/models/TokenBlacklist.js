const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  token: String,
  createdAt: { type: Date, default: Date.now, expires: 86400 }, // auto delete after 1 day
});

module.exports = mongoose.model("TokenBlacklist", tokenSchema);
