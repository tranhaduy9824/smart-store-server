const express = require("express");
const router = express.Router();

const CategoryController = require("../controllers/category");
const checkAuth = require("../middleware/check-auth");
const isAdmin = require("../middleware/is-admin");

router.post("/", checkAuth, isAdmin, CategoryController.category_create);
router.get("/", CategoryController.category_get_all);
router.get("/:id", CategoryController.category_get_one);
router.patch("/:id", checkAuth, isAdmin, CategoryController.category_update);
router.delete("/:id", checkAuth, isAdmin, CategoryController.category_delete);

module.exports = router;
