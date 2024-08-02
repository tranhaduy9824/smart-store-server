const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const User = require("../models/user");
const sendEmail = require("../untils/email");
const cloudinary = require("../untils/imageUpload");

const avatarDefault =
  "https://res.cloudinary.com/djhqdss0k/image/upload/v1718700261/avt_default_qnussf.jpg";

exports.users_signup = (req, res, next) => {
  User.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      if (
        !user.loginType.includes("email") &&
        (user.loginType.includes("facebook") ||
          user.loginType.includes("google"))
      ) {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err,
            });
          } else {
            user.password = hash;
            if (!user.loginType.includes("email")) {
              user.loginType.push("email");
            }
            user
              .save()
              .then((result) => {
                console.log(result);
                res.status(200).json({
                  message: "Password and email updated",
                });
              })
              .catch((err) => {
                console.log(err);
                res.status(500).json({
                  error: err,
                });
              });
          }
        });
      } else {
        return res.status(409).json({
          message: "Email exists",
        });
      }
    } else {
      bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) {
          return res.status(500).json({
            error: err,
          });
        } else {
          const user = new User({
            _id: new mongoose.Types.ObjectId(),
            fullname: req.body.fullname,
            email: req.body.email,
            password: hash,
            avatar: avatarDefault,
            loginType: ["email"],
          });
          user
            .save()
            .then((result) => {
              console.log(result);
              res.status(201).json({
                message: "User created",
              });
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({
                error: err,
              });
            });
        }
      });
    }
  });
};

exports.users_login = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res.status(401).json({
          message: "Auth failed",
        });
      }
      bcrypt.compare(req.body.password, user.password, (err, result) => {
        if (err) {
          return res.status(401).json({
            message: "Auth failed",
          });
        }
        if (result) {
          const token = jwt.sign(
            {
              email: user.email,
              userId: user._id,
              role: user.role,
            },
            process.env.JWT_KEY,
            {
              expiresIn: "1h",
            }
          );
          return res.status(200).json({
            message: "Auth successful",
            token: token,
            user: user,
          });
        }
        return res.status(401).json({
          message: "Auth failed",
        });
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
};

exports.facebook_login = (req, res, next) => {
  const { email, name, avatar } = req.body;

  const userEmail =
    email || `noemail_${new mongoose.Types.ObjectId()}@facebook.com`;

  User.findOne({ email: userEmail })
    .then((user) => {
      if (!user) {
        const newUser = new User({
          _id: new mongoose.Types.ObjectId(),
          fullname: name,
          email: userEmail,
          password: null,
          avatar: avatar,
          loginType: ["facebook"],
        });
        return newUser.save();
      } else {
        user.fullname = name;
        if (!user.loginType.includes("facebook")) {
          user.loginType.push("facebook");
        }
        return user.save();
      }
    })
    .then((savedUser) => {
      const token = jwt.sign(
        {
          email: savedUser.email,
          userId: savedUser._id,
          role: savedUser.role,
        },
        process.env.JWT_KEY,
        {
          expiresIn: "1h",
        }
      );
      res.status(200).json({
        message: "Auth successful",
        token: token,
        user: savedUser,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
};

exports.google_login = (req, res, next) => {
  const { email, name } = req.body;

  const userEmail =
    email || `noemail_${new mongoose.Types.ObjectId()}@google.com`;

  User.findOne({ email: userEmail })
    .then((user) => {
      if (!user) {
        const newUser = new User({
          _id: new mongoose.Types.ObjectId(),
          fullname: name,
          email: userEmail,
          password: null,
          avatar: avatarDefault,
          loginType: ["google"],
        });
        return newUser.save();
      } else {
        user.fullname = name;
        if (!user.loginType.includes("google")) {
          user.loginType.push("google");
        }
        return user.save();
      }
    })
    .then((savedUser) => {
      const token = jwt.sign(
        {
          email: savedUser.email,
          userId: savedUser._id,
          role: savedUser.role,
        },
        process.env.JWT_KEY,
        {
          expiresIn: "1h",
        }
      );
      res.status(200).json({
        message: "Auth successful",
        token: token,
        user: savedUser,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
};

exports.forgot_password = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res.status(404).json({
          error: "Email not found",
        });
      } else {
        const token = jwt.sign(
          {
            email: user.email,
            id: user._id,
            role: user.role,
          },
          process.env.JWT_KEY,
          {
            expiresIn: "5m",
          }
        );
        const link = `${process.env.BASE_URL_CLIENT}reset-password/${user._id}/${token}`;
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 5 * 60 * 1000;
        user.save();
        sendEmail(req.body.email, link);
        return res.status(200).json({
          message: "Send email successfully!",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
};

exports.reset_password = (req, res, next) => {
  const { id, token } = req.params;
  const { password } = req.body;
  User.findOne({ _id: id })
    .then((user) => {
      if (user) {
        if (
          user.resetPasswordToken !== token ||
          user.resetPasswordExpires < Date.now()
        ) {
          return res.status(401).json({ message: "Invalid or expired token" });
        } else {
          console.log(req.params);
          bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
              return res.status(500).json({
                error: `Lỗi: ${err}`,
              });
            } else {
              user.password = hash;
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;
              user
                .save()
                .then((result) => {
                  console.log(result);
                  res.status(200).json({
                    message: "Reset password successfully!",
                  });
                })
                .catch((err) => {
                  console.log(err);
                  res.status(500).json({
                    error: err,
                  });
                });
            }
          });
        }
      } else {
        return res.status(404).json({
          message: "User not exist!",
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
};

exports.update_user = async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { fullname, email, phone, password, address, addressId, setDefault } =
      req.body;

    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (password) user.password = await bcrypt.hash(password, 10);

    if (setDefault && addressId) {
      user.address = user.address.map((addr) =>
        addr._id.toString() === addressId
          ? { ...addr, isDefault: true }
          : { ...addr, isDefault: false }
      );
    } else if (addressId && !address) {
      user.address = user.address.filter(
        (addr) => addr._id.toString() !== addressId
      );
    } else if (addressId && address) {
      user.address = user.address.map((addr) =>
        addr._id.toString() === addressId ? { ...addr, ...address } : addr
      );

      if (address.isDefault) {
        user.address = user.address.map((addr) =>
          addr._id.toString() === addressId
            ? { ...addr, isDefault: true }
            : { ...addr, isDefault: false }
        );
      }
    } else if (address) {
      if (address.isDefault) {
        user.address = user.address.map((addr) => ({
          ...addr,
          isDefault: false,
        }));
      }
      user.address.push({ ...address, isDefault: address.isDefault || false });
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        public_id: `${user._id}_avatar`,
      });
      user.avatar = result.secure_url;
      await fs.promises.unlink(req.file.path);
    }

    await user.save();
    res.status(200).json({ message: "Update successful", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.users_get_one = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
};
