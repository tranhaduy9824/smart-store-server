const Shop = require("../models/shop");

exports.shop_create = async (req, res) => {
  try {
    const { userId } = req.userData;
    const { name, description, phone, email, address, socialMediaUrls } = req.body;

    const newShop = new Shop({
      owner: userId,
      name,
      description,
      phone,
      email,
      address,
      socialMediaUrls,
    });

    await newShop.save();

    res.status(200).json({
      message: "Shop created successfully",
      newShop: newShop,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.shop_get_all = async (req, res) => {
  try {
    const shops = await Shop.find().populate("owner");

    res.status(200).json({
      message: "Get all shop successfully",
      shops: shops,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.shop_get_one = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate("owner");

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    res.status(200).json({
      message: "Get shop successfully",
      shop: shop,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.get_my_shop = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const shop = await Shop.findOne({ owner: userId });

    res.status(200).json({
      message: "Get shop successfully",
      shop: shop,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

exports.shop_update = async (req, res) => {
  try {
    const { name, description, phone, email, address, socialMediaUrls } =
      req.body;
    const { id } = req.params;
    const { userId } = req.userData;

    const shop = await Shop.findOneAndUpdate(
      { _id: id, owner: userId },
      {
        $set: {
          name,
          description,
          phone,
          email,
          address,
          socialMediaUrls,
        },
      },
      { new: true, runValidators: true }
    );

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    res.status(200).json({
      message: "Updated shop successfully",
      shop: shop,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.shop_delete = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    await shop.deleteOne();
    res.status(200).json({ message: "Shop deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};
