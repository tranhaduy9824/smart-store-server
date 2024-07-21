const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: { type: String, required: true, unique: true },
    description: { type: String },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    socialMediaUrls: {
      facebook: { type: String },
      instagram: { type: String },
      twitter: { type: String },
      tiktok: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Shop", shopSchema);
