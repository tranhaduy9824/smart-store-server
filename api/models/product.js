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
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    status: {
      type: String,
      enum: ["not approved", "approved"],
      default: "not approved",
    },
    inStock: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
