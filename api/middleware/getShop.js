const Shop = require("../models/shop");

module.exports = async (req, res, next) => {
  try {
    const userId = req.userData.userId;
    const shop = await Shop.findOne({ owner: userId });

    req.shop = shop;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
