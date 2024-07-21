const Cart = require("../models/cart");
const Product = require("../models/product");

exports.carts_add = async (req, res, next) => {
  try {
    const userId = req.userData.userId
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({
        userId,
        items: [
          {
            productId,
            quantity,
            price: product.price * quantity,
          },
        ],
        totalPrice: product.price * quantity,
      });
      await cart.save();
    } else {
      const existingItem = cart.items.find(
        (item) => item.productId.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity += Number(quantity);
        existingItem.price += product.price * quantity;
      } else {
        cart.items.push({
          productId,
          quantity,
          price: product.price * quantity,
        });
      }

      cart.totalPrice = cart.items.reduce(
        (total, item) => total + item.price,
        0
      );
      await cart.save();
    }

    res.status(200).json(cart);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error,
    });
  }
};

exports.carts_get = async (req, res, next) => {
  try {
    const userId = req.userData.userId;
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    res.status(200).json({
      message: "Cart found",
      cart: cart,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error,
    });
  }
};

exports.carts_update = async (req, res, next) => {
  try {
    const userId = req.userData.userId
    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        error: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Product not found in the cart" });
    }

    const updatedItem = cart.items[itemIndex];
    updatedItem.quantity = quantity;
    updatedItem.price = (await Product.findById(productId)).price * quantity;

    cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);

    await cart.save();
    res.status(200).json({
      message: "Cart updated successfully",
      cart: cart,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error,
    });
  }
};

exports.carts_remove = async (req, res, next) => {
  try {
    const userId = req.userData.userId
    const { productId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Product not found in tbe cart" });
    }

    const removedItem = cart.items.splice(itemIndex, 1)[0];
    cart.totalPrice -= removedItem.price;

    await cart.save();
    res.status(200).json({
      message: "Removed item successfully",
      cart: cart
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error,
    });
  }
};
