const express = require("express");
const router = express.Router();

const CategoryController = require("../controllers/category");

router.post("/", CategoryController.category_create);
router.get("/", CategoryController.category_get_all);
router.get("/:id", CategoryController.category_get_one);
router.patch("/:id", CategoryController.category_update);
router.delete("/:id", CategoryController.category_delete);

module.exports = router;