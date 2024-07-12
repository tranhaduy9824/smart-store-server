const express = require("express");
const router = express.Router();

const OrdersController = require("../controllers/orders");

router.post("/", OrdersController.orders_create);
router.get("/:id", OrdersController.orders_get_by_id);
router.get("/", OrdersController.orders_get_by_user);
router.patch("/:id", OrdersController.orders_update);

module.exports = router;
