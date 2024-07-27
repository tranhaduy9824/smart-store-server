const Category = require("../models/category");

exports.category_create = async (req, res, next) => {
  try {
    const { name, categorySub } = req.body;

    const newCategory = new Category({ name, categorySub });
    await newCategory.save();

    res.status(200).json({
      message: "Category created successfully",
      newCategory: newCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error,
    });
  }
};

exports.category_get_all = async (req, res, next) => {
  try {
    const categories = await Category.find().select("name categorySub");

    res.status(200).json({
      message: "Category get all successfully",
      categories: categories,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error,
    });
  }
};

exports.category_get_one = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id).select("name categorySub");
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({
      message: "Get category successfully",
      category: category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error,
    });
  }
};

exports.category_update = async (req, res, next) => {
  try {
    const { name, categorySub } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, categorySub },
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({
      message: "Category successfully updated",
      category: category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error,
    });
  }
};

exports.category_delete = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({ message: "Category successfully deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error,
    });
  }
};
