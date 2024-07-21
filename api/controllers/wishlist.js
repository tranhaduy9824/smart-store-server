const Wishlist = require("../models/wishlist");

exports.wishlist_add = async (req, res, next) => {
  try {
    const userId = req.userData.userId;
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId, products: [productId] });
    } else {
      if (!wishlist.products.includes(productId)) {
        wishlist.products.push(productId);
        await wishlist.save();
      }
    }

    res.status(200).json({
      message: "Wishlist added successfully",
      wishlist: wishlist,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.wishlist_get_user = async (req, res, next) => {
  try {
    const { userId } = req.userData;
    const wishlist = await Wishlist.findOne({ userId }).populate("products");

    res.status(200).json({
      message: "Get wishlist successfully",
      wishlist: wishlist,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.wishlist_remove = async (req, res, next) => {
  try {
    const { userId } = req.userData;
    const { productId } = req.body;

    const wishlist = await Wishlist.findOne({ userId });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(
        (id) => id.toString() !== productId
      );
      await wishlist.save();
    }

    res.status(200).json({
      message: "Remove wishlist successfully",
      wishlist: wishlist,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};
