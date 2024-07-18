const mongoose = require("mongoose");

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    categorySub: [
      {
        type: String,
        required: true,
        unique: true,
      },
    ],
  },
  {
    timestamp: true,
  }
);

module.exports = mongoose.model('Category', categorySchema);