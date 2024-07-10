const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: "string", required: true, trim: true },
    des: { type: "string", required: true, trim: true },
    price: { type: "number", required: true },
    sale: { type: "number", required: true },
    rating: { type: "number", required: true, default: 5 },
    files: {
      photos: {
        type: [String],
        required: false,
      },
      video: {
        type: String,
        required: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);