const Order = require("../models/order");
const User = require("../models/user");
const Product = require("../models/product");

exports.orders_create = async (req, res, next) => {
  try {
    const userId = req.userData.userId;
    const { items, paymentMethod, shippingAddress } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let shippingCost = 0;
    let totalPrice = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const itemShippingCost = product.shippingCost || 0;
      shippingCost = Math.max(shippingCost, itemShippingCost);
      totalPrice += item.price;
    }

    totalPrice += shippingCost;

    const order = new Order({
      userId,
      items,
      shippingCost,
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
    console.log(error);
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

    if (order.userId._id.toString() !== req.userData.userId) {
      return res
        .status(403)
        .json({ error: "You don't have permission to access this order" });
    }

    res.status(201).json({
      message: "Get order successfully",
      order: order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.orders_get_by_shop = async (req, res, next) => {
  try {
    const shopId = req.shop._id;

    const orders = await Order.find({
      "items.productId": {
        $in: await Product.find({ shop: shopId }).select("_id"),
      },
    })
      .sort({ updatedAt: -1 })
      .populate("userId")
      .populate("items.productId");

    res.status(201).json({
      message: "Get orders successfully",
      orders: orders,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.orders_get_by_user = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.userData.userId })
      .sort({ updatedAt: -1 })
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
    const { allStatus, paymentMethod, shippingAddress, status } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId)
      .populate("userId")
      .populate("items.productId");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (req.userData.role === "admin") {
      await order.updateOne({ $set: { allStatus } }, { new: true });
    } else if (
      req.userData.role === "user" &&
      req.userData.userId === order.userId?._id.toString()
    ) {
      if (allStatus === "cancelled") {
        await order.updateOne(
          { $set: { allStatus: "cancelled", paymentMethod, shippingAddress } },
          { new: true }
        );
      } else {
        await order.updateOne(
          { $set: { paymentMethod, shippingAddress } },
          { new: true }
        );
      }
    } else if (req?.shop) {      
      const updatedItems = order.items.map((item) => {
        if (req.shop._id.toString() === item.productId.shop._id.toString()) {
          item.status = status;
        }
        return item;
      });

      const allItemsDelivering = updatedItems.every(
        (item) => item.status === "delivering"
      );
      const newAllStatus = allItemsDelivering ? "delivering" : "wait_confirm";

      await order.updateOne(
        { $set: { items: updatedItems, allStatus: newAllStatus } },
        { new: true }
      );
    } else {
      return res.status(403).json({ error: "Invalid user role" });
    }

    res.status(201).json({
      message: "Order successfully updated",
      order: order,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};
