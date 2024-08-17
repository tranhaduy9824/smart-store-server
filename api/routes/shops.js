const express = require("express");
const router = express.Router();

const ShopController = require("../controllers/shops");
const checkAuth = require("../middleware/check-auth");
const isAdmin = require("../middleware/is-admin");

router.post("/", checkAuth, ShopController.shop_create);
router.get("/", ShopController.shop_get_all);
router.get("/my-shop", checkAuth, ShopController.get_my_shop);
router.get("/:id", ShopController.shop_get_one);
router.patch("/:id", checkAuth, ShopController.shop_update);
router.delete("/:id", checkAuth, isAdmin, ShopController.shop_delete);

module.exports = router;