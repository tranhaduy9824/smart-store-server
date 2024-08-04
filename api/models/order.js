const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        status: {
          type: String,
          enum: ["wait_confirm", "delivering", "done", "cancelled"],
          default: "wait_confirm",
        },
      },
    ],
    shippingCost: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPrice: { type: Number, required: true, default: 0 },
    allStatus: {
      type: String,
      enum: ["wait_confirm", "delivering", "done", "cancelled"],
      default: "wait_confirm",
    },
    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery", "digital_wallet", "credit_card"],
      required: true,
    },
    shippingAddress: {
      recipientName: { type: String, required: true },
      recipientPhone: { type: String, required: true },
      address: { type: String, required: true },
      specificAddress: { type: String, required: true },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
