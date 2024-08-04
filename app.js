const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require('cors');
const app = express();

app.use(cors());

// Import routes
const userRoutes = require("./api/routes/users");
const productRoutes = require("./api/routes/products");
const cartRoutes = require("./api/routes/carts");
const orderRoutes = require("./api/routes/orders");
const wishlistRoutes = require("./api/routes/wishlist");
const reviewRoutes = require("./api/routes/review");
const categoryRoutes = require("./api/routes/category");
const shopRoutes = require("./api/routes/shops");
const paymentRoutes = require("./api/routes/payment");

mongoose.connect(
  "mongodb+srv://duyth22it:" +
    process.env.MONGO_ATLAS_PW +
    "@smart-store.rtatz6z.mongodb.net/"
);
mongoose.Promise = global.Promise;

app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

// Routes which should handle requests
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/payment", paymentRoutes);

app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

module.exports = app;
