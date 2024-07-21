const express = require("express");
const router = express.Router();

const CartsController = require("../controllers/carts");
const checkAuth = require("../middleware/check-auth");

router.post("/", checkAuth, CartsController.carts_add);
router.get("/", checkAuth, CartsController.carts_get);
router.patch("/", checkAuth, CartsController.carts_update);
router.delete("/", checkAuth, CartsController.carts_remove);

module.exports = router;
