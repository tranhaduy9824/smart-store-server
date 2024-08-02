const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  fullname: { type: "string", required: true },
  email: {
    type: "string",
    required: function () {
      return this.loginType === "email";
    },
    unique: true,
    match:
      /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
  },
  phone: {
    type: String,
    validate: {
      validator: function (v) {
        if (v === "") {
          return true;
        }
        const vietnamesePhoneRegex =
          /^(0|[\+84|84])(3[2-9]|5[689]|7[06-9]|8[1-6]|9[0-4,6-9])[0-9]{7}$/;
        return vietnamesePhoneRegex.test(v);
      },
    },
    default: "",
  },
  password: {
    type: "string",
    required: function () {
      return this.loginType === "email";
    },
  },
  address: [
    {
      fullname: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      specificAddress: { type: String, required: true },
      isDefault: { type: Boolean, required: false },
    },
  ],
  avatar: { type: "string", required: true },
  role: {
    type: String,
    enum: ["admin", "staff", "user"],
    default: "user",
  },
  loginType: {
    type: [String],
    enum: ["email", "facebook", "google"],
    required: true,
    default: ["email"],
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

module.exports = mongoose.model("User", userSchema);
