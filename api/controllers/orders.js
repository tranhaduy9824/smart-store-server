const mongoose = require("mongoose");
const Order = require("../models/order");
const User = require("../models/user");
const Product = require("../models/product");

exports.orders_create = async (req, res, next) => {
  try {
    const { userId, items, paymentMethod, shippingAddress } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let totalPrice = 0;
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      totalPrice += item.price;
    }

    const order = new Order({
      userId,
      items,
      totalPrice,
      paymentMethod,
      shippingAddress,
    });
    await order.save();
    res.status(201).json({
      messsage: "Order created successfully",
      order: order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.orders_get_by_id = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId")
      .populate("items.productId");
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(201).json({
      message: "Get order successfully",
      order: order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.orders_get_by_user = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.query.userId })
      .populate("userId")
      .populate("items.productId");

    res.status(201).json({
      message: "Get orders successfully",
      orders: orders,
    });
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
};

exports.orders_update = async (req, res, next) => {
  try {
    const { status, paymentMethod, shippingAddress } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, paymentMethod, shippingAddress },
      { new: true }
    )
      .populate("userId")
      .populate("items.productId");
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.status(201).json({
      message: "Order successfully updated",
      order: order,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
